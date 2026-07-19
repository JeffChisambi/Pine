import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Platform,
  StyleSheet,
  Image,
  ImageSourcePropType,
  ActivityIndicator,
  useWindowDimensions,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { StockData } from "../data/stocks";
import { useAuth } from "../../services/auth-context";
import { stocksApi, type ApiStock } from "../../services/api";
import {
  useWalletBalance,
  useWalletQueryClient,
  reconcileDepositCredit,
  setOptimisticBalance,
  loadPendingDeposit,
  clearPendingDeposit,
  savePendingDeposit,
  WALLET_BALANCE_QUERY_KEY,
} from "../../services/wallet-queries";
import { getStockLogo } from "../../utils/stock-logos";
import Svg, {
  Path,
  Circle,
  Rect,
  Line,
  Defs,
  ClipPath,
  LinearGradient,
  Stop,
} from "react-native-svg";
import { useColors } from "@/hooks/useColors";

// ─── Static brand tokens ────────────────────────────────────────────────────────
const TEAL = "#164951";
const TEAL_MED = "#2D5B62";
const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";
const MUTED2 = "#6B7280";
const RED = "#EF4770";

type Colors = ReturnType<typeof useColors>;

// ─── Notification bell ─────────────────────────────────────────────────────────
function NotificationIcon() {
  return (
    <Svg width={44} height={44} viewBox="307 58 44 44">
      <Rect x={307} y={58} width={44} height={44} rx={22} stroke={TEAL_MED} strokeWidth={1} fill="none" />
      <Path d="M329.017 72.425C326.258 72.425 324.017 74.6667 324.017 77.425V79.8334C324.017 80.3417 323.8 81.1167 323.542 81.55L322.583 83.1417C321.992 84.125 322.4 85.2167 323.483 85.5834C327.075 86.7834 330.95 86.7834 334.542 85.5834C335.55 85.25 335.992 84.0584 335.442 83.1417L334.483 81.55C334.233 81.1167 334.017 80.3417 334.017 79.8334V77.425C334.017 74.675 331.767 72.425 329.017 72.425Z"
        stroke={WHITE} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" fill="none" />
      <Path d="M330.558 72.6667C330.3 72.5917 330.033 72.5334 329.767 72.5084C328.967 72.4084 328.2 72.4667 327.483 72.6667C327.717 72.0667 328.317 71.6667 329.017 71.6667C329.717 71.6667 330.317 72.0667 330.558 72.6667Z"
        stroke={WHITE} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M331.517 85.8833C331.517 87.0583 330.592 88 329.392 88C328.8 88 328.25 87.75 327.858 87.3583C327.467 86.9667 327.217 86.4167 327.217 85.8833"
        stroke={WHITE} strokeWidth={1.5} fill="none" />
      <Circle cx={335} cy={75} r={4.75} fill={RED} stroke={TEAL} strokeWidth={1.5} />
    </Svg>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <Svg width={22} height={18} viewBox="-1 -1 22 17">
        <Path d="M10 0.5C5.5 0.5 1.73 3.61 0.5 7.5C1.73 11.39 5.5 14.5 10 14.5C14.5 14.5 18.27 11.39 19.5 7.5C18.27 3.61 14.5 0.5 10 0.5Z" stroke={WHITE} strokeWidth={1.5} strokeLinecap="round" fill="none" />
        <Path d="M10 10.5C11.6569 10.5 13 9.15685 13 7.5C13 5.84315 11.6569 4.5 10 4.5C8.34315 4.5 7 5.84315 7 7.5C7 9.15685 8.34315 10.5 10 10.5Z" stroke={WHITE} strokeWidth={1.5} fill="none" />
      </Svg>
    );
  }
  return (
    <Svg width={22} height={20} viewBox="-1 -1 24 20">
      <Path d="M1 1L21 17" stroke={WHITE} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M8.5 3.5C9.3 3.19 10.1 3 11 3C15.5 3 19.27 6.11 20.5 10C20.1 11.27 19.44 12.43 18.57 13.4M5.43 5.43C3.28 6.88 1.77 9.27 1.5 10C2.73 13.89 6.5 17 11 17C13.22 17 15.27 16.2 16.9 14.83"
        stroke={WHITE} strokeWidth={1.5} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

function ArrowCircleUp({ color = GREEN, size = 13 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 13 13">
      <Path d="M6.5 12.833C10.09 12.833 13 9.924 13 6.333C13 2.743 10.09 -0.167 6.5 -0.167C2.91 -0.167 0 2.743 0 6.333C0 9.924 2.91 12.833 6.5 12.833ZM4.132 6.241L6.191 4.182C6.36 4.013 6.64 4.013 6.809 4.182L8.868 6.241C9.037 6.41 9.037 6.69 8.868 6.859C8.699 7.028 8.419 7.028 8.25 6.859L6.5 5.109L4.75 6.859C4.581 7.028 4.301 7.028 4.132 6.859C3.963 6.69 3.963 6.41 4.132 6.241Z" fill={color} />
    </Svg>
  );
}

function ArrowCircleDown({ color = RED, size = 13 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 13 13" style={{ transform: [{ rotate: "180deg" }] }}>
      <Path d="M6.5 12.833C10.09 12.833 13 9.924 13 6.333C13 2.743 10.09 -0.167 6.5 -0.167C2.91 -0.167 0 2.743 0 6.333C0 9.924 2.91 12.833 6.5 12.833ZM4.132 6.241L6.191 4.182C6.36 4.013 6.64 4.013 6.809 4.182L8.868 6.241C9.037 6.41 9.037 6.69 8.868 6.859C8.699 7.028 8.419 7.028 8.25 6.859L6.5 5.109L4.75 6.859C4.581 7.028 4.301 7.028 4.132 6.859C3.963 6.69 3.963 6.41 4.132 6.241Z" fill={color} />
    </Svg>
  );
}

function AddCircleIcon({ color = WHITE }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Path d="M10 18.333C14.602 18.333 18.333 14.602 18.333 10C18.333 5.398 14.602 1.667 10 1.667C5.398 1.667 1.667 5.398 1.667 10C1.667 14.602 5.398 18.333 10 18.333Z" stroke={color} strokeWidth={1.5} fill="none" />
      <Path d="M6.667 10H13.333" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M10 13.333V6.667" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function ImportIcon({ color = WHITE }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M7.76666 9.7334L9.9 11.8667L12.0333 9.7334" stroke={color} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9.90002 3.33325V11.8083" stroke={color} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16.6666 10.1499C16.6666 13.8332 14.1666 16.8166 9.99998 16.8166C5.83331 16.8166 3.33331 13.8332 3.33331 10.1499" stroke={color} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TrashIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke={WHITE} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Sparklines ────────────────────────────────────────────────────────────────
const SPARKLINES_UP = [
  "M0.5 25 L5 17 L7 20 L10 13 L15 8 L17 37 L19 31 H30 L33 21 L35 23 L37 15 L40 18 L44 19 L47 28 L51 0 L52 9 L55 12 L56 21 L58 16 H63 L64 33 L66 36 L68 52 L70 44 L72 42 L73 36 L76 34 L77 28 L80 27 L82 19 L84 22 H88",
  "M0 30 L8 25 L15 28 L20 20 L28 15 L35 18 L40 10 L47 15 L54 8 L58 5 L65 12 L70 8 L76 18 L82 12 L88 8",
];
const SPARKLINES_DOWN = [
  "M0 10 L8 15 L15 12 L20 22 L28 28 L35 25 L40 35 L47 30 L54 40 L58 45 L65 38 L70 44 L76 36 L82 42 L88 48",
  "M0 5 L8 12 L15 10 L20 18 L28 25 L35 22 L40 30 L44 24 L50 35 L58 42 L65 38 L70 45 L76 40 L82 46 L88 52",
];

function TrendSparkline({ positive, idx }: { positive: boolean; idx: number }) {
  const paths = positive ? SPARKLINES_UP : SPARKLINES_DOWN;
  const path = paths[idx % paths.length];
  const topId = `tc-top-${idx}`;
  const botId = `tc-bot-${idx}`;
  return (
    <Svg width={88} height={52} viewBox="0 0 88 52" fill="none">
      <Defs>
        <ClipPath id={topId}><Rect x="0" y="0" width="88" height="26" /></ClipPath>
        <ClipPath id={botId}><Rect x="0" y="26" width="88" height="26" /></ClipPath>
      </Defs>
      <Line x1="0" y1="26" x2="88" y2="26" stroke="#D1D5DB" strokeWidth={1} strokeDasharray="3 3" strokeLinecap="round" />
      <Path d={path} stroke={GREEN} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" clipPath={`url(#${topId})`} />
      <Path d={path} stroke={RED} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" clipPath={`url(#${botId})`} />
    </Svg>
  );
}

const REVEAL_WIDTH = 88;

interface WatchCardProps {
  logoImg: ImageSourcePropType;
  symbol: string;
  name: string;
  type: string;
  price: string;
  change: string;
  positive: boolean;
  onDelete?: () => void;
  c: Colors;
}

function SwipeableWatchCard({ logoImg, symbol, name, type, price, change, positive, onDelete, c }: WatchCardProps) {
  const translateX = useSharedValue(0);
  const isOpen = useSharedValue(false);

  const dismiss = useCallback(() => {
    translateX.value = withTiming(0, { duration: 200 });
    isOpen.value = false;
  }, []);

  const open = useCallback(() => {
    translateX.value = withTiming(-REVEAL_WIDTH, { duration: 200 });
    isOpen.value = true;
  }, []);

  const collapse = useCallback(() => {
    translateX.value = withTiming(-500, { duration: 220 }, () => {
      runOnJS(onDelete ?? (() => {}))();
    });
  }, [onDelete]);

  const pan = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .failOffsetY([-10, 10])
    .onUpdate((e) => {
      const base = isOpen.value ? -REVEAL_WIDTH : 0;
      translateX.value = Math.min(0, Math.max(-REVEAL_WIDTH, base + e.translationX));
    })
    .onEnd((e) => {
      const base = isOpen.value ? -REVEAL_WIDTH : 0;
      const projected = base + e.translationX + e.velocityX * 0.12;
      if (projected < -REVEAL_WIDTH / 2) {
        runOnJS(open)();
      } else {
        runOnJS(dismiss)();
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => {
    const progress = interpolate(translateX.value, [-REVEAL_WIDTH, 0], [1, 0], Extrapolation.CLAMP);
    return {
      opacity: progress,
      transform: [{ scale: interpolate(progress, [0, 1], [0.7, 1], Extrapolation.CLAMP) }],
    };
  });

  return (
    <View style={{ marginBottom: 12, borderRadius: 16, overflow: "hidden" }}>
      {/* Red layer fills full width — no gap as the card slides away */}
      <View style={{
        position: "absolute", left: 0, right: 0, top: 0, bottom: 0,
        backgroundColor: "#EF4770", alignItems: "flex-end", justifyContent: "center",
        paddingRight: REVEAL_WIDTH / 2 - 16,
      }}>
        <ReAnimated.View style={[{ alignItems: "center" }, buttonStyle]}>
          <TouchableOpacity onPress={collapse} activeOpacity={0.75}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{ alignItems: "center" }}>
            <TrashIcon />
            <Text style={{ color: WHITE, fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 11, marginTop: 5, letterSpacing: 0.2 }}>Remove</Text>
          </TouchableOpacity>
        </ReAnimated.View>
      </View>

      <GestureDetector gesture={pan}>
        {/* Animated card — background fills corners so they never bleed */}
        <ReAnimated.View style={[cardStyle, {
          backgroundColor: c.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: c.border,
        }]}>
          <TouchableOpacity activeOpacity={1} onPress={() => {
            if (isOpen.value) { dismiss(); } else { router.push(`/stock/${symbol}`); }
          }}>
            <View style={{
              height: 77,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1, marginRight: 12 }}>
                <View style={{
                  width: 44, height: 44, borderRadius: 22, backgroundColor: c.background,
                  borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center", overflow: "hidden",
                }}>
                  {logoImg ? (
                    <Image source={logoImg} style={{ width: 40, height: 40, borderRadius: 20 }} resizeMode="contain" />
                  ) : (
                    <View style={{ width: 40, height: 40, backgroundColor: TEAL, alignItems: "center", justifyContent: "center", borderRadius: 20 }}>
                      <Text style={{ color: WHITE, fontFamily: "PlusJakartaSans_700Bold", fontSize: 11 }}>{symbol.slice(0, 3)}</Text>
                    </View>
                  )}
                </View>
                <View style={{ gap: 3, flex: 1 }}>
                  <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: c.text }}>{symbol}</Text>
                  <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }} numberOfLines={1}>
                    {name}<Text style={{ color: MUTED }}> · </Text>{type}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: c.text }}>{price}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                  <View style={{ width: 12, height: 12, alignItems: "center", justifyContent: "center" }}>
                    {positive ? <ArrowCircleUp color={GREEN} size={12} /> : <ArrowCircleDown size={12} />}
                  </View>
                  <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 12, lineHeight: 12, color: positive ? GREEN : RED }}>{change}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </ReAnimated.View>
      </GestureDetector>
    </View>
  );
}

interface TrendCardProps {
  logoImg: ImageSourcePropType;
  symbol: string;
  name: string;
  price: string;
  changePctNum?: number;
  change: string;
  positive: boolean;
  idx: number;
  c: Colors;
}

function TrendCard({ logoImg, symbol, name, price, changePctNum, change, positive, idx, c }: TrendCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push(`/stock/${symbol}`)}
      style={{
        width: 240, height: 134,
        backgroundColor: c.card,
        borderRadius: 12, borderWidth: 1, borderColor: c.border,
        paddingHorizontal: 16, paddingVertical: 14, justifyContent: "space-between",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.background, borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {logoImg ? (
            <Image source={logoImg} style={{ width: 32, height: 32, borderRadius: 16 }} resizeMode="contain" />
          ) : (
            <View style={{ width: 32, height: 32, backgroundColor: TEAL, alignItems: "center", justifyContent: "center", borderRadius: 16 }}>
              <Text style={{ color: WHITE, fontFamily: "PlusJakartaSans_700Bold", fontSize: 10 }}>{symbol.slice(0, 2)}</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text }} numberOfLines={1}>{symbol}</Text>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: MUTED, marginTop: 1 }} numberOfLines={1}>{name}</Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 17, color: c.text, marginBottom: 5 }} numberOfLines={1}>{price}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            {positive ? <ArrowCircleUp color={GREEN} size={14} /> : <ArrowCircleDown size={14} />}
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 12, color: positive ? GREEN : RED }}>
              {changePctNum !== undefined ? `${changePctNum > 0 ? "+" : ""}${changePctNum.toFixed(2)}%` : change}
            </Text>
          </View>
        </View>
        <TrendSparkline positive={positive} idx={idx} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 44;
  const { width: screenWidth } = useWindowDimensions();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const c = useColors();

  const searchParams = useLocalSearchParams<{
    depositSuccess?: string;
    depositAmount?: string;
    depositTxRef?: string;
  }>();
  const [depositToast, setDepositToast] = useState<{ visible: boolean; amount: string }>({ visible: false, amount: "" });
  const toastShownRef = useRef(false);

  const { user } = useAuth();
  const userFirstName = user?.firstName ?? null;
  const currentDate = new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  const qc = useWalletQueryClient();
  const { data: walletBalance, refetch: refetchBalance } = useWalletBalance();
  const totalBalance = walletBalance
    ? `K ${Number(walletBalance.availableBalance || walletBalance.balance || 0).toLocaleString()}`
    : null;

  const [allStocks, setAllStocks] = useState<StockData[]>([]);
  const [watchlist, setWatchlist] = useState<StockData[]>([]);
  const [watchlistTickers, setWatchlistTickers] = useState<Set<string>>(new Set());
  // null = not yet read from storage; false = key absent (fresh install); true = key exists (respect whatever is stored, even empty)
  const [watchlistKeyExists, setWatchlistKeyExists] = useState<boolean | null>(null);
  const [trending, setTrending] = useState<StockData[]>([]);
  const [losers, setLosers] = useState<StockData[]>([]);
  const [bannerPage, setBannerPage] = useState(0);
  const bannerScrollRef = useRef<ScrollView>(null);
  const MAX_WATCHLIST = 4;
  const WATCHLIST_KEY = "@pine_watchlist_tickers";

  const reconcileRef = useRef(false);
  const reconcilingRef = useRef(false);

  useEffect(() => {
    if (reconcileRef.current) return;
    const fromNav = searchParams.depositSuccess === "true" && !!searchParams.depositAmount;
    reconcileRef.current = true;
    (async () => {
      let amount: number | null = null;
      let txRef: string | undefined;
      let prevAvailable: number | null = null;
      const pending = await loadPendingDeposit();
      if (fromNav) {
        amount = Number(String(searchParams.depositAmount).replace(/,/g, "")) || 0;
        txRef = searchParams.depositTxRef ?? pending?.txRef;
        if (pending && (!txRef || pending.txRef === txRef)) { prevAvailable = pending.prevAvailable; }
      } else {
        if (!pending) return;
        amount = pending.amount; txRef = pending.txRef; prevAvailable = pending.prevAvailable;
      }
      if (!amount || amount <= 0) { reconcileRef.current = false; return; }
      if (fromNav && !toastShownRef.current) {
        toastShownRef.current = true;
        setDepositToast({ visible: true, amount: String(searchParams.depositAmount) });
        setTimeout(() => setDepositToast({ visible: false, amount: "" }), 4000);
      }
      if (prevAvailable === null) {
        const cached = walletBalance;
        prevAvailable = Number(cached?.availableBalance ?? cached?.balance ?? 0);
        if (txRef) { await savePendingDeposit({ txRef, amount, prevAvailable, createdAt: Date.now() }); }
      }
      await qc.cancelQueries({ queryKey: WALLET_BALANCE_QUERY_KEY });
      reconcilingRef.current = true;
      const revertOptimistic = setOptimisticBalance(qc, amount);
      const outcome = await reconcileDepositCredit(qc, { expectedIncrement: amount, prevAvailable });
      reconcilingRef.current = false;
      if (outcome.status === "reflected") {
        await clearPendingDeposit();
      } else {
        void revertOptimistic;
      }
    })().catch(() => {});
  }, [searchParams.depositSuccess, searchParams.depositAmount, searchParams.depositTxRef, walletBalance, qc]);

  useEffect(() => {
    AsyncStorage.getItem(WATCHLIST_KEY)
      .then((val) => {
        if (val !== null) {
          setWatchlistKeyExists(true);
          setWatchlistTickers(new Set(JSON.parse(val)));
        } else {
          setWatchlistKeyExists(false); // fresh install — auto-fill is allowed
        }
      })
      .catch(() => { setWatchlistKeyExists(false); });
  }, []);

  const saveWatchlist = useCallback((tickers: Set<string>) => {
    AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify([...tickers])).catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => {
    if (!reconcilingRef.current) { refetchBalance(); }
  }, [refetchBalance]));

  useEffect(() => {
    stocksApi.list()
      .then((stocks) => {
        const mapped: StockData[] = stocks.map((s: ApiStock) => ({
          id: s.id, ticker: s.symbol, name: s.name, logo: getStockLogo(s.symbol),
          price: s.price, change: s.change, positive: s.positive, changePctNum: s.changePct,
        }));
        setAllStocks(mapped);
        const sorted = [...mapped].sort((a, b) => (b.changePctNum ?? 0) - (a.changePctNum ?? 0));
        setTrending(sorted.slice(0, 6));
        setLosers([...sorted].reverse().slice(0, 6));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (allStocks.length === 0 || watchlistKeyExists === null) return;
    if (watchlistKeyExists === false) {
      // Fresh install — seed with defaults and mark key as existing
      const defaultTickers = new Set(allStocks.slice(0, MAX_WATCHLIST).map((s) => s.ticker));
      setWatchlistTickers(defaultTickers);
      setWatchlist(allStocks.slice(0, MAX_WATCHLIST));
      saveWatchlist(defaultTickers);
      setWatchlistKeyExists(true);
    } else {
      // Key exists — always respect what's stored, even if empty
      setWatchlist(allStocks.filter((s) => watchlistTickers.has(s.ticker)));
    }
  }, [allStocks, watchlistTickers, watchlistKeyExists, saveWatchlist]);

  const removeFromWatchlist = (ticker: string) => {
    const next = new Set(watchlistTickers);
    next.delete(ticker);
    setWatchlistTickers(next);
    saveWatchlist(next);
  };

  return (
    <View style={{ flex: 1, backgroundColor: TEAL }}>
      {/* Teal header */}
      <View style={{ backgroundColor: TEAL, paddingHorizontal: 20, paddingBottom: 16, paddingTop: topPad }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 26 }}>
          <View>
            <Text style={{ fontSize: 20, color: WHITE, lineHeight: 28 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_400Regular" }}>Hi, </Text>
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}>{userFirstName ?? "Welcome"}</Text>
            </Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: WHITE, opacity: 0.7, lineHeight: 20, marginTop: 2 }}>{currentDate}</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/profile/notifications" as any)}>
            <NotificationIcon />
          </TouchableOpacity>
        </View>

        {/* Balance card */}
        <View style={{ backgroundColor: GREEN, borderRadius: 16, padding: 20, gap: 28 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 12, color: WHITE, opacity: 0.8, letterSpacing: 1, marginBottom: 4 }}>TOTAL BALANCE</Text>
              <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 34, color: WHITE, letterSpacing: -0.5 }} adjustsFontSizeToFit numberOfLines={1}>
                {balanceVisible ? (totalBalance ?? "—") : "K  ••••••"}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setBalanceVisible((v) => !v)} activeOpacity={0.7} style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" }}>
              <EyeIcon visible={balanceVisible} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity style={{ flex: 1, backgroundColor: WHITE, borderRadius: 12, height: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }} activeOpacity={0.85} onPress={() => router.push("/deposit")}>
              <AddCircleIcon color={GREEN} />
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: GREEN }}>Deposit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, borderRadius: 12, height: 48, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.25)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }} activeOpacity={0.85} onPress={() => router.push("/withdraw" as any)}>
              <ImportIcon color={WHITE} />
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: WHITE }}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Deposit toast */}
      {depositToast.visible && (
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: GREEN, marginHorizontal: 20, marginTop: 12, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
            <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
              <Circle cx={10} cy={10} r={10} fill={WHITE} />
              <Path d="M6 10l3 3 5-5" stroke={GREEN} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 14, color: WHITE, lineHeight: 20 }}>Deposit Successful!</Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 17 }}>MK {depositToast.amount} has been added to your wallet.</Text>
          </View>
          <TouchableOpacity onPress={() => setDepositToast({ visible: false, amount: "" })} hitSlop={12}>
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
              <Path d="M4 4l8 8M12 4l-8 8" stroke={WHITE} strokeWidth={1.5} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        </View>
      )}

      {/* White/dark sheet */}
      <View style={{ flex: 1, backgroundColor: c.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: 12, overflow: "hidden" }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={{ backgroundColor: c.background, paddingHorizontal: 20, paddingTop: 24 }}>
            {/* Watchlist */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text }}>Watchlist</Text>
              <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: MUTED2 }}>{watchlistTickers.size}/{MAX_WATCHLIST}</Text>
            </View>

            {watchlist.length === 0 ? (
              <View style={{ paddingVertical: 24, alignItems: "center" }}>
                <Text style={{ color: MUTED, fontFamily: "PlusJakartaSans_400Regular", fontSize: 13 }}>No stocks in watchlist.{"\n"}Add from a stock detail page.</Text>
              </View>
            ) : (
              watchlist.map((item) => (
                <SwipeableWatchCard
                  key={item.ticker}
                  logoImg={item.logo}
                  symbol={item.ticker}
                  name={item.name}
                  type="Stock"
                  price={item.price}
                  change={item.change}
                  positive={item.positive}
                  onDelete={() => removeFromWatchlist(item.ticker)}
                  c={c}
                />
              ))
            )}

            {/* Trending */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, marginTop: 28 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text }}>Gainers</Text>
              <TouchableOpacity><Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: MUTED2 }}>See all</Text></TouchableOpacity>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingLeft: 24, paddingRight: 8 }}>
            {trending.length === 0 ? (
              <View style={{ width: 300, paddingVertical: 24, alignItems: "center" }}>
                <Text style={{ color: MUTED }}>Loading trending stocks...</Text>
              </View>
            ) : (
              trending.map((item, idx) => (
                <TrendCard
                  key={item.ticker}
                  logoImg={item.logo}
                  symbol={item.ticker}
                  name={item.name}
                  price={item.price}
                  change={item.change}
                  changePctNum={item.changePctNum}
                  positive={item.positive}
                  idx={idx}
                  c={c}
                />
              ))
            )}
          </ScrollView>

          {/* Losers */}
          <View style={{ paddingHorizontal: 20 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, marginTop: 28 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text }}>Losers</Text>
              <TouchableOpacity><Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: MUTED2 }}>See all</Text></TouchableOpacity>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingLeft: 24, paddingRight: 8 }}>
            {losers.length === 0 ? (
              <View style={{ width: 300, paddingVertical: 24, alignItems: "center" }}>
                <Text style={{ color: MUTED }}>Loading losers...</Text>
              </View>
            ) : (
              losers.map((item, idx) => (
                <TrendCard
                  key={item.ticker}
                  logoImg={item.logo}
                  symbol={item.ticker}
                  name={item.name}
                  price={item.price}
                  change={item.change}
                  changePctNum={item.changePctNum}
                  positive={item.positive}
                  idx={idx}
                  c={c}
                />
              ))
            )}
          </ScrollView>

          {/* News banner carousel — one card visible at a time */}
          {(() => {
            const BANNER_ITEMS = [
              {
                id: "1",
                title: "FDH Bank Doubles Profit to MWK 148 Billion in FY2025",
                summary: "Net interest income surged 82% and total assets crossed MWK 1.6 trillion as FDH Bank reports its strongest annual performance on record.",
                image: require("../../attached_assets/fdh_1784363470714.png"),
              },
              {
                id: "2",
                title: "NITL Posts MWK 202 Billion Profit as MSE Returns 247%",
                summary: "National Investment Trust recorded a 579% jump in net profit driven by record fair value gains as the Malawi Stock Exchange delivered its best year ever.",
                image: require("../../attached_assets/NTL_1784364351667.png"),
              },
              {
                id: "3",
                title: "NICO Holdings Profit Surges 141% to MWK 323.5 Billion",
                summary: "Gross revenue climbed 74% to MWK 919.3 billion as NBS Bank and NICO Life drove record results across the Group's diversified portfolio.",
                image: { uri: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80" },
              },
            ];
            const cardWidth = screenWidth - 40;
            return (
              <View style={{ marginTop: 28, marginHorizontal: 20 }}>
                {/* ScrollView sized exactly to one card — pagingEnabled pages by this width */}
                <ScrollView
                  ref={bannerScrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
                    setBannerPage(Math.round(e.nativeEvent.contentOffset.x / cardWidth));
                  }}
                >
                  {BANNER_ITEMS.map((item) => (
                    <View
                      key={item.id}
                      style={{
                        width: cardWidth,
                        height: 200,
                        backgroundColor: TEAL,
                        borderRadius: 16,
                        overflow: "hidden",
                        flexDirection: "row",
                      }}
                    >
                      {/* Left: text */}
                      <View style={{ flex: 1, padding: 18, justifyContent: "space-between" }}>
                        <View>
                          <Text
                            style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: WHITE, lineHeight: 22, marginBottom: 8 }}
                            numberOfLines={3}
                          >
                            {item.title}
                          </Text>
                          <Text
                            style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 18 }}
                            numberOfLines={3}
                          >
                            {item.summary}
                          </Text>
                        </View>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => router.push("/(tabs)/news" as any)}
                          style={{
                            backgroundColor: GREEN,
                            borderRadius: 10,
                            paddingVertical: 10,
                            alignItems: "center",
                            marginTop: 12,
                          }}
                        >
                          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: WHITE }}>Read more</Text>
                        </TouchableOpacity>
                      </View>
                      {/* Right: image */}
                      <View style={{ width: 130, margin: 10, borderRadius: 12, overflow: "hidden" }}>
                        <Image source={item.image} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                      </View>
                    </View>
                  ))}
                </ScrollView>

                {/* Pagination dots */}
                <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 10 }}>
                  {BANNER_ITEMS.map((_, i) => (
                    <View
                      key={i}
                      style={{
                        width: i === bannerPage ? 20 : 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: i === bannerPage ? GREEN : "rgba(100,120,130,0.35)",
                      }}
                    />
                  ))}
                </View>
              </View>
            );
          })()}

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </View>
  );
}

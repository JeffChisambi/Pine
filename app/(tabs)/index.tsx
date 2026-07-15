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
  Animated,
  PanResponder,
} from "react-native";
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
  LinearGradient,
  RadialGradient,
  Stop,
} from "react-native-svg";

const TEAL = "#164951";
const TEAL_MED = "#2D5B62";
const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const DARK = "#111827";
const MUTED = "#9CA3AF";
const MUTED2 = "#6B7280";
const LIGHT_BG = "#F9FAFB";
const LIGHT_BORDER = "#F3F4F6";
const RED = "#EF4770";
const NBM_BLUE = "#1A3A6B";
const OM_GREEN = "#4CAF50";
const NBS_RED = "#C62828";
const GAME_PINK = "#D81B8B";

// ─── Notification bell (exact paths from SVG design) ─────────────────────────
function NotificationIcon() {
  return (
    <Svg width={44} height={44} viewBox="307 58 44 44">
      <Rect x={307} y={58} width={44} height={44} rx={22} stroke={TEAL_MED} strokeWidth={1} fill="none" />
      <Path
        d="M329.017 72.425C326.258 72.425 324.017 74.6667 324.017 77.425V79.8334C324.017 80.3417 323.8 81.1167 323.542 81.55L322.583 83.1417C321.992 84.125 322.4 85.2167 323.483 85.5834C327.075 86.7834 330.95 86.7834 334.542 85.5834C335.55 85.25 335.992 84.0584 335.442 83.1417L334.483 81.55C334.233 81.1167 334.017 80.3417 334.017 79.8334V77.425C334.017 74.675 331.767 72.425 329.017 72.425Z"
        stroke={WHITE} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" fill="none"
      />
      <Path
        d="M330.558 72.6667C330.3 72.5917 330.033 72.5334 329.767 72.5084C328.967 72.4084 328.2 72.4667 327.483 72.6667C327.717 72.0667 328.317 71.6667 329.017 71.6667C329.717 71.6667 330.317 72.0667 330.558 72.6667Z"
        stroke={WHITE} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
      <Path
        d="M331.517 85.8833C331.517 87.0583 330.592 88 329.392 88C328.8 88 328.25 87.75 327.858 87.3583C327.467 86.9667 327.217 86.4167 327.217 85.8833"
        stroke={WHITE} strokeWidth={1.5} fill="none"
      />
      <Circle cx={335} cy={75} r={4.75} fill={RED} stroke={TEAL} strokeWidth={1.5} />
    </Svg>
  );
}

// ─── Eye icon ─────────────────────────────────────────────────────────────────
function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <Svg width={22} height={18} viewBox="-1 -1 22 17">
        <Path d="M10 0.5C5.5 0.5 1.73 3.61 0.5 7.5C1.73 11.39 5.5 14.5 10 14.5C14.5 14.5 18.27 11.39 19.5 7.5C18.27 3.61 14.5 0.5 10 0.5Z"
          stroke={WHITE} strokeWidth={1.5} strokeLinecap="round" fill="none" />
        <Path d="M10 10.5C11.6569 10.5 13 9.15685 13 7.5C13 5.84315 11.6569 4.5 10 4.5C8.34315 4.5 7 5.84315 7 7.5C7 9.15685 8.34315 10.5 10 10.5Z"
          stroke={WHITE} strokeWidth={1.5} fill="none" />
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

// ─── Arrow-circle icons ────────────────────────────────────────────────────────
function ArrowCircleUp({ color = WHITE, size = 13 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 13 13">
      <Path d="M6.5 0C2.91 0 0 2.91 0 6.5C0 10.09 2.91 13 6.5 13C10.09 13 13 10.09 13 6.5C13 2.91 10.09 0 6.5 0ZM9.03 6.67C8.86 6.84 8.58 6.84 8.41 6.67L7 5.26V9.36C7 9.63 6.78 9.85 6.5 9.85C6.22 9.85 6 9.63 6 9.36V5.26L4.59 6.67C4.42 6.84 4.14 6.84 3.97 6.67C3.8 6.5 3.8 6.22 3.97 6.05L6.18 3.84C6.35 3.67 6.63 3.67 6.8 3.84L9.01 6.05C9.2 6.22 9.2 6.5 9.03 6.67Z"
        fill={color} />
    </Svg>
  );
}

function ArrowCircleDown({ size = 13 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 13 13">
      <Path d="M6.5 12.833C10.09 12.833 13 9.924 13 6.333C13 2.743 10.09 -0.167 6.5 -0.167C2.91 -0.167 0 2.743 0 6.333C0 9.924 2.91 12.833 6.5 12.833ZM4.132 6.241L6.191 4.182C6.36 4.013 6.64 4.013 6.809 4.182L8.868 6.241C9.037 6.41 9.037 6.69 8.868 6.859C8.699 7.028 8.419 7.028 8.25 6.859L6.5 5.109L4.75 6.859C4.581 7.028 4.301 7.028 4.132 6.859C3.963 6.69 3.963 6.41 4.132 6.241Z"
        fill={RED} />
    </Svg>
  );
}

// ─── Add-circle (Deposit) ─────────────────────────────────────────────────────
function AddCircleIcon({ color = WHITE }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Path d="M10 18.333C14.602 18.333 18.333 14.602 18.333 10C18.333 5.398 14.602 1.667 10 1.667C5.398 1.667 1.667 5.398 1.667 10C1.667 14.602 5.398 18.333 10 18.333Z"
        stroke={color} strokeWidth={1.5} fill="none" />
      <Path d="M6.667 10H13.333" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M10 13.333V6.667" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

// ─── Import/Withdraw icon ─────────────────────────────────────────────────────
function ImportIcon({ color = WHITE }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Path d="M7.5 9.167L10 11.667L12.5 9.167" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M10 3.333V11.583" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M17.5 14.167C17.5 16 16 17.5 14.167 17.5H5.833C4 17.5 2.5 16 2.5 14.167"
        stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

// ─── Balance card chart (exact path from SVG design) ─────────────────────────
function BalanceChart() {
  return (
    <Svg width={120} height={52} viewBox="209 228 120 52">
      <Defs>
        <LinearGradient id="lineGrad" x1="209" y1="278" x2="329" y2="228" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor={WHITE} stopOpacity={0.5} />
          <Stop offset="100%" stopColor={WHITE} stopOpacity={1} />
        </LinearGradient>
      </Defs>
      {/* Vertical dashed line at peak point */}
      <Line x1={291.4} y1={228} x2={291.4} y2={278} stroke={WHITE} strokeWidth={0.8} strokeDasharray="3,3" strokeOpacity={0.5} />
      {/* Chart curve — exact path from design */}
      <Path
        d="M209 278C209.849 275.5 214.146 269.525 216.389 268.625C219.191 267.5 226.325 267.11 230.401 263.75C236.771 258.5 243.395 237.038 251.548 237.5C260.465 238.005 261.229 259.625 270.401 261.125C277.79 262.333 281.611 245 291.293 245C300.975 245 301.739 254.375 310.656 254C317.79 253.7 325.858 237.875 329 230"
        stroke="url(#lineGrad)"
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      {/* Tooltip bubble */}
      <Rect x={240} y={237} width={41} height={16} rx={3} fill={WHITE} />
      {/* Tooltip right-arrow connector */}
      <Path d="M283.876 245.811C284.429 245.412 284.429 244.588 283.876 244.189L280.585 241.814C279.924 241.337 279 241.809 279 242.625L279 247.375C279 248.191 279.924 248.663 280.585 248.186L283.876 245.811Z" fill={WHITE} />
      {/* Tooltip amount label (simplified green pill inside) */}
      <Rect x={243} y={241} width={33} height={8} rx={2} fill={GREEN} opacity={0.4} />
      {/* Peak dot */}
      <Circle cx={291.4} cy={245} r={3.5} fill={WHITE} />
      <Circle cx={291.4} cy={245} r={1.8} fill={TEAL_MED} />
    </Svg>
  );
}

// ─── Swipeable Watchlist card ──────────────────────────────────────────────────
interface WatchCardProps {
  logoImg: ImageSourcePropType;
  symbol: string;
  name: string;
  type: string;
  price: string;
  change: string;
  positive: boolean;
  onDelete?: () => void;
}

function TrashIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke={WHITE} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SwipeableWatchCard({ logoImg, symbol, name, type, price, change, positive, onDelete }: WatchCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5 && Math.abs(g.dx) > Math.abs(g.dy * 1.5),
      onPanResponderMove: (_, g) => {
        const base = isOpen.current ? -80 : 0;
        translateX.setValue(Math.min(0, Math.max(-80, base + g.dx)));
      },
      onPanResponderRelease: (_, g) => {
        const base = isOpen.current ? -80 : 0;
        if (base + g.dx < -35) {
          Animated.spring(translateX, { toValue: -80, useNativeDriver: true }).start();
          isOpen.current = true;
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
          isOpen.current = false;
        }
      },
    })
  ).current;

  return (
    <View style={{ overflow: "hidden", borderRadius: 12, marginBottom: 12 }}>
      {/* Delete button behind */}
      <TouchableOpacity
        onPress={() => {
          Animated.timing(translateX, { toValue: -400, duration: 200, useNativeDriver: true }).start(() => onDelete?.());
        }}
        activeOpacity={0.8}
        style={{
          position: "absolute", right: 0, top: 0, bottom: 0, width: 80,
          backgroundColor: "#EF4770", alignItems: "center", justifyContent: "center",
          borderTopRightRadius: 12, borderBottomRightRadius: 12,
        }}
      >
        <TrashIcon />
        <Text style={{ color: WHITE, fontFamily: "Poppins_500Medium", fontSize: 11, marginTop: 4 }}>Remove</Text>
      </TouchableOpacity>

      {/* Swipeable card */}
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            if (isOpen.current) {
              Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
              isOpen.current = false;
            } else {
              router.push(`/stock/${symbol}`);
            }
          }}
        >
          <View style={styles.watchCard}>
            <View style={styles.watchLeft}>
              <View style={styles.watchLogoBox}>
                {logoImg ? (
                  <Image source={logoImg} style={styles.watchLogoImg} resizeMode="contain" />
                ) : (
                  <View style={[styles.watchLogoImg, { backgroundColor: TEAL, alignItems: "center", justifyContent: "center", borderRadius: 20 }]}>
                    <Text style={{ color: WHITE, fontFamily: "Poppins_700Bold", fontSize: 11 }}>{symbol.slice(0, 3)}</Text>
                  </View>
                )}
              </View>
              <View style={{ gap: 3 }}>
                <Text style={styles.watchSymbol}>{symbol}</Text>
                <Text style={styles.watchSub}>
                  {name}
                  <Text style={{ color: MUTED }}> · </Text>
                  {type}
                </Text>
              </View>
            </View>
            <View style={styles.watchRight}>
              <Text style={styles.watchPrice}>{price}</Text>
              <View style={styles.statRow}>
                {positive ? <ArrowCircleUp color={GREEN} size={12} /> : <ArrowCircleDown size={12} />}
                <Text style={[styles.watchChange, { color: positive ? GREEN : RED }]}> {change}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─── Trending card ─────────────────────────────────────────────────────────────
interface TrendCardProps {
  logoImg: ImageSourcePropType;
  symbol: string;
  name: string;
  price: string;
  change: string;
  positive: boolean;
  cardWidth?: number;
}
function TrendCard({ logoImg, symbol, name, price, change, positive, cardWidth }: TrendCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/stock/${symbol}`)}
      style={[styles.trendCard, cardWidth ? { width: cardWidth } : {}]}
    >
      <View style={styles.trendLogoBox}>
        {logoImg ? (
          <Image source={logoImg} style={styles.trendLogoImg} resizeMode="contain" />
        ) : (
          <View style={[styles.trendLogoImg, { backgroundColor: TEAL, alignItems: "center", justifyContent: "center", borderRadius: 18 }]}>
            <Text style={{ color: WHITE, fontFamily: "Poppins_700Bold", fontSize: 10 }}>{symbol.slice(0, 2)}</Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text style={styles.trendSymbol} numberOfLines={1}>{symbol}</Text>
        <Text style={styles.trendName} numberOfLines={1}>{name}</Text>
      </View>
      <View>
        <Text style={styles.trendPrice} numberOfLines={1}>{price}</Text>
        <View style={styles.statRow}>
          {positive ? <ArrowCircleUp color={GREEN} size={10} /> : <ArrowCircleDown size={10} />}
          <Text style={[styles.trendChange, { color: positive ? GREEN : RED }]}> {change}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 44;
  const { width: screenWidth } = useWindowDimensions();
  // Scale trend card width: ~40% of screen, min 130, max 160
  const trendCardWidth = Math.min(Math.max(screenWidth * 0.4, 150), 172);
  const [balanceVisible, setBalanceVisible] = useState(true);

  // Deposit success toast state
  const searchParams = useLocalSearchParams<{
    depositSuccess?: string;
    depositAmount?: string;
    depositTxRef?: string;
  }>();
  const [depositToast, setDepositToast] = useState<{ visible: boolean; amount: string }>({ visible: false, amount: "" });
  const toastShownRef = useRef(false);

  // Live API state
  const { user } = useAuth();
  const userFirstName = user?.firstName ?? null;
  const currentDate = new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  // Wallet balance — React Query so it's shared/invalidatable across screens
  const qc = useWalletQueryClient();
  const { data: walletBalance, refetch: refetchBalance } = useWalletBalance();
  const totalBalance = walletBalance
    ? `K ${Number(walletBalance.availableBalance || walletBalance.balance || 0).toLocaleString()}`
    : null;

  const [allStocks, setAllStocks] = useState<StockData[]>([]);
  const [watchlist, setWatchlist] = useState<StockData[]>([]);
  const [watchlistTickers, setWatchlistTickers] = useState<Set<string>>(new Set());
  const [trending, setTrending] = useState<StockData[]>([]);
  const MAX_WATCHLIST = 4;
  const WATCHLIST_KEY = "@pine_watchlist_tickers";

  // ─── Deposit reconciliation ───────────────────────────────────────────────
  // When we land here from the payment webview (or from a cold start with a
  // still-pending deposit in AsyncStorage), we:
  //   1. Show the success toast.
  //   2. Optimistically bump the cached balance so the user immediately sees
  //      the credit on the balance card.
  //   3. Poll the server (reconcileDepositCredit) until the credit is really
  //      reflected — this smooths over any brief backend eventual-consistency.
  //   4. Clear the pending-deposit record + URL params.
  const reconcileRef = useRef(false);
  // True while we are actively polling the server for the credit confirmation.
  // Prevents useFocusEffect from overwriting the optimistic balance mid-poll.
  const reconcilingRef = useRef(false);

  useEffect(() => {
    if (reconcileRef.current) return;

    const fromNav =
      searchParams.depositSuccess === "true" && !!searchParams.depositAmount;

    // Set the guard synchronously so a rapid re-render (e.g. because
    // `walletBalance` changed) doesn't race a second async block through.
    reconcileRef.current = true;

    (async () => {
      let amount: number | null = null;
      let txRef: string | undefined;
      let prevAvailable: number | null = null;

      // The WebView persists a pending-deposit record (txRef, amount, and the
      // authoritative pre-deposit availableBalance) before redirecting here.
      // Prefer that record for the baseline — the live cache may already have
      // been refetched to the post-credit value, which would make the reconcile
      // target unreachable.
      const pending = await loadPendingDeposit();

      if (fromNav) {
        amount = Number(String(searchParams.depositAmount).replace(/,/g, "")) || 0;
        txRef = searchParams.depositTxRef ?? pending?.txRef;
        if (pending && (!txRef || pending.txRef === txRef)) {
          prevAvailable = pending.prevAvailable;
        }
      } else {
        // Cold-start resume: only proceed if we have a persisted deposit
        if (!pending) return;
        amount = pending.amount;
        txRef = pending.txRef;
        prevAvailable = pending.prevAvailable;
      }

      // If there's nothing to reconcile, release the guard so a genuine
      // deposit that shows up later (e.g. via URL params after the tab
      // remounts) still gets processed.
      if (!amount || amount <= 0) {
        reconcileRef.current = false;
        return;
      }

      // Show toast (only once, only for the fresh nav-from-webview path)
      if (fromNav && !toastShownRef.current) {
        toastShownRef.current = true;
        setDepositToast({ visible: true, amount: String(searchParams.depositAmount) });
        setTimeout(() => setDepositToast({ visible: false, amount: "" }), 4000);
      }

      // Read the pre-deposit available balance. Prefer the persisted value
      // (captured at initiation time) if we have it, otherwise fall back to
      // whatever is currently cached — best-effort baseline for the target.
      if (prevAvailable === null) {
        const cached = walletBalance;
        prevAvailable = Number(cached?.availableBalance ?? cached?.balance ?? 0);
        // Also persist so a subsequent cold start can resume
        if (txRef) {
          await savePendingDeposit({
            txRef,
            amount,
            prevAvailable,
            createdAt: Date.now(),
          });
        }
      }

      // Cancel any in-flight wallet balance fetches so that a concurrent
      // React Query refetch (e.g. from useFocusEffect) cannot land after us
      // and overwrite the optimistic value with a stale server response.
      await qc.cancelQueries({ queryKey: WALLET_BALANCE_QUERY_KEY });

      // Optimistic bump — user sees the credit right away
      reconcilingRef.current = true;
      const revertOptimistic = setOptimisticBalance(qc, amount);

      // Reconcile with the server
      const outcome = await reconcileDepositCredit(qc, {
        expectedIncrement: amount,
        prevAvailable,
      });
      reconcilingRef.current = false;

      if (outcome.status === "reflected") {
        // Server confirmed. Cache is already up to date; the optimistic overlay
        // is superseded by the real value — no need to revert.
        await clearPendingDeposit();
      } else {
        // Timed out. Keep the optimistic value visible (user's money IS credited
        // per the backend flow — we just couldn't confirm within the window),
        // but leave the pending record so we retry on next screen focus.
        // A background refetch on focus (staleTime + refetchOnMount) will
        // eventually align the cache with the server.
        void revertOptimistic; // keep the closure alive; do not revert
      }
    })().catch(() => {
      /* non-fatal — the next focus-refetch will reconcile */
    });
  }, [
    searchParams.depositSuccess,
    searchParams.depositAmount,
    searchParams.depositTxRef,
    walletBalance,
    qc,
  ]);

  // Load saved watchlist tickers
  useEffect(() => {
    AsyncStorage.getItem(WATCHLIST_KEY)
      .then((val) => {
        if (val) {
          const tickers: string[] = JSON.parse(val);
          setWatchlistTickers(new Set(tickers));
        }
      })
      .catch(() => { });
  }, []);

  // Save watchlist tickers to storage
  const saveWatchlist = useCallback((tickers: Set<string>) => {
    AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify([...tickers])).catch(() => { });
  }, []);

  // Refresh balance every time this tab gains focus. Skip during active
  // deposit reconciliation to prevent overwriting the optimistic balance.
  useFocusEffect(
    useCallback(() => {
      if (!reconcilingRef.current) {
        refetchBalance();
      }
    }, [refetchBalance])
  );

  // Fetch stocks for trending & watchlist
  useEffect(() => {
    stocksApi.list()
      .then((stocks) => {
        const mapped: StockData[] = stocks.map((s: ApiStock) => ({
          id: s.id,
          ticker: s.symbol,
          name: s.name,
          logo: getStockLogo(s.symbol),
          price: s.price,
          change: s.change,
          positive: s.positive,
        }));
        setAllStocks(mapped);
        setTrending(mapped.slice(0, 6));
      })
      .catch(() => { });
  }, []);

  // Rebuild watchlist whenever allStocks or tickers change
  useEffect(() => {
    if (allStocks.length === 0) return;
    if (watchlistTickers.size === 0) {
      // Default: first 4 stocks if no saved watchlist
      const defaultTickers = new Set(allStocks.slice(0, MAX_WATCHLIST).map((s) => s.ticker));
      setWatchlistTickers(defaultTickers);
      setWatchlist(allStocks.slice(0, MAX_WATCHLIST));
      saveWatchlist(defaultTickers);
    } else {
      setWatchlist(allStocks.filter((s) => watchlistTickers.has(s.ticker)));
    }
  }, [allStocks, watchlistTickers, saveWatchlist]);

  const addToWatchlist = (ticker: string) => {
    if (watchlistTickers.size >= MAX_WATCHLIST) {
      Alert.alert("Watchlist Full", `You can only add up to ${MAX_WATCHLIST} stocks to your watchlist. Remove one first.`);
      return;
    }
    const next = new Set(watchlistTickers);
    next.add(ticker);
    setWatchlistTickers(next);
    saveWatchlist(next);
  };

  const removeFromWatchlist = (ticker: string) => {
    const next = new Set(watchlistTickers);
    next.delete(ticker);
    setWatchlistTickers(next);
    saveWatchlist(next);
  };

  return (
    <View style={styles.root}>
      {/* ─── Teal header ─────────────────────────────────────────────── */}
      <View style={[styles.headerBg, { paddingTop: topPad }]}>

        {/* App bar */}
        <View style={styles.appBar}>
          <View>
            <Text style={styles.greeting}>Hi, {userFirstName ?? "Welcome"}</Text>
            <Text style={styles.dateText}>{currentDate}</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/profile/notifications" as any)}>
            <NotificationIcon />
          </TouchableOpacity>
        </View>

        {/* ─── Balance card ───────────────────────────────────────────── */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceTopRow}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
              <Text style={styles.balanceAmount} adjustsFontSizeToFit numberOfLines={1}>
                {balanceVisible ? (totalBalance ?? "—") : "K  ••••••"}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setBalanceVisible((v) => !v)} activeOpacity={0.7} style={styles.eyeBtnWrap}>
              <EyeIcon visible={balanceVisible} />
            </TouchableOpacity>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.btnDeposit} activeOpacity={0.85} onPress={() => router.push("/deposit")}>
              <AddCircleIcon color={GREEN} />
              <Text style={styles.btnDepositText}>Deposit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnWithdraw} activeOpacity={0.85} onPress={() => router.push("/withdraw" as any)}>
              <ImportIcon color={WHITE} />
              <Text style={styles.btnWithdrawText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

        {/* ─── Deposit success toast ─────────────────────────────────── */}
        {depositToast.visible && (
          <View style={styles.depositToast}>
            <View style={styles.depositToastIcon}>
              <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                <Circle cx={10} cy={10} r={10} fill={WHITE} />
                <Path d="M6 10l3 3 5-5" stroke={GREEN} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.depositToastTitle}>Deposit Successful!</Text>
              <Text style={styles.depositToastBody}>MK {depositToast.amount} has been added to your wallet.</Text>
            </View>
            <TouchableOpacity onPress={() => setDepositToast({ visible: false, amount: "" })} hitSlop={12}>
              <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                <Path d="M4 4l8 8M12 4l-8 8" stroke={WHITE} strokeWidth={1.5} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          </View>
        )}

      {/* ─── White sheet: rounded top corners pull up over teal header ── */}
      <View style={styles.whiteSheet}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ─── White content area ───────────────────────────────────────── */}
          <View style={styles.contentArea}>

            {/* ── Watchlist ── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Watchlist</Text>
              <Text style={styles.sectionAction}>{watchlistTickers.size}/{MAX_WATCHLIST}</Text>
            </View>

            {watchlist.length === 0 ? (
              <View style={{ paddingVertical: 24, alignItems: "center" }}>
                <Text style={{ color: MUTED, fontFamily: "Poppins_400Regular", fontSize: 13 }}>No stocks in watchlist.{"\n"}Add from a stock detail page.</Text>
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
                />
              ))
            )}

            {/* ── Trending ── */}
            <View style={[styles.sectionHeader, { marginTop: 28 }]}>
              <Text style={styles.sectionTitle}>Trending</Text>
              <TouchableOpacity><Text style={styles.sectionAction}>See all</Text></TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingRight: 24 }}>
              {trending.length === 0 ? (
                <View style={{ width: 300, paddingVertical: 24, alignItems: "center" }}>
                  <Text style={{ color: MUTED }}>Loading trending stocks...</Text>
                </View>
              ) : (
                trending.map((item) => (
                  <TrendCard
                    key={item.ticker}
                    logoImg={item.logo}
                    symbol={item.ticker}
                    name={item.name}
                    price={item.price}
                    change={item.change}
                    positive={item.positive}
                    cardWidth={trendCardWidth}
                  />
                ))
              )}
            </ScrollView>

            {/* ── Banner ── */}
            <View style={styles.banner}>
              <View style={styles.bannerCircle1} />
              <View style={styles.bannerCircle2} />
              <View style={styles.bannerBadge}>
                <Text style={styles.bannerBadgeText}>Research</Text>
              </View>
              <Text style={styles.bannerHeading}>Invest Smarter,{"\n"}Start Today</Text>
              <Text style={styles.bannerSub}>
                Explore curated market insights{"\n"}and AI-powered analysis.
              </Text>
              <TouchableOpacity style={styles.bannerBtn}>
                <Text style={styles.bannerBtnText}>Get Started</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </View>


    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: TEAL },

  // ─── Header
  headerBg: {
    backgroundColor: TEAL,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  appBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 26,
  },
  greeting: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: WHITE,
    lineHeight: 28,
  },
  dateText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: WHITE,
    opacity: 0.7,
    lineHeight: 20,
    marginTop: 2,
  },

  // ─── Balance card
  balanceCard: {
    backgroundColor: GREEN,
    borderRadius: 16,
    padding: 20,
    gap: 28,
  },
  balanceTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: WHITE,
    opacity: 0.8,
    letterSpacing: 1,
    marginBottom: 4,
  },
  balanceAmount: {
    fontFamily: "Poppins_700Bold",
    fontSize: 34,
    color: WHITE,
    letterSpacing: -0.5,
  },
  eyeBtnWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  actionRow: { flexDirection: "row", gap: 10 },
  btnDeposit: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 12,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnDepositText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: GREEN,
  },
  btnWithdraw: {
    flex: 1,
    borderRadius: 12,
    height: 48,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnWithdrawText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: WHITE,
  },

  // ─── White sheet with rounded top corners
  whiteSheet: {
    flex: 1,
    backgroundColor: WHITE,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: 12,
    overflow: "hidden",
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // ─── White content area
  contentArea: {
    backgroundColor: WHITE,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: DARK,
  },
  sectionAction: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: MUTED2,
  },

  // ─── Watchlist card
  watchCard: {
    backgroundColor: LIGHT_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LIGHT_BORDER,
    height: 77,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  watchLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  watchLogoBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  watchLogoImg: { width: 40, height: 40, borderRadius: 20 },
  watchSymbol: { fontFamily: "Poppins_700Bold", fontSize: 15, color: DARK },
  watchSub: { fontFamily: "Poppins_400Regular", fontSize: 12, color: MUTED },
  watchRight: { alignItems: "flex-end", gap: 4 },
  watchPrice: { fontFamily: "Poppins_700Bold", fontSize: 16, color: DARK },
  watchChange: { fontFamily: "Poppins_500Medium", fontSize: 12 },

  // ─── Trending cards
  trendCard: {
    backgroundColor: LIGHT_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: LIGHT_BORDER,
    width: 160,
    height: 170,
    padding: 14,
    justifyContent: "space-between",
  },
  trendLogoBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  trendLogoImg: { width: 36, height: 36, borderRadius: 18 },
  trendSymbol: { fontFamily: "Poppins_700Bold", fontSize: 14, color: DARK },
  trendName: { fontFamily: "Poppins_400Regular", fontSize: 11, color: MUTED },
  trendPrice: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: DARK },
  trendChange: { fontFamily: "Poppins_500Medium", fontSize: 11 },

  // ─── Banner
  banner: {
    backgroundColor: TEAL,
    borderRadius: 12,
    padding: 20,
    marginTop: 28,
    minHeight: 120,
    overflow: "hidden",
  },
  bannerCircle1: {
    position: "absolute",
    right: -24,
    top: -24,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: TEAL_MED,
    opacity: 0.7,
  },
  bannerCircle2: {
    position: "absolute",
    right: 26,
    top: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: GREEN,
    opacity: 0.25,
  },
  bannerBadge: {
    backgroundColor: WHITE,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  bannerBadgeText: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: TEAL },
  bannerHeading: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: WHITE,
    lineHeight: 26,
    marginBottom: 6,
  },
  bannerSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: WHITE,
    opacity: 0.7,
    lineHeight: 18,
    marginBottom: 16,
  },
  bannerBtn: {
    backgroundColor: GREEN,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  bannerBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: WHITE },

  // ─── Deposit success toast
  depositToast: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GREEN,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  depositToastIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  depositToastTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: WHITE,
    lineHeight: 20,
  },
  depositToastBody: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 17,
  },

});


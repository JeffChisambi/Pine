import React, { useState, useEffect, useCallback, useRef } from "react";
import { guardedPush } from "@/utils/navigation";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Image,
  ImageSourcePropType,
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
import { useAuth } from "../../services/auth-context";
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
import Svg, {
  Path,
  Circle,
  Rect,
  G,
  Defs,
  ClipPath,
  Text as SvgText,
} from "react-native-svg";
import { SvgXml } from "react-native-svg";
import { EDUCATION_ICON_SVG } from "@/constants/EducationIconSvg";
import { LinearGradient } from "expo-linear-gradient";
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
  const c = useColors();
  return (
    <View style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path d="M12.02 2.91C8.71 2.91 6.02 5.6 6.02 8.91V11.8C6.02 12.41 5.76 13.34 5.45 13.86L4.3 15.77C3.59 16.95 4.08 18.26 5.38 18.7C9.69 20.14 14.34 20.14 18.65 18.7C19.86 18.3 20.39 16.87 19.73 15.77L18.58 13.86C18.28 13.34 18.02 12.41 18.02 11.8V8.91C18.02 5.61 15.32 2.91 12.02 2.91Z" stroke={c.text} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" />
        <Path d="M13.87 3.2C13.56 3.11 13.24 3.04 12.91 3C11.95 2.88 11.03 2.95 10.17 3.2C10.46 2.46 11.18 1.94 12.02 1.94C12.86 1.94 13.58 2.46 13.87 3.2Z" stroke={c.text} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M15.02 19.06C15.02 20.71 13.67 22.06 12.02 22.06C11.2 22.06 10.44 21.72 9.9 21.18C9.36 20.64 9.02 19.88 9.02 19.06" stroke={c.text} strokeWidth={1.5} strokeMiterlimit={10} />
        <Circle cx={18} cy={5} r={3} fill={RED} stroke={c.background} strokeWidth={1.5} />
      </Svg>
    </View>
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

function EquityTradingIcon() {
  const G = "#1EA84E";
  return (
    <Svg width={34} height={34} viewBox="0 0 34 34" fill="none">
      <Circle cx={17} cy={17} r={15} stroke={G} strokeWidth={1.6} />
      <Circle cx={17} cy={17} r={10.5} stroke={G} strokeWidth={1} strokeDasharray="2 1.8" />
      <SvgText x={17} y={21.5} textAnchor="middle" fontSize={11} fontWeight="bold" fill={G}>MK</SvgText>
    </Svg>
  );
}

function TreasuryBillsIcon() {
  const G = "#1EA84E";
  return (
    <Svg width={42} height={36} viewBox="0 0 42 36" fill="none">
      {/* Pediment */}
      <Path d="M2 11 L21 2 L40 11" stroke={G} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      {/* Entablature */}
      <Path d="M2 12.5 L40 12.5" stroke={G} strokeWidth={1.6} strokeLinecap="round" />
      {/* Side columns */}
      <Path d="M8 14 L8 27" stroke={G} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M34 14 L34 27" stroke={G} strokeWidth={1.6} strokeLinecap="round" />
      {/* MK on façade */}
      <SvgText x={21} y={25} textAnchor="middle" fontSize={10} fontWeight="bold" fill={G}>MK</SvgText>
      {/* Base */}
      <Path d="M2 28.5 L40 28.5" stroke={G} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M0 33 L42 33" stroke={G} strokeWidth={1.5} strokeLinecap="round" />
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
            if (isOpen.value) { dismiss(); } else { guardedPush(() => router.push(`/stock/${symbol}`)); }
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

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 44;
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

  useFocusEffect(useCallback(() => {
    if (!reconcilingRef.current) { refetchBalance(); }
  }, [refetchBalance]));



  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Themed header */}
      <View style={{ backgroundColor: c.background, paddingHorizontal: 20, paddingBottom: 16, paddingTop: topPad }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 26 }}>
          <View>
            <Text style={{ fontSize: 20, color: c.text, lineHeight: 28 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_400Regular" }}>Hi, </Text>
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}>{userFirstName ?? "Welcome"}</Text>
            </Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED2, lineHeight: 20, marginTop: 2 }}>{currentDate}</Text>
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
            {/* Invest section */}
            <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text, marginBottom: 4 }}>Invest</Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED2, marginBottom: 16 }}>Choose what to invest</Text>

            {/* Equity Trading card */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => guardedPush(() => router.push("/stock-search" as any))}
              style={{
                borderRadius: 16,
                backgroundColor: c.card,
                borderWidth: 1,
                borderColor: c.border,
                marginBottom: 12,
                overflow: "hidden",
              }}
            >
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingVertical: 16,
              }}>
                <View style={{ flex: 1, gap: 4, paddingRight: 12, marginTop: -6 }}>
                  <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: c.text, lineHeight: 21 }}>Equity Trading</Text>
                  <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: c.mutedForeground, lineHeight: 15 }}>
                    Buy &amp; sell shares of{"\n"}listed companies
                  </Text>
                </View>
                <View style={{
                  width: 56, height: 54, borderRadius: 28,
                  backgroundColor: c.background,
                  alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <EquityTradingIcon />
                </View>
              </View>
            </TouchableOpacity>

            {/* Treasury Bills card */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => guardedPush(() => router.push("/treasury" as any))}
              style={{
                borderRadius: 16,
                backgroundColor: c.card,
                borderWidth: 1,
                borderColor: c.border,
                marginBottom: 0,
                overflow: "hidden",
              }}
            >
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingVertical: 16,
              }}>
                <View style={{ flex: 1, gap: 4, paddingRight: 12, marginTop: -6 }}>
                  <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: c.text, lineHeight: 21 }}>Treasury Bills</Text>
                  <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: c.mutedForeground, lineHeight: 15 }}>
                    Low-risk government-backed{"\n"}short-term investments
                  </Text>
                </View>
                <View style={{
                  width: 56, height: 54, borderRadius: 28,
                  backgroundColor: c.background,
                  alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <TreasuryBillsIcon />
                </View>
              </View>
            </TouchableOpacity>

          </View>

          {/* Learn Trading card */}
          <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => guardedPush(() => router.push("/education" as any))}
              style={{
                borderRadius: 20,
                overflow: "hidden",
                backgroundColor: "#0D3540",
              }}
            >
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 18,
                paddingLeft: 20,
                paddingRight: 16,
                gap: 16,
              }}>
                {/* Left: text content */}
                <View style={{ flex: 1 }}>
                  {/* Heading */}
                  <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 19, color: WHITE, lineHeight: 25, marginBottom: 3 }}>
                    Master the Markets
                  </Text>
                  <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 16, marginBottom: 12 }}>
                    Structured courses for every level
                  </Text>

                  {/* Topics */}
                  <View style={{ gap: 5, marginBottom: 14 }}>
                    {[
                      "Market Fundamentals",
                      "Portfolio Strategy",
                      "Technical Analysis",
                      "Risk Management",
                    ].map((topic) => (
                      <View key={topic} style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: GREEN }} />
                        <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 11.5, color: "rgba(255,255,255,0.7)" }}>{topic}</Text>
                      </View>
                    ))}
                  </View>

                  {/* CTA */}
                  <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    alignSelf: "flex-start",
                    gap: 5,
                    backgroundColor: GREEN,
                    borderRadius: 9,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                  }}>
                    <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 12, color: WHITE }}>Start Learning</Text>
                    <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
                      <Path d="M5 12h14M12 5l7 7-7 7" stroke={WHITE} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </View>
                </View>

                {/* Right: contained square photo */}
                <Image
                  source={require("../../attached_assets/image_da53edb6-914b-41d1-bc8b-dfe23a6d2164_1785280173516.png")}
                  style={{ width: 155, height: 155, borderRadius: 14 }}
                  resizeMode="cover"
                />
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </View>
  );
}

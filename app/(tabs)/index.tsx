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
} from "react-native-svg";
import { SvgXml } from "react-native-svg";
import { EDUCATION_ICON_SVG } from "@/constants/EducationIconSvg";
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
        stroke={TEAL} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" fill="none" />
      <Path d="M330.558 72.6667C330.3 72.5917 330.033 72.5334 329.767 72.5084C328.967 72.4084 328.2 72.4667 327.483 72.6667C327.717 72.0667 328.317 71.6667 329.017 71.6667C329.717 71.6667 330.317 72.0667 330.558 72.6667Z"
        stroke={TEAL} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M331.517 85.8833C331.517 87.0583 330.592 88 329.392 88C328.8 88 328.25 87.75 327.858 87.3583C327.467 86.9667 327.217 86.4167 327.217 85.8833"
        stroke={TEAL} strokeWidth={1.5} fill="none" />
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
    <View style={{ flex: 1, backgroundColor: WHITE }}>
      {/* White header */}
      <View style={{ backgroundColor: WHITE, paddingHorizontal: 20, paddingBottom: 16, paddingTop: topPad }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 26 }}>
          <View>
            <Text style={{ fontSize: 20, color: TEAL, lineHeight: 28 }}>
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
                backgroundColor: WHITE,
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.07)",
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
                  <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: "rgba(17,24,39,0.86)", lineHeight: 21 }}>Equity Trading</Text>
                  <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: "rgba(0,0,0,0.78)", lineHeight: 15 }}>
                    Buy &amp; sell shares of{"\n"}listed companies
                  </Text>
                </View>
                <View style={{
                  width: 56, height: 54, borderRadius: 28,
                  backgroundColor: WHITE,
                  alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Svg width={42} height={39} viewBox="0 0 79 74" fill="none">
                    <G clipPath="url(#clip_shares)">
                      <Path d="M37.2183 5.37319C37.8631 5.30484 38.5519 5.14571 38.7196 5.9965C39.0007 7.42212 39.1508 8.87097 39.3507 10.3117L40.1888 16.0942C40.8793 20.9734 41.6508 25.9059 42.1911 30.794C42.4199 32.8644 43.0412 35.6295 43.0797 37.6263C43.8776 37.2274 44.9081 36.4355 45.6433 35.9177C47.0273 34.9427 48.3961 33.9314 49.7671 32.9385C50.5795 32.3501 51.4663 31.8243 52.2855 31.2446C56.8825 27.9471 61.5087 24.6932 66.1637 21.4829C67.4889 20.5849 69.0109 19.4275 70.3557 18.5905C71.1415 18.101 72.4179 20.1539 72.8185 20.7552C74.5707 23.3875 75.8801 26.2115 76.8782 29.2356C79.478 37.1543 78.9199 45.8097 75.3249 53.3059C71.8205 60.468 66.0903 66.2222 59.0439 69.6563C57.6431 70.3437 56.0038 70.9649 54.5352 71.4763C46.4837 74.1026 37.1808 74.1431 29.2348 71.0349C28.4205 70.7163 26.7556 70.1033 26.0791 69.633C25.6829 69.8881 25.3073 70.1678 24.9246 70.4359C17.8453 75.3882 7.71712 73.6069 2.85086 66.2502C-0.995628 60.4354 0.0452098 52.7894 4.98324 48.0335C5.6347 47.406 6.50314 46.8237 7.24825 46.2948C5.19772 36.8909 7.26244 26.7328 13.1756 19.1775C19.0854 11.4715 27.7375 6.50386 37.2183 5.37319ZM27.5526 68.1987C28.421 68.6075 29.3839 69.0773 30.2738 69.4146C38.2721 72.4196 47.052 72.3834 55.0266 69.3124C55.8795 68.988 57.6493 68.2461 58.427 67.8398C65.7035 64.3265 72.1276 57.1086 74.8266 49.4236C77.8868 40.7108 76.6631 30.5124 71.7734 22.788C71.396 22.1919 70.7451 21.3163 70.4619 20.7492C69.9536 21.2295 68.6468 22.09 68.0242 22.5289L62.5626 26.347L49.6635 35.3661C47.6577 36.7675 45.6198 38.1977 43.631 39.6325C43.2425 39.9127 42.8258 40.1038 42.3728 40.2546C42.1607 40.1455 41.8192 39.9833 41.6269 39.8609C41.3029 38.9462 41.0106 35.9845 40.8373 34.8007L38.7162 19.8636L37.2929 9.33036C37.225 8.81489 37.1702 8.25512 37.154 7.73618C37.1325 7.04367 36.7502 7.1911 36.2478 7.26161C33.6618 7.87659 31.0602 8.5426 28.5846 9.56653C16.1748 14.6993 7.22906 27.6999 8.4757 41.6711C8.55498 42.5598 8.64073 43.6448 8.8345 44.5075C8.89987 44.7901 8.98076 45.0686 9.07677 45.3417C10.0283 44.6653 11.2543 44.4203 12.3576 44.1492C22.4096 41.6786 33.1619 49.941 31.2197 61.0285C30.7937 63.4602 29.3216 66.5059 27.5526 68.1987ZM16.6547 71.3677C17.3361 71.2705 18.339 71.2422 18.9537 71.0874C25.4738 69.4452 30.4118 63.6352 29.2943 56.4928C28.7515 53.0236 26.9771 50.4777 24.3025 48.3227C22.2259 46.6527 18.0003 45.2831 15.3568 45.5538C11.2687 45.9538 7.85642 47.3701 5.18782 50.6952C3.16479 53.2101 2.20203 56.4513 2.51334 59.6991C3.19248 66.8081 9.94022 71.7127 16.6547 71.3677Z" fill="#1EA84E"/>
                      <Path d="M15.9714 49.096C17.2627 49.1119 16.9455 50.4347 16.9214 51.4401C19.3691 51.7736 21.3555 52.645 21.2228 55.6489C20.3107 56.1906 20.1767 56.2254 19.3025 55.6016C19.1835 54.8391 19.1639 54.1075 18.4067 53.6668C17.6104 53.2036 16.7842 53.3025 15.8982 53.2737C15.0941 53.2475 14.4184 53.3254 13.6314 53.5278C13.5112 53.6528 13.3626 53.7821 13.2408 53.9039C12.181 54.9415 12.4393 57.0085 14.0346 57.3379C16.2589 57.7972 18.8239 57.0725 20.4538 59.171C21.0834 59.9939 21.3672 61.0413 21.2421 62.0804C21.119 63.0869 20.6139 64.0026 19.8369 64.6277C19.0862 65.2223 17.8808 65.6 16.9286 65.4795C16.9501 66.1588 16.9415 66.6182 16.8994 67.2968C16.7093 67.5749 16.6181 67.7162 16.3308 67.8756C16.2586 67.885 16.1858 67.8899 16.113 67.8903C14.7296 67.8953 15.0156 66.5729 15.0303 65.5275C13.029 65.5307 11.0251 64.4284 10.7511 62.1901C10.6922 61.7089 10.9626 60.646 11.5621 60.7156C12.8331 60.8631 12.5828 62.305 13.2026 63.0336C14.0451 63.8348 16.0886 63.532 17.1837 63.5888C17.748 63.5891 18.5017 63.3594 18.8682 62.8909C19.4354 62.1662 19.3686 60.272 18.4354 59.8563C16.3645 58.9341 13.9054 60.1981 12.0414 58.4375C11.3448 57.7796 10.7962 57.0174 10.763 56.0156C10.6047 52.8544 12.1167 51.6733 15.025 51.5205C15.0245 51.1789 15.0233 50.814 15.0219 50.4747C15.0179 49.522 14.9733 49.1668 15.9714 49.096Z" fill="#1EA84E"/>
                      <Path d="M43.8282 0.681521C45.7465 0.580477 47.8772 0.783509 49.7781 1.02566C57.2224 2.02323 64.1655 5.4287 69.6038 10.7499C70.3155 11.4571 71.0717 12.145 71.6867 12.9433C72.2117 13.6243 72.3544 14.1826 71.5939 14.7388C68.5092 16.9947 65.3269 19.1244 62.2332 21.372C61.4968 21.907 60.7085 22.3802 59.9875 22.929C59.0128 23.7173 57.9515 24.324 56.9632 25.035C55.8223 25.8557 54.7212 26.6131 53.5711 27.411L49.8925 29.9706C48.7973 30.7451 47.1231 32.1454 45.9256 32.5274C45.6737 32.4409 45.3687 32.371 45.1074 32.3037C44.8002 31.4407 44.7699 30.7007 44.6367 29.7984L44.0305 25.5066L41.8339 9.2255C41.522 6.78688 40.9701 4.29683 40.7841 1.81796C40.765 1.56391 40.7329 1.35058 40.9048 1.17174C41.4205 0.635017 43.0782 0.70343 43.8282 0.681521ZM46.5553 30.0644C47.0933 29.5866 47.8055 29.1544 48.4043 28.7412L51.8191 26.3668C54.4699 24.5074 57.2664 22.3785 59.9613 20.6409C63.1274 18.3944 66.5906 15.9029 69.8378 13.8013C63.5486 6.62202 55.0283 2.95461 45.7069 2.45896C44.962 2.42072 44.2157 2.42689 43.4715 2.47744C43.1876 2.54138 42.9707 2.53122 42.8147 2.72605C42.8527 3.31178 43.0269 4.28453 43.1125 4.8932L43.7924 9.68439L45.3946 21.7986C45.7743 24.5102 46.2877 27.35 46.5553 30.0644Z" fill="#1EA84E"/>
                    </G>
                    <Defs>
                      <ClipPath id="clip_shares">
                        <Rect width={79} height={74} fill="white"/>
                      </ClipPath>
                    </Defs>
                  </Svg>
                </View>
              </View>
            </TouchableOpacity>

            {/* Treasury Bills card */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={{
                borderRadius: 16,
                backgroundColor: WHITE,
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.07)",
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
                  <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: "rgba(17,24,39,0.86)", lineHeight: 21 }}>Treasury Bills</Text>
                  <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: "rgba(0,0,0,0.78)", lineHeight: 15 }}>
                    Low-risk government-backed{"\n"}short-term investments
                  </Text>
                </View>
                <View style={{
                  width: 56, height: 54, borderRadius: 28,
                  backgroundColor: WHITE,
                  alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Svg width={42} height={36} viewBox="0 0 97 82" fill="none">
                    <Path d="M46.2918 6.43065C47.9626 6.42828 52.3058 8.28216 53.9693 8.88579L72.1364 15.6594L82.1073 19.3629C83.7796 19.9809 86.4452 20.8598 88.0689 21.721C88.3065 21.8471 88.5536 22.5145 88.5514 22.8051C88.5453 23.5734 88.3801 24.0388 87.7986 24.602C86.6705 24.8991 86.1903 24.9959 85.0317 24.8358C85.06 26.0461 85.0713 26.5701 84.6395 27.7174C83.5845 28.4149 82.944 28.3585 81.6278 28.4555C80.7028 29.0503 82.8296 31.2864 79.2777 31.933C79.3812 33.4826 79.3246 35.3571 79.3234 36.9385L79.3123 45.6073L79.3164 56.2077C79.3185 58.3985 79.3588 60.7244 79.273 62.9067C82.6955 62.7081 83.4708 63.2576 83.0533 66.3852C84.3369 66.3587 84.7251 66.3155 85.8472 66.8904C86.087 67.7305 86.0648 68.995 86.0243 69.8534C87.807 69.8616 88.5697 69.9598 88.5397 71.8209C88.5245 72.7652 88.7595 74.1172 88.0904 74.9273C87.8755 75.1877 87.3331 75.1728 87.003 75.2064C85.3453 75.2774 83.6512 75.2539 81.9895 75.2548L73.4449 75.2574L47.065 75.2554L18.9527 75.2521L10.5494 75.2586C9.17461 75.2613 6.92288 75.3254 5.62621 75.1962C5.38027 75.0396 4.93605 74.7655 4.85906 74.4884C4.54237 73.3486 4.35994 71.3032 5.18629 70.3449C5.57573 69.8932 6.7497 69.8622 7.33601 69.8384C7.26489 67.4628 7.01132 66.2944 10.1366 66.4178C10.1276 65.4118 10.0436 64.6012 10.3901 63.6389C11.6658 62.6739 12.4846 62.8753 14.1299 62.9264C13.9712 52.6607 14.1851 42.2185 14.1049 31.9259C13.4321 31.832 12.9546 31.5798 12.3711 31.2945C11.9052 30.256 12.016 29.4954 12.0451 28.4024C10.6202 28.4643 10.0882 28.4034 8.8692 27.7517C8.37598 26.5365 8.40272 26.1631 8.49992 24.8873C7.23819 24.941 6.45515 24.9967 5.36 24.4115C3.81444 21.9282 5.46835 21.5405 7.78765 20.6304C10.5115 19.5617 13.3166 18.6241 16.0579 17.6111L34.4382 10.7732C37.5179 9.62179 40.6619 8.35992 43.7942 7.29974C44.5581 7.04119 45.5201 6.52638 46.2918 6.43065ZM25.683 31.9363L25.6745 53.1001L25.6788 59.4919C25.6793 60.3373 25.7315 62.1268 25.6236 62.9084C37.6549 62.7972 49.9706 62.8654 62.0048 62.9097C63.5456 62.9082 66.4105 62.8371 67.8454 62.9398C67.7394 61.7569 67.7955 60.0003 67.7952 58.7804L67.7951 51.3815C67.7961 45.0037 67.6758 38.2707 67.803 31.9179C67.0828 31.7453 66.6704 31.6051 66.0174 31.2515C65.5935 30.0408 65.5955 29.689 65.6865 28.421C64.2809 28.4176 63.9194 28.3931 62.5853 27.8935C61.9208 26.5285 61.9788 26.3503 62.0564 24.8984L41.437 24.8954L35.0409 24.9039C33.9505 24.9054 32.3582 24.9471 31.3111 24.8554C31.3952 26.132 31.4615 26.5458 30.8819 27.7221C29.7964 28.3829 29.0355 28.5044 27.7125 28.3821C27.7606 29.3909 27.8436 30.2574 27.4445 31.2161C26.7432 31.6156 26.5064 31.7991 25.683 31.9363ZM47.0313 23.2193L73.2336 23.2239L81.9376 23.2079C82.5707 23.2074 86.4932 23.3222 86.7938 23.0783C86.671 22.7411 82.4686 21.3048 81.8368 21.0701L72.578 17.6474L53.6951 10.6212C52.65 10.2322 47.3906 8.10463 46.5922 8.09646C45.8224 8.2579 44.8402 8.72323 44.0567 8.9999C40.931 10.1039 37.8085 11.3323 34.7002 12.4816L20.9386 17.6175C19.395 18.1873 6.96028 22.6406 6.66597 22.9829L6.74059 23.1114C7.50079 23.311 10.358 23.2054 11.3476 23.2038L16.7259 23.2213L47.0313 23.2193ZM16.1017 62.8974C18.2467 62.9002 21.5994 62.811 23.6469 62.9319C23.4777 56.6582 23.6218 49.8692 23.6227 43.5515L23.6235 36.0774C23.6241 34.8783 23.5683 33.0265 23.6757 31.8656C22.1424 31.9355 17.6164 31.9518 16.1403 31.8458L16.1011 31.8427C16.2676 38.0538 16.1396 44.6889 16.1393 50.9393L16.1412 58.574C16.1417 59.8712 16.1965 61.6304 16.1017 62.8974ZM69.8178 62.9089C71.9414 62.8126 75.2194 62.8721 77.4036 62.9073C77.277 61.2076 77.3627 58.6446 77.3633 56.8976L77.3641 45.7534L77.3534 36.7333C77.3483 35.4459 77.258 33.089 77.3715 31.882C76.1731 31.949 70.8113 32.0321 69.879 31.8669C69.732 33.9087 69.8682 37.2767 69.8659 39.4423L69.8757 55.8145C69.8758 57.7625 69.9753 61.0705 69.8178 62.9089ZM84.0121 69.9064C83.9813 69.2498 84.0217 68.7424 84.0717 68.0842C77.9417 68.1634 71.4973 68.0723 65.3408 68.0729L26.9537 68.0774L14.9052 68.071C13.8266 68.0741 10.2411 68.2226 9.46652 68.0284C9.42743 68.657 9.40671 69.2863 9.40427 69.9158C11.7622 69.759 16.034 69.889 18.5185 69.8901L36.572 69.8904L67.405 69.8852C72.8767 69.8847 78.554 69.8146 84.0121 69.9064ZM82.8591 26.7257C82.9574 26.2169 82.9705 25.4322 82.9963 24.8961L70.0513 24.9037C68.3269 24.904 65.6404 24.985 63.9777 24.9113C63.9745 25.222 63.9212 26.3639 64.0911 26.5693C64.9093 26.7578 67.9701 26.7262 68.9497 26.7311L77.6408 26.7303C79.3394 26.7224 81.1744 26.6682 82.8591 26.7257ZM6.58233 73.6185C13.8579 73.5299 21.2939 73.5964 28.583 73.5969L69.0556 73.5985L81.6553 73.5962C82.3836 73.5982 86.1382 73.6998 86.6672 73.5731C86.6294 72.8625 86.6672 72.2925 86.712 71.5862C80.4398 71.7095 73.8292 71.6089 67.528 71.6069L32.8883 71.6079L15.031 71.608L10.2194 71.6252C9.00886 71.6335 7.79426 71.6884 6.5996 71.5532C6.61753 72.2679 6.60791 72.9034 6.58233 73.6185ZM25.7141 30.171C25.7211 29.5899 25.7137 28.9537 25.7399 28.3778L17.9672 28.3958C17.1248 28.3962 14.7314 28.4526 14.0501 28.3132C14.0577 28.9684 14.075 29.5772 14.0031 30.2318C15.4762 30.2172 25.502 30.3152 25.7141 30.171ZM81.2468 64.5644C76.1252 64.6951 70.2465 64.5607 65.0767 64.557L33.3821 64.5578L18.7768 64.5628C17.52 64.5644 13.1705 64.6529 12.2583 64.503C12.2519 65.1459 12.2312 65.7885 12.1962 66.4307C17.0502 66.3478 22.2422 66.4203 27.1196 66.4203L54.9852 66.4235L72.3168 66.4164C74.8987 66.4143 78.4743 66.3116 80.9617 66.4214L81.148 66.3668C81.2631 66.0728 81.2224 64.9571 81.2468 64.5644ZM79.3768 30.1769C79.373 29.5805 79.3679 29.0043 79.3955 28.4084C76.7473 28.3785 74.0988 28.3742 71.4506 28.3955C70.6607 28.3977 68.4538 28.4516 67.7944 28.361C67.7154 28.8964 67.7209 29.6599 67.7078 30.2173C69.1145 30.1997 78.564 30.4053 79.3768 30.1769Z" fill="#1EA84E"/>
                    <Path d="M41.4141 27.3452C44.8765 27.2482 48.7849 27.3246 52.2586 27.4173C52.9635 27.4361 54.4223 28.6327 54.2591 29.2532C53.8982 30.6256 52.2078 33.136 51.1458 34.1829C51.8109 34.3097 53.1636 34.903 53.7853 35.19C56.7372 36.551 58.8656 38.9522 59.8399 41.7556C60.4528 43.5194 60.2824 45.4101 60.2927 47.2367C60.3097 50.2541 60.5786 52.7409 58.9325 55.5199C57.3186 58.2444 54.5392 60.1327 51.2509 61.072C44.3809 62.4236 37.4924 60.9541 34.1485 54.9293C32.7658 52.6728 33.2633 50.0544 33.1015 47.705C32.7511 42.6183 33.753 38.4244 38.9546 35.5429C39.8613 35.0406 41.2814 34.568 42.3233 34.1529C41.1654 33.1025 40.1491 31.4579 39.399 30.138C38.666 28.8484 39.9173 27.4342 41.4141 27.3452ZM48.324 59.8839C51.7805 59.4151 54.2312 58.3722 56.3904 55.8442C59.0992 52.6729 58.1059 48.4693 58.263 44.7368C58.5171 38.7039 51.5658 34.5614 45.2216 35.4241C39.2364 36.0136 34.91 39.8857 35.11 45.292C35.2819 49.9421 34.169 54.3894 39.0191 57.6074C42.0626 59.7058 44.4839 60.1091 48.324 59.8839ZM49.1954 33.7522L49.756 33.1278C50.0794 32.5218 52.2371 29.5483 52.2147 29.2597C51.6229 28.824 44.1127 28.9936 42.85 29.0312C42.3666 29.031 41.7292 28.997 41.286 29.1301L41.1733 29.2336C41.2873 29.6734 43.7859 33.373 44.1609 33.7508C45.9066 33.7414 47.4302 33.7099 49.1954 33.7522Z" fill="#1EA84E"/>
                    <Path d="M46.4692 39.8758C47.8921 39.7063 47.6746 41.1807 47.6226 41.9251C49.1778 41.9545 49.6857 42.0996 50.9443 42.8742C51.3779 43.5992 52.0308 44.6577 51.5338 45.4785C51.2697 45.9148 50.8272 45.9817 50.3814 45.6899C49.89 45.3682 49.9153 44.9867 49.8528 44.4941C48.5694 43.1515 47.0035 43.5387 45.2382 43.5506C43.9122 43.5596 43.3412 44.6323 43.6233 45.6532C44.1307 47.4898 47.083 46.6228 48.6763 47.0306C49.8467 47.3302 49.9686 47.3706 50.9413 47.9851C51.4864 48.9084 51.8328 49.5935 51.7142 50.674C51.5025 52.6014 49.8021 53.5821 47.7068 53.37C47.699 53.609 47.6953 53.8582 47.6814 54.0962C47.6288 55.0049 47.7443 55.2574 46.7194 55.5958L45.7775 55.3373C45.6946 54.7733 45.687 54.0916 45.6648 53.513C43.7585 53.3566 42.099 52.764 41.5617 50.8552C41.3295 50.0299 42.2822 49.0167 43.2097 49.7212C43.7485 50.1304 43.4957 50.9625 44.0917 51.3721C45.205 52.1317 47.2966 51.9175 48.6422 51.8761C49.0431 51.5894 49.5528 51.2375 49.7554 50.8157L49.7764 50.7708C49.9477 50.4138 49.878 49.9609 49.8514 49.5668C47.9584 47.6533 44.2714 49.4475 42.58 47.5095C40.2928 44.8889 41.9177 42.0127 45.6911 41.9501C45.6661 41.007 45.3633 40.2676 46.4692 39.8758Z" fill="#1EA84E"/>
                    <Path d="M51.1955 10.9923C52.2472 10.9656 52.7725 11.1204 53.6511 11.6361C54.3109 12.6451 54.9804 13.5521 53.9343 14.5974C52.6629 15.8679 51.136 17.0835 49.7079 18.2258C48.1069 19.457 46.709 20.8414 44.997 21.9493C43.2688 23.0677 41.1869 22.049 39.9901 20.7949C39.5836 20.2729 38.5412 19.675 38.0129 19.1677C37.6168 18.7874 37.2971 18.4028 36.9286 18.0024C36.8336 16.5035 37.391 15.2922 39.3045 14.9572C40.9226 14.6738 42.048 15.9894 43.262 16.7821C43.7731 16.2644 45.0303 15.2767 45.6536 14.8041C47.3884 13.4888 48.9896 11.5703 51.1955 10.9923ZM43.314 18.7328C41.5084 18.2899 40.6044 16.4235 39.2993 16.6611C38.1394 17.4346 39.861 18.2255 40.2927 18.6644C40.7093 19.2252 42.4838 20.4389 43.173 20.878C45.4528 19.7676 48.0221 17.0614 50.0985 15.5152C50.6648 15.0935 51.3743 14.3476 52.0486 14.0483C52.4456 13.3972 52.7417 12.6461 51.4827 12.6549C50.1978 13.1196 50.0963 13.5447 49.1307 14.258C47.7317 15.2912 44.8399 18.1869 43.314 18.7328Z" fill="#1EA84E"/>
                    <Path d="M19.7772 34.2667C20.2882 34.2878 20.5233 34.5386 20.8731 34.8426C21.0003 35.792 20.9587 37.2945 20.9583 38.2783L20.9511 43.8322C20.9443 48.7379 20.9616 53.6436 20.9484 58.549C20.9464 59.3235 21.0821 60.0123 20.2163 60.3197C19.71 60.3663 19.4729 60.3097 19.0753 60.0274C18.9635 59.7489 18.9205 58.9822 18.9201 58.676C18.9131 53.0409 18.9222 47.3975 18.9158 41.7632L18.911 37.1323C18.9106 36.4623 18.8844 35.6355 18.9597 34.9696C18.9957 34.6523 19.4673 34.4393 19.7772 34.2667Z" fill="#1EA84E"/>
                    <Path d="M73.5346 34.2614C74.2004 34.4237 74.5551 34.6713 74.5742 35.2935C74.6192 36.7627 74.6049 38.233 74.6055 39.703L74.6052 47.8247L74.605 55.2817C74.6039 56.7688 74.6456 58.5413 74.5288 60L73.6967 60.384C72.7816 60.2166 72.4956 60.0183 72.4924 59.1298C72.4867 57.5582 72.5091 55.9865 72.5089 54.4148L72.5146 43.965C72.519 41.2735 72.3862 37.7039 72.6198 34.9873C72.6473 34.6672 73.2214 34.4076 73.5346 34.2614Z" fill="#1EA84E"/>
                  </Svg>
                </View>
              </View>
            </TouchableOpacity>

          </View>

          {/* Learn Trading card */}
          <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("/(tabs)/news" as any)}
              style={{
                borderRadius: 18,
                overflow: "hidden",
                backgroundColor: TEAL,
              }}
            >
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 22,
              }}>
                {/* Left: text content */}
                <View style={{ flex: 1, gap: 6, marginTop: -6 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 20, color: WHITE, lineHeight: 27 }}>Learn Trading</Text>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path d="M5 12h14M12 5l7 7-7 7" stroke={WHITE} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </View>
                  <View style={{ gap: 3, marginTop: 2 }}>
                    {["Basics", "Portfolio", "Charts", "Risk"].map((topic) => (
                      <View key={topic} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: "rgba(255,255,255,0.55)" }} />
                        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: "rgba(255,255,255,0.68)" }}>{topic}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                {/* Right: illustration */}
                <SvgXml
                  xml={EDUCATION_ICON_SVG}
                  width={140}
                  height={103}
                  style={{ marginLeft: 8 }}
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

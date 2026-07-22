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
                  <Svg width={32} height={32} viewBox="0 0 545 534" fill="none">
                    <Path d="M428.722 267.997C436.649 267.081 445.229 269.468 451.581 274.17C453.686 275.729 455.059 277.779 457.422 279.302C460.317 278.304 462.877 276.364 465.618 275.144C490.292 264.154 517.67 282.576 510.663 309.777C507.638 321.52 497.845 327.223 489.058 334.279L467.47 351.837L438.938 375.213C433.945 379.234 429.866 382.751 424.554 386.428C419.118 390.191 414.051 393.194 408.518 396.654L383.333 412.318L351.85 431.911C348.619 433.945 345.237 436.062 342.102 438.193C327.069 448.406 309.056 452.539 290.971 449.521C286.788 448.824 282.668 447.617 278.511 446.695L257.891 442.134L203.35 429.918C195.791 428.242 184.254 427.278 176.868 430.595C172.352 432.621 166.579 437.527 162.456 440.086C169.982 448.39 172.127 459.446 163.33 468.108C160.668 470.729 157.376 472.542 154.461 474.785C145.297 481.838 135.743 488.355 126.546 495.361C123.665 497.55 121.286 496.683 118.412 495.134C118.213 494.784 118.022 494.429 117.839 494.069C116.437 491.275 117.045 489.415 117.961 486.676C120.619 484.966 123.678 482.527 126.277 480.597L138.561 471.591C143.275 468.1 148.228 464.765 152.849 461.157C160.221 455.399 156.617 453.242 153.038 447.171C149.775 443.095 146.124 437.629 143.122 433.36L129.369 413.917L90.4386 359.391C86.6355 354.116 82.9536 348.476 79.1362 343.183C77.1478 340.426 74.6554 336.48 72.3671 334.072L69.6045 333.224C65.1072 334.336 58.077 340.556 53.9781 343.533C47.6284 348.142 41.2499 352.92 34.9638 357.618C30.5958 360.885 28.8884 362.872 23.5916 359.934C22.6077 357.529 21.6998 355.106 22.8049 352.555C23.0809 351.918 23.4442 351.377 23.9649 350.91C27.577 347.664 60.3856 323.502 62.2878 322.855C63.7447 322.358 65.2251 321.854 66.7473 321.588C72.0845 320.656 78.5292 322.445 81.9567 326.701C83.4797 328.594 84.917 331.406 86.907 332.785C86.7971 332.832 94.3989 326.192 94.9627 325.701C98.5859 322.554 102.181 319.374 105.747 316.164C115.161 307.819 125.722 297.572 136.385 291.018C161.994 275.28 194.291 272.468 223.256 279.495C237.881 282.777 249.971 292.005 263.053 297.857C276.705 303.962 301.344 304.487 316.6 304.821C318.995 302.889 321.885 301.369 324.488 299.664L342.059 288.276C347.437 284.832 353.433 281.038 358.71 277.489C371.667 268.776 387.503 267.603 400.226 277.476C401.275 278.291 402.446 278.863 403.585 279.855C407.97 277.834 409.146 276.607 413.181 273.912C418.33 270.475 422.697 269.031 428.722 267.997ZM244.06 362.498L244.297 362.24C246.422 359.937 247.727 359.404 250.925 359.375C258.978 359.3 267.095 359.407 275.15 359.396L327.87 359.381L344.348 359.404C349.228 359.409 353.124 359.785 357.832 358.315C373.41 353.443 377.058 333.741 365.094 323.178C362.648 321.037 359.732 319.478 356.573 318.622C352.757 317.624 347.613 317.794 343.587 317.606C335.795 317.24 327.708 317.434 319.959 317.011L296.581 315.809C279.714 314.89 267.782 313.767 252.566 306.062C247.35 303.422 242.677 300.651 237.585 297.753C206.527 282.696 166.333 284.276 137.927 304.529C126.228 313.068 115.914 323.823 104.746 333.096C100.336 336.757 98.708 339.188 93.4387 342.708L93.7607 343.089C96.3093 346.142 99.2562 350.651 101.596 353.994L111.22 367.533L143.407 412.791C147.216 418.058 150.923 423.419 154.656 428.738C154.847 429.01 155.293 429.446 155.628 429.435C157.666 429.386 160.163 426.722 161.807 425.667C165.35 423.395 168.799 421.11 172.668 419.434C178.502 417.207 187.078 415.462 193.34 416.225C202.281 417.314 211.277 419.727 220.017 421.836C225.269 423.103 230.003 423.944 235.262 424.973C240.028 425.905 244.977 427.315 249.759 428.336C252.581 428.939 255.43 429.43 258.225 430.07C266.898 432.059 275.268 434.185 284.044 435.762C289.936 436.822 294.18 438.159 300.484 438.376C308.183 438.64 317.311 437.133 324.493 434.31C328.714 432.652 336.189 427.552 340.236 425.142C346.376 421.487 352.395 417.319 358.465 413.543L394.712 390.987C407.35 383.208 419.57 375.933 430.938 366.366C432.415 365.12 433.868 363.833 435.359 362.606L454.811 346.771C467.564 336.378 480.547 326.147 493.108 315.527C497.839 311.527 499.409 308.216 499.67 302.087C499.867 297.486 498.936 293.337 495.639 289.851C492.094 286.112 487.181 283.908 481.982 283.722C481.548 283.709 481.114 283.701 480.678 283.696C470.696 284.096 466.047 288.443 458.026 293.828L442.19 304.406C439.978 305.908 437.692 307.161 435.476 308.639L408.463 326.811C402.635 330.764 396.485 334.514 390.71 338.564C389.116 339.681 385.361 341.94 384.097 343C382.349 353.879 376.111 363.107 366.057 368.139C356.658 372.844 343.416 371.573 333.009 371.57L290.766 371.552L264.204 371.57C258.958 371.599 253.129 371.949 247.98 371.264C243.192 370.627 243.609 365.846 244.06 362.498ZM377.027 282.895C367.973 283.989 362.313 289.82 354.819 294.348C348.813 297.975 343.105 301.565 337.538 305.84C342.387 305.79 351.171 305.999 355.926 306.49C358.478 306.605 360.208 307.315 362.606 307.835C370.688 302.628 378.708 297.403 386.458 291.705C388.69 290.062 391.362 289.073 393.464 287.216C388.445 282.861 383.419 282.772 377.027 282.895ZM388.919 325.317C391.005 323.857 392.951 322.745 394.992 321.374L433.778 295.59C436.303 293.904 438.813 292.219 441.328 290.522C443.56 289.018 445.394 288.248 447.688 286.469C442.472 280.923 436.402 279.886 429.121 280.278C421.494 282.051 417.662 285.255 411.368 289.54C403.899 294.627 396.272 299.5 389.004 304.879C384.6 308.051 378.184 311.629 373.99 315.042C379.116 320.859 380.294 322.157 382.78 329.641C384.747 328.252 387.022 326.735 388.919 325.317Z" fill="#1EA84E"/>
                    <Path d="M307.542 21.2644C337.706 20.2115 365.004 28.6663 388.289 47.8712C407.912 64.1108 421.859 85.9745 428.168 110.391C437.674 148.144 428.213 188.174 402.547 217.833C382.107 241.669 352.672 256.332 320.999 258.457C320.097 258.516 319.195 258.569 318.293 258.618C310.057 259.062 302.8 258.262 294.736 256.978C239.452 248.177 198.777 199.969 195.883 145.796C194.425 113.68 205.966 82.3005 227.989 58.4992C247.947 36.8891 277.854 22.6847 307.542 21.2644ZM314.99 246.767C342.879 246.231 369.402 234.819 388.701 215.053C409.075 194.29 420.307 166.493 419.969 137.67C419.464 109.739 406.626 81.3811 386.388 61.8819C368.492 44.6408 338.214 31.8562 313.013 33.0237C276.43 34.0418 245.598 51.1141 225.538 81.1931C213.256 99.8274 207.035 121.684 207.697 143.866C207.913 149.902 208.894 155.757 210.214 161.641C214.959 183.818 226.591 204.007 243.509 219.431C262.984 237.041 288.507 246.802 314.99 246.767Z" fill="#1EA84E"/>
                    <Path d="M312.459 62.9948C314.916 62.7639 315.437 62.9893 317.59 64.0144C320.555 68.0744 319.658 73.7708 319.607 78.9717C319.817 78.9905 320.025 79.0127 320.235 79.0385C328.29 80.0506 338.6 85.435 343.517 91.795C347.666 97.16 351.301 105.343 350.468 112.226C349.856 117.292 345.495 116.916 341.628 116.304C337.761 113.08 339.273 111.401 338.232 107.241C335.047 95.0113 323.16 89.9188 311.195 90.9724C297.954 92.1381 288.232 100.943 289.153 114.364C289.789 123.625 298.515 130.184 307.116 132.29C318.729 135.134 330.531 136.48 340.053 144.556C352.933 155.425 354.263 175.574 343.363 188.282C337.381 195.299 328.833 199.731 319.557 200.626C319.62 206.235 320.472 211.461 317.518 216.146C316.744 216.516 315.967 216.874 315.184 217.22C312.646 217.492 312.289 217.266 310.062 216.205C307.201 211.049 307.919 206.537 307.986 200.642C294.076 199.533 280.749 188.187 277.694 174.808C276.763 170.73 276.249 163.329 282.253 163.041C290.26 162.657 288.528 170.814 290.415 175.269C295.465 187.183 308.183 190.444 320.209 188.55C325.706 187.702 331.149 184.296 334.573 180.055C337.964 175.783 339.728 169.936 338.682 164.558C335.518 148.261 316.22 146.852 302.94 143.504C299.505 142.637 292.796 139.225 289.973 137.243C284.116 133.13 278.724 125.438 277.567 118.386C274.352 99.0185 288.012 81.9775 307.904 79.114C307.919 75.3917 307.64 69.9198 308.542 66.3126C308.678 65.7656 309.66 64.5129 310.051 64.0061C310.791 63.6645 311.696 63.3133 312.459 62.9948Z" fill="#1EA84E"/>
                  </Svg>
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
                padding: 28,
              }}>
                {/* Left: text content */}
                <View style={{ flex: 1, gap: 8, marginTop: -6 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text numberOfLines={1} style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 20, color: WHITE, lineHeight: 27, flexShrink: 1 }}>Learn Trading</Text>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path d="M5 12h14M12 5l7 7-7 7" stroke={WHITE} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </View>
                  <View style={{ gap: 6, marginTop: 4 }}>
                    {["Basics", "Portfolio", "Charts", "Risk"].map((topic) => (
                      <View key={topic} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: "rgba(255,255,255,0.55)" }} />
                        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: "rgba(255,255,255,0.68)" }}>{topic}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                {/* Right: illustration */}
                <SvgXml
                  xml={EDUCATION_ICON_SVG}
                  width={160}
                  height={124}
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

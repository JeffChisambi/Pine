/**
 * card-success.tsx
 *
 * Shown after a successful bank card deposit via the Mastercard Gateway.
 * Receives route params from payment-card.tsx:
 *   amount    — numeric amount (string)
 *   currency  — 'MWK' | 'USD'
 *   last4     — last 4 digits of the charged card returned by the gateway
 *   cardBrand — card brand string (e.g. 'MASTERCARD', 'VISA')
 *   txRef     — Pine transaction reference
 */
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Svg, {
  Circle,
  Defs,
  Path,
  RadialGradient,
  Stop,
} from "react-native-svg";
import { useColors } from "@/hooks/useColors";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const TEAL  = "#164951";
const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";

const { width: SCREEN_W } = Dimensions.get("window");

// ─── Illustrations ────────────────────────────────────────────────────────────

function Sparkle({
  x,
  y,
  size = 20,
  color = "#FFD84A",
}: {
  x: number;
  y: number;
  size?: number;
  color?: string;
}) {
  const arm = size * 0.35;
  return (
    <Path
      d={`M${x},${y - size / 2} L${x + arm},${y - arm} L${x + size / 2},${y} L${x + arm},${y + arm} L${x},${y + size / 2} L${x - arm},${y + arm} L${x - size / 2},${y} L${x - arm},${y - arm} Z`}
      fill={color}
    />
  );
}

function SuccessIllustration() {
  const cx = SCREEN_W / 2;
  const cy = 140;
  return (
    <Svg width={SCREEN_W} height={280} viewBox={`0 0 ${SCREEN_W} 280`}>
      <Defs>
        <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#45B369" stopOpacity={0.18} />
          <Stop offset="100%" stopColor="#45B369" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={cx} cy={cy} r={115} fill="url(#glow)" />
      <Circle cx={cx} cy={cy} r={72} fill="none" stroke="#D1FADF" strokeWidth={1.5} strokeDasharray="4 6" />
      <Circle cx={cx} cy={cy} r={56} fill="#ECFDF5" />
      <Circle cx={cx} cy={cy} r={44} fill={GREEN} />
      <Path
        d={`M${cx - 16},${cy} L${cx - 4},${cy + 14} L${cx + 18},${cy - 14}`}
        stroke={WHITE}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Sparkle x={cx - 70} y={cy - 50} size={18} color="#FFD84A" />
      <Sparkle x={cx + 68} y={cy - 55} size={12} color="#FFD84A" />
      <Sparkle x={cx - 55} y={cy + 55} size={10} color={GREEN} />
      <Sparkle x={cx + 58} y={cy + 48} size={16} color="#FFD84A" />
      <Sparkle x={cx - 20} y={cy - 80} size={8} color={GREEN} />
      <Sparkle x={cx + 30} y={cy + 75} size={8} color="#FFD84A" />
      <Circle cx={cx - 80} cy={cy + 10} r={4} fill="#D1FADF" />
      <Circle cx={cx + 82} cy={cy + 8} r={3} fill="#BBF7D0" />
      <Circle cx={cx} cy={cy - 90} r={4} fill="#D1FADF" />
    </Svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(amount: number, currency: string): string {
  const symbol = currency === "MWK" ? "MK" : "$";
  return `${symbol} ${amount.toLocaleString()}`;
}

function normaliseBrand(brand: string): string {
  const b = brand.toUpperCase();
  if (b.includes("MASTER")) return "Mastercard";
  if (b.includes("VISA"))   return "Visa";
  return brand;
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function CardSuccessScreen() {
  const insets    = useSafeAreaInsets();
  const topPad    = Platform.OS === "web" ? 48 : insets.top || 44;
  const bottomPad = insets.bottom || 24;
  const c         = useColors();

  const params   = useLocalSearchParams<{
    amount: string;
    currency: string;
    last4: string;
    cardBrand: string;
    txRef: string;
  }>();

  const amount    = parseFloat(params.amount ?? "0");
  const currency  = params.currency ?? "MWK";
  const last4     = params.last4 ?? "••••";
  const cardBrand = normaliseBrand(params.cardBrand ?? "Card");
  const txRef     = params.txRef ?? "";

  // Slide-up animation for the summary card
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 10,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const STATS = [
    { label: "Amount Deposited", value: formatAmount(amount, currency) },
    { label: "Card",             value: `${cardBrand} ••••${last4}` },
    { label: "Status",           value: "Successful ✓" },
    ...(txRef ? [{ label: "Reference", value: txRef.slice(-12) }] : []),
  ];

  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: topPad }]}>
      {/* Illustration */}
      <SuccessIllustration />

      {/* Heading */}
      <View style={styles.headingWrap}>
        <Text style={[styles.heading, { color: c.text }]}>Deposit Successful!</Text>
        <Text style={[styles.subheading, { color: MUTED }]}>
          Your wallet has been topped up. Funds are available immediately.
        </Text>
      </View>

      {/* Summary card */}
      <Animated.View
        style={[
          styles.summaryCard,
          { backgroundColor: c.card, borderColor: c.border },
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {STATS.map((stat, i) => (
          <React.Fragment key={stat.label}>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: MUTED }]}>{stat.label}</Text>
              <Text style={[styles.statValue, { color: c.text }]}>{stat.value}</Text>
            </View>
            {i < STATS.length - 1 && (
              <View style={[styles.divider, { backgroundColor: c.border }]} />
            )}
          </React.Fragment>
        ))}
      </Animated.View>

      {/* CTAs */}
      <View style={[styles.ctaWrap, { paddingBottom: bottomPad + 16 }]}>
        <TouchableOpacity
          style={[styles.ctaOutline, { borderColor: TEAL }]}
          activeOpacity={0.75}
          onPress={() => router.push("/(tabs)/" as any)}
        >
          <Text style={[styles.ctaOutlineText, { color: TEAL }]}>View Wallet</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ctaSolid}
          activeOpacity={0.85}
          onPress={() => router.replace("/(tabs)/" as any)}
        >
          <Text style={styles.ctaSolidText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
  },

  headingWrap: {
    alignItems: "center",
    paddingHorizontal: 32,
    marginTop: -8,
    marginBottom: 24,
  },
  heading: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 26,
    marginBottom: 10,
    textAlign: "center",
  },
  subheading: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },

  summaryCard: {
    width: SCREEN_W - 40,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 24,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  statLabel: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
  },
  statValue: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    maxWidth: "55%",
    textAlign: "right",
  },
  divider: {
    height: 1,
  },

  ctaWrap: {
    width: SCREEN_W - 40,
    gap: 12,
    marginTop: "auto",
  },
  ctaOutline: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  ctaOutlineText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 15,
  },
  ctaSolid: {
    backgroundColor: TEAL,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaSolidText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: WHITE,
  },
});

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path, Circle, G, Defs, RadialGradient, Stop } from "react-native-svg";

const TEAL = "#164951";
const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const DARK = "#111827";
const MUTED = "#9CA3AF";
const DIVIDER = "#EBECEF";
const CARD_BG = "#F9FAFB";
const CARD_BORDER = "#F3F4F6";

const { width: SCREEN_W } = Dimensions.get("window");

function Sparkle({ x, y, size = 20, color = "#FFD84A" }: { x: number; y: number; size?: number; color?: string }) {
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
          <Stop offset="0%" stopColor="#45B369" stopOpacity={0.15} />
          <Stop offset="100%" stopColor="#45B369" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* Glow background */}
      <Circle cx={cx} cy={cy} r={110} fill="url(#glow)" />

      {/* Outer ring */}
      <Circle cx={cx} cy={cy} r={72} fill="none" stroke="#D1FADF" strokeWidth={1.5} strokeDasharray="4 6" />

      {/* Middle ring */}
      <Circle cx={cx} cy={cy} r={56} fill="#ECFDF5" />

      {/* Green circle */}
      <Circle cx={cx} cy={cy} r={44} fill={GREEN} />

      {/* Checkmark */}
      <Path
        d={`M${cx - 16},${cy} L${cx - 4},${cy + 14} L${cx + 18},${cy - 14}`}
        stroke={WHITE}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Sparkles */}
      <Sparkle x={cx - 70} y={cy - 50} size={18} color="#FFD84A" />
      <Sparkle x={cx + 68} y={cy - 55} size={12} color="#FFD84A" />
      <Sparkle x={cx - 55} y={cy + 55} size={10} color="#45B369" />
      <Sparkle x={cx + 58} y={cy + 48} size={16} color="#FFD84A" />
      <Sparkle x={cx - 20} y={cy - 80} size={8} color="#45B369" />
      <Sparkle x={cx + 30} y={cy + 75} size={8} color="#FFD84A" />

      {/* Dot accents */}
      <Circle cx={cx - 80} cy={cy + 10} r={4} fill="#D1FADF" />
      <Circle cx={cx + 82} cy={cy + 8} r={3} fill="#BBF7D0" />
      <Circle cx={cx} cy={cy - 90} r={4} fill="#D1FADF" />
    </Svg>
  );
}

const ORDER_STATS = [
  { label: "Asset", value: "Airbnb (ABNB)" },
  { label: "Open Price", value: "K124.50" },
  { label: "Shares", value: "1" },
  { label: "Total Paid", value: "K124.49" },
];

export default function SuccessScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;
  const bottomPad = insets.bottom || 24;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Success illustration */}
      <SuccessIllustration />

      {/* Text */}
      <View style={styles.textBlock}>
        <Text style={styles.title}>Order Placed!</Text>
        <Text style={styles.subtitle}>
          Your buy order for Airbnb (ABNB) has been placed successfully and is being processed.
        </Text>
      </View>

      {/* Order stats card */}
      <View style={styles.statsCard}>
        {ORDER_STATS.map((stat, i) => (
          <View key={stat.label}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
            </View>
            {i < ORDER_STATS.length - 1 && <View style={styles.statDivider} />}
          </View>
        ))}
      </View>

      {/* Buttons */}
      <View style={[styles.bottomButtons, { paddingBottom: bottomPad + 16 }]}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push("/trade/history" as any)}
        >
          <Text style={styles.secondaryBtnText}>View History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push("/(tabs)/" as any)}
        >
          <Text style={styles.primaryBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: WHITE,
    alignItems: "center",
  },
  textBlock: {
    alignItems: "center",
    paddingHorizontal: 32,
    marginTop: -8,
    marginBottom: 24,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    color: DARK,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: MUTED,
    textAlign: "center",
    lineHeight: 21,
  },
  statsCard: {
    width: SCREEN_W - 40,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 24,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 13,
  },
  statDivider: { height: 1, backgroundColor: DIVIDER },
  statLabel: { fontFamily: "Poppins_400Regular", fontSize: 13, color: MUTED },
  statValue: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: DARK },
  bottomButtons: {
    width: SCREEN_W - 40,
    gap: 12,
    marginTop: "auto",
  },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: TEAL,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  secondaryBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: TEAL,
  },
  primaryBtn: {
    backgroundColor: TEAL,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: WHITE,
  },
});

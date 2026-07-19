import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

const TEAL = "#164951";
const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";

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
      <Circle cx={cx} cy={cy} r={110} fill="url(#glow)" />
      <Circle cx={cx} cy={cy} r={72} fill="none" stroke="#D1FADF" strokeWidth={1.5} strokeDasharray="4 6" />
      <Circle cx={cx} cy={cy} r={56} fill="#ECFDF5" />
      <Circle cx={cx} cy={cy} r={44} fill={GREEN} />
      <Path d={`M${cx - 16},${cy} L${cx - 4},${cy + 14} L${cx + 18},${cy - 14}`} stroke={WHITE} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Sparkle x={cx - 70} y={cy - 50} size={18} color="#FFD84A" />
      <Sparkle x={cx + 68} y={cy - 55} size={12} color="#FFD84A" />
      <Sparkle x={cx - 55} y={cy + 55} size={10} color="#45B369" />
      <Sparkle x={cx + 58} y={cy + 48} size={16} color="#FFD84A" />
      <Sparkle x={cx - 20} y={cy - 80} size={8} color="#45B369" />
      <Sparkle x={cx + 30} y={cy + 75} size={8} color="#FFD84A" />
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
  const c = useColors();

  return (
    <View style={{ flex: 1, backgroundColor: c.background, paddingTop: topPad, alignItems: "center" }}>
      <SuccessIllustration />

      <View style={{ alignItems: "center", paddingHorizontal: 32, marginTop: -8, marginBottom: 24 }}>
        <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 26, color: c.text, marginBottom: 10, textAlign: "center" }}>Order Placed!</Text>
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: MUTED, textAlign: "center", lineHeight: 21 }}>
          Your buy order for Airbnb (ABNB) has been placed successfully and is being processed.
        </Text>
      </View>

      <View style={{ width: SCREEN_W - 40, backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, paddingHorizontal: 16, paddingVertical: 4, marginBottom: 24 }}>
        {ORDER_STATS.map((stat, i) => (
          <React.Fragment key={stat.label}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 13 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED }}>{stat.label}</Text>
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: c.text }}>{stat.value}</Text>
            </View>
            {i < ORDER_STATS.length - 1 && <View style={{ height: 1, backgroundColor: c.border }} />}
          </React.Fragment>
        ))}
      </View>

      <View style={{ width: SCREEN_W - 40, gap: 12, marginTop: "auto", paddingBottom: bottomPad + 16 }}>
        <TouchableOpacity style={{ borderWidth: 1.5, borderColor: TEAL, borderRadius: 14, paddingVertical: 15, alignItems: "center" }} onPress={() => router.push("/trade/history" as any)}>
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: TEAL }}>View History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ backgroundColor: TEAL, borderRadius: 14, paddingVertical: 16, alignItems: "center" }} onPress={() => router.push("/(tabs)/" as any)}>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: WHITE }}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

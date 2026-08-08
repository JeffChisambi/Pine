import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Dimensions,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

const GREEN = "#45B369";
const AMBER = "#F59E0B";
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

function SuccessIllustration({ queued }: { queued: boolean }) {
  const cx = SCREEN_W / 2;
  const cy = 140;
  const accent = queued ? AMBER : GREEN;
  const glowColor = queued ? "#FEF3C7" : "#D1FADF";
  const bgColor  = queued ? "#FFFBEB" : "#ECFDF5";
  return (
    <Svg width={SCREEN_W} height={280} viewBox={`0 0 ${SCREEN_W} 280`}>
      <Defs>
        <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={accent} stopOpacity={0.15} />
          <Stop offset="100%" stopColor={accent} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={cx} cy={cy} r={110} fill="url(#glow)" />
      <Circle cx={cx} cy={cy} r={72} fill="none" stroke={glowColor} strokeWidth={1.5} strokeDasharray="4 6" />
      <Circle cx={cx} cy={cy} r={56} fill={bgColor} />
      <Circle cx={cx} cy={cy} r={44} fill={accent} />
      {queued ? (
        /* Clock icon for queued */
        <>
          <Circle cx={cx} cy={cy} r={16} fill="none" stroke={WHITE} strokeWidth={2.5} />
          <Path d={`M${cx},${cy - 10} L${cx},${cy} L${cx + 8},${cy + 5}`} stroke={WHITE} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      ) : (
        /* Checkmark for executed */
        <Path d={`M${cx - 16},${cy} L${cx - 4},${cy + 14} L${cx + 18},${cy - 14}`} stroke={WHITE} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      )}
      <Sparkle x={cx - 70} y={cy - 50} size={18} color="#FFD84A" />
      <Sparkle x={cx + 68} y={cy - 55} size={12} color="#FFD84A" />
      <Sparkle x={cx - 55} y={cy + 55} size={10} color={accent} />
      <Sparkle x={cx + 58} y={cy + 48} size={16} color="#FFD84A" />
      <Sparkle x={cx - 20} y={cy - 80} size={8} color={accent} />
      <Sparkle x={cx + 30} y={cy + 75} size={8} color="#FFD84A" />
      <Circle cx={cx - 80} cy={cy + 10} r={4} fill={glowColor} />
      <Circle cx={cx + 82} cy={cy + 8} r={3} fill={glowColor} />
      <Circle cx={cx} cy={cy - 90} r={4} fill={glowColor} />
    </Svg>
  );
}

export default function SuccessScreen() {
  const insets = useSafeAreaInsets();
  const topPad    = Platform.OS === "web" ? 48 : insets.top || 16;
  const bottomPad = insets.bottom || 24;
  const c = useColors();

  const params = useLocalSearchParams<{
    queued?: string;
    marketOpen?: string;
    symbol?: string;
    stockName?: string;
    side?: string;
    quantity?: string;
    total?: string;
    message?: string;
  }>();

  const symbol     = params.symbol ?? "—";
  const stockName  = params.stockName ?? "Stock";
  const side       = params.side ?? "BUY";
  const quantity   = params.quantity ?? "—";
  const total      = params.total ?? "—";

  // The amber "waiting" treatment (clock + trading-hours banner) applies ONLY
  // when the market is closed. During market hours the order goes straight to
  // the broker, so the screen shows the green confirmation.
  const waitingForOpen = params.marketOpen !== "1";

  const title = "Order Submitted!";
  // Prefer the server's message — it knows whether the market is open
  // ("being processed by the broker") or closed ("executed when the market
  // opens"), so the user is never told to wait for open during hours.
  const subtitle = params.message
    ? String(params.message)
    : `Your ${side === "BUY" ? "buy" : "sell"} order for ${symbol} has been submitted and is being processed.`;

  const stats = [
    { label: "Stock",      value: `${symbol} · ${stockName}` },
    { label: "Order Type", value: side === "BUY" ? "Buy" : "Sell" },
    { label: "Quantity",   value: `${quantity} share${Number(quantity) !== 1 ? "s" : ""}` },
    { label: side === "SELL" ? "You Receive" : "Total", value: total },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, alignItems: "center", paddingTop: topPad }}
      >
      <SuccessIllustration queued={waitingForOpen} />

      <View style={{ alignItems: "center", paddingHorizontal: 32, marginTop: -8, marginBottom: 24 }}>
        <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 26, color: c.text, marginBottom: 10, textAlign: "center" }}>
          {title}
        </Text>
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: MUTED, textAlign: "center", lineHeight: 21 }}>
          {subtitle}
        </Text>
        {waitingForOpen && (
          <View style={{ marginTop: 12, backgroundColor: "#FFFBEB", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: "#FDE68A" }}>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: "#92400E", textAlign: "center", lineHeight: 18 }}>
              🕐  MSE trading hours: 10:00 AM – 2:00 PM CAT, Monday – Friday
            </Text>
          </View>
        )}
      </View>

      <View style={{ width: SCREEN_W - 40, backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, paddingHorizontal: 16, paddingVertical: 4, marginBottom: 24 }}>
        {stats.map((stat, i) => (
          <React.Fragment key={stat.label}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 13 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED }}>{stat.label}</Text>
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: c.text }}>{stat.value}</Text>
            </View>
            {i < stats.length - 1 && <View style={{ height: 1, backgroundColor: c.border }} />}
          </React.Fragment>
        ))}
      </View>

      <View style={{ width: SCREEN_W - 40, gap: 12, marginTop: "auto", paddingBottom: bottomPad + 16 }}>
        <TouchableOpacity
          style={{ borderWidth: 1.5, borderColor: c.primary, borderRadius: 14, paddingVertical: 15, alignItems: "center" }}
          onPress={() => router.push("/trade/history" as any)}
        >
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: c.primary }}>View Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ backgroundColor: c.primary, borderRadius: 14, paddingVertical: 16, alignItems: "center" }}
          onPress={() => router.push("/(tabs)/" as any)}
        >
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: WHITE }}>Back to Home</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </View>
  );
}

import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { guardedBack, guardedPush } from "@/utils/navigation";
import { useColors } from "@/hooks/useColors";
import { TBILL_OPTIONS, calculateReturns } from "./data";

const TEAL = "#164951";
const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19l-7-7 7-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SuccessIllustration() {
  return (
    <View style={{ width: 112, height: 112, borderRadius: 56, backgroundColor: GREEN + "20", alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: GREEN + "35", alignItems: "center", justifyContent: "center" }}>
        <Svg width={44} height={44} viewBox="0 0 44 44" fill="none">
          <Circle cx={22} cy={22} r={22} fill={GREEN} />
          <Path d="M12 22.5l7 7 13-14" stroke={WHITE} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
    </View>
  );
}

export default function TreasurySuccess() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 44;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 16);
  const c = useColors();
  const { id, amount } = useLocalSearchParams<{ id: string; amount: string }>();

  const bill = TBILL_OPTIONS.find((b) => b.id === id) ?? TBILL_OPTIONS[0];
  const numericAmount = Number(amount) || 0;
  const { earnings, maturityValue } = calculateReturns(numericAmount, bill.yieldPct, bill.duration);

  const maturityDateStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + bill.duration);
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  })();

  // Generate a reference number
  const refNumber = `TBL-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 900) + 100)}`;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <View style={{ paddingTop: topPad + 8, paddingHorizontal: 16 }}>
        <TouchableOpacity
          onPress={() => guardedBack("/treasury")}
          activeOpacity={0.7}
          style={{ width: 40, height: 40, justifyContent: "center" }}
        >
          <BackIcon color={c.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 20, paddingBottom: bottomPad + 100 }}
      >
        {/* Success illustration */}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <SuccessIllustration />
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 24, color: c.text, marginTop: 20, marginBottom: 6 }}>
            Investment Placed!
          </Text>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: MUTED, textAlign: "center", lineHeight: 22 }}>
            Your Treasury Bill order has been submitted successfully and is pending auction allocation.
          </Text>
        </View>

        {/* Reference card */}
        <View style={{ backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 18, marginBottom: 16 }}>
          <View style={{ alignItems: "center", paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: c.border, marginBottom: 14 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED, marginBottom: 4 }}>Reference Number</Text>
            <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 17, color: TEAL, letterSpacing: 0.5 }}>{refNumber}</Text>
          </View>

          {[
            { label: "Amount Invested", value: `MWK ${numericAmount.toLocaleString()}` },
            { label: "Treasury Bill", value: `${bill.duration}-Day T-Bill` },
            { label: "Annual Yield", value: `${bill.yieldPct}%`, color: GREEN },
            { label: "Estimated Earnings", value: `+MWK ${earnings.toLocaleString()}`, color: GREEN },
            { label: "Maturity Date", value: maturityDateStr },
          ].map((row, i, arr) => (
            <View key={row.label}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 11 }}>
                <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: MUTED }}>{row.label}</Text>
                <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: row.color ?? c.text }}>{row.value}</Text>
              </View>
              {i < arr.length - 1 && <View style={{ height: 1, backgroundColor: c.border }} />}
            </View>
          ))}
        </View>

        {/* Maturity value highlight */}
        <View style={{ backgroundColor: TEAL, borderRadius: 16, padding: 20, marginBottom: 8, alignItems: "center" }}>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: "rgba(255,255,255,0.65)", marginBottom: 6 }}>
            Estimated Maturity Value
          </Text>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 32, color: WHITE, letterSpacing: -0.5 }}>
            MWK {maturityValue.toLocaleString()}
          </Text>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 6 }}>
            Due on {maturityDateStr}
          </Text>
        </View>
      </ScrollView>

      {/* CTAs */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: Math.max(bottomPad, 24), backgroundColor: c.background, borderTopWidth: 1, borderTopColor: c.border, gap: 10 }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => guardedPush(() => router.push("/treasury/my-investments" as any))}
          style={{ height: 56, backgroundColor: TEAL, borderRadius: 14, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: WHITE }}>View My Investments</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

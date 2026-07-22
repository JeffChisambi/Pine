import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { guardedBack, guardedPush } from "@/utils/navigation";
import { useColors } from "@/hooks/useColors";
import { TBILL_OPTIONS } from "./data";

const TEAL = "#164951";
const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";
const RED = "#EF4770";

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19l-7-7 7-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 13 }}>
      <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: MUTED }}>{label}</Text>
      <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: valueColor ?? c.text }}>{value}</Text>
    </View>
  );
}


export default function TreasuryDetails() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 44;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 16);
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();

  const bill = TBILL_OPTIONS.find((b) => b.id === id) ?? TBILL_OPTIONS[0];

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <View style={{ backgroundColor: c.background, paddingTop: topPad + 8, paddingBottom: 28, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
          <TouchableOpacity onPress={() => guardedBack("/treasury")} activeOpacity={0.7} style={{ width: 40, height: 40, justifyContent: "center" }}>
            <BackIcon color={c.text} />
          </TouchableOpacity>
          <Text style={{ flex: 1, textAlign: "center", fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text }}>
            {bill.duration}-Day T-Bill
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Yield highlight */}
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED, marginBottom: 6, letterSpacing: 0.4 }}>
            ANNUAL YIELD
          </Text>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 48, color: c.text, letterSpacing: -1 }}>
            {bill.yieldPct}%
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN }} />
            <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: c.text }}>
              {bill.duration} Days · {bill.riskLevel} Risk
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad + 80 }}
        style={{ flex: 1, backgroundColor: c.background }}
      >
        <View style={{ paddingTop: 0, paddingHorizontal: 20 }}>

          {/* Overview card */}
          <View style={{ backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, paddingHorizontal: 18, marginBottom: 16 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text, paddingTop: 16, paddingBottom: 4 }}>Overview</Text>
            <InfoRow label="Issuer" value="Government of Malawi" />
            <InfoRow label="Investment Type" value="Treasury Bill" />
            <InfoRow label="Duration" value={`${bill.duration} Days`} />
            <InfoRow label="Current Yield" value={`${bill.yieldPct}% p.a.`} valueColor={GREEN} />
            <InfoRow label="Min Investment" value={`MWK ${bill.minInvestment.toLocaleString()}`} />
            <InfoRow label="Auction Date" value={bill.auctionDate} />
            <InfoRow label="Issue Date" value={bill.issueDate} />
            <InfoRow label="Maturity Date" value={bill.maturityDate} />
          </View>


        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: Math.max(bottomPad, 24), backgroundColor: c.background, borderTopWidth: 1, borderTopColor: c.border }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => guardedPush(() => router.push({ pathname: "/treasury/calculator" as any, params: { id: bill.id } }))}
          style={{ height: 56, backgroundColor: TEAL, borderRadius: 14, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: WHITE }}>Invest in {bill.duration}-Day T-Bill</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

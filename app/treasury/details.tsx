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
import { TBILL_OPTIONS, calculateReturns } from "./data";

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

function BenefitRow({ text }: { text: string }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: GREEN + "22", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
        <Svg width={10} height={10} viewBox="0 0 12 12" fill="none">
          <Path d="M2.5 6l2.5 2.5 4.5-5" stroke={GREEN} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
      <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: c.text, lineHeight: 21, flex: 1 }}>{text}</Text>
    </View>
  );
}

function RiskRow({ text }: { text: string }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: "#F59E0B22", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
        <Svg width={10} height={10} viewBox="0 0 12 12" fill="none">
          <Path d="M6 4v3M6 8.5v.5" stroke="#F59E0B" strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      </View>
      <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: c.text, lineHeight: 21, flex: 1 }}>{text}</Text>
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
  const exampleAmount = 100000;
  const example = calculateReturns(exampleAmount, bill.yieldPct, bill.duration);

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

          {/* Earnings example card */}
          <View style={{ backgroundColor: TEAL, borderRadius: 16, padding: 18, marginBottom: 16 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 12 }}>
              How Returns Work
            </Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 14, lineHeight: 19 }}>
              If you invest MWK {exampleAmount.toLocaleString()}, here's what you get back:
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 14 }}>
                <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>You Invest</Text>
                <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: WHITE }}>
                  MWK {exampleAmount.toLocaleString()}
                </Text>
              </View>
              <View style={{ flex: 1, backgroundColor: "rgba(69,179,105,0.2)", borderRadius: 12, padding: 14 }}>
                <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>You Receive</Text>
                <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: GREEN }}>
                  MWK {example.maturityValue.toLocaleString()}
                </Text>
              </View>
            </View>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 10 }}>
              Estimated earnings: MWK {example.earnings.toLocaleString()} after {bill.duration} days
            </Text>
          </View>

          {/* Benefits */}
          <View style={{ backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 18, marginBottom: 16 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text, marginBottom: 14 }}>Benefits</Text>
            <BenefitRow text="100% backed by the Government of Malawi" />
            <BenefitRow text="Low risk with predictable, fixed returns" />
            <BenefitRow text="Capital preservation guaranteed at maturity" />
            <BenefitRow text="Short investment periods (91–364 days)" />
          </View>

          {/* Risks */}
          <View style={{ backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 18, marginBottom: 16 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text, marginBottom: 14 }}>Risks to Understand</Text>
            <RiskRow text="Funds remain invested until maturity. Early redemption may not be available." />
            <RiskRow text="Returns are fixed at the auction rate and cannot increase after purchase." />
            <RiskRow text="Inflation may reduce the real purchasing power of your returns." />
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

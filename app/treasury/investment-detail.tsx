import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { guardedBack, guardedPush } from "@/utils/navigation";
import { useColors } from "@/hooks/useColors";
import { MOCK_INVESTMENTS, TBILL_OPTIONS } from "./data";

const TEAL = "#164951";
const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";
const AMBER = "#F59E0B";

const TIMELINE_STAGES = [
  { key: "submitted", label: "Submitted" },
  { key: "pending_auction", label: "Pending Auction" },
  { key: "allocated", label: "Allocated" },
  { key: "issued", label: "Issued" },
  { key: "active", label: "Active" },
  { key: "matured", label: "Matured" },
  { key: "paid_out", label: "Paid Out" },
] as const;

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
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12 }}>
      <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: MUTED }}>{label}</Text>
      <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: valueColor ?? c.text }}>{value}</Text>
    </View>
  );
}

export default function InvestmentDetail() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 44;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 16);
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();

  const investment = MOCK_INVESTMENTS.find((i) => i.id === id) ?? MOCK_INVESTMENTS[0];
  const bill = TBILL_OPTIONS.find((b) => b.id === investment.billId) ?? TBILL_OPTIONS[0];

  const stageIndex = TIMELINE_STAGES.findIndex((s) => s.key === investment.stage);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <View style={{ backgroundColor: c.background, paddingTop: topPad + 8, paddingBottom: 24, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
          <TouchableOpacity onPress={() => guardedBack("/trade/history")} activeOpacity={0.7} style={{ width: 40, height: 40, justifyContent: "center" }}>
            <BackIcon color={c.text} />
          </TouchableOpacity>
          <Text style={{ flex: 1, textAlign: "center", fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text }}>
            Investment Detail
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Amount hero */}
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED, marginBottom: 6 }}>Amount Invested</Text>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 40, color: c.text, letterSpacing: -0.5 }}>
            MWK {investment.amountInvested.toLocaleString()}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
            <View style={{ backgroundColor: investment.status === "active" ? "rgba(69, 179, 105, 0.15)" : c.card, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: investment.status === "active" ? 0 : 1, borderColor: c.border }}>
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 12, color: investment.status === "active" ? GREEN : c.text }}>
                {investment.status === "active" ? "● Active" : "○ Pending"}
              </Text>
            </View>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED }}>
              {investment.duration}-Day T-Bill
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

          {/* Investment info card */}
          <View style={{ backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, paddingHorizontal: 18, marginBottom: 16 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text, paddingTop: 14, paddingBottom: 10 }}>Investment Information</Text>
            <InfoRow label="Reference" value={investment.referenceNumber} valueColor={TEAL} />
            <InfoRow label="Amount Invested" value={`MWK ${investment.amountInvested.toLocaleString()}`} />
            <InfoRow label="Annual Yield" value={`${bill.yieldPct}%`} valueColor={GREEN} />
            <InfoRow label="Est. Earnings" value={`+MWK ${investment.estimatedEarnings.toLocaleString()}`} valueColor={GREEN} />
            <InfoRow label="Est. Maturity Value" value={`MWK ${investment.estimatedMaturityValue.toLocaleString()}`} />
            <InfoRow label="Investment Date" value={investment.investmentDate} />
            <InfoRow label="Maturity Date" value={investment.maturityDate} />
            <InfoRow label="Broker" value="Reserve Bank of Malawi" />
          </View>

          {/* Timeline */}
          <View style={{ backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 18, marginBottom: 16 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text, marginBottom: 18 }}>Investment Timeline</Text>
            {TIMELINE_STAGES.map((stage, i) => {
              const isCompleted = i < stageIndex;
              const isCurrent = i === stageIndex;
              const isLast = i === TIMELINE_STAGES.length - 1;
              return (
                <View key={stage.key} style={{ flexDirection: "row", gap: 14 }}>
                  {/* Dot + line */}
                  <View style={{ alignItems: "center" }}>
                    <View style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: isCompleted ? GREEN : isCurrent ? TEAL : c.border,
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      {isCompleted ? (
                        <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                          <Path d="M2.5 6l2.5 2.5 4.5-4.5" stroke={WHITE} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                      ) : isCurrent ? (
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: WHITE }} />
                      ) : null}
                    </View>
                    {!isLast && (
                      <View style={{ width: 2, flex: 1, minHeight: 24, backgroundColor: isCompleted ? GREEN : c.border, marginVertical: 2 }} />
                    )}
                  </View>
                  {/* Label */}
                  <View style={{ paddingBottom: isLast ? 0 : 16, paddingTop: 1 }}>
                    <Text style={{
                      fontFamily: isCurrent ? "PlusJakartaSans_700Bold" : "PlusJakartaSans_400Regular",
                      fontSize: 14,
                      color: isCompleted ? GREEN : isCurrent ? c.text : MUTED,
                      lineHeight: 22,
                    }}>
                      {stage.label}
                      {isCurrent && <Text style={{ color: TEAL, fontFamily: "PlusJakartaSans_600SemiBold" }}> · Current</Text>}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

        </View>
      </ScrollView>

      {/* Reinvest CTA */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: Math.max(bottomPad, 24), backgroundColor: c.background, borderTopWidth: 1, borderTopColor: c.border }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => guardedPush(() => router.push({
            pathname: "/treasury/calculator" as any,
            params: { id: investment.billId, amount: String(investment.amountInvested) },
          }))}
          style={{ height: 56, backgroundColor: TEAL, borderRadius: 14, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: WHITE }}>Reinvest</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

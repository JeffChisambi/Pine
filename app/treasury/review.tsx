import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { guardedBack, guardedPush } from "@/utils/navigation";
import { useColors } from "@/hooks/useColors";
import { calculateReturns, EMPTY_TBILL } from "@/data/treasury";
import { useTreasuryProduct } from "@/hooks/useTreasury";

const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19l-7-7 7-7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function fmt(n: number): string {
  const [w, d] = n.toFixed(2).split(".");
  return `${Number(w).toLocaleString()}.${d}`;
}

function InfoRow({
  label,
  value,
  valueColor,
  bold,
}: {
  label: string;
  value: string;
  valueColor?: string;
  bold?: boolean;
}) {
  const c = useColors();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 13,
      }}
    >
      <Text
        style={{
          fontFamily: bold ? "PlusJakartaSans_600SemiBold" : "PlusJakartaSans_400Regular",
          fontSize: 14,
          color: bold ? c.text : MUTED,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: bold ? "PlusJakartaSans_700Bold" : "PlusJakartaSans_600SemiBold",
          fontSize: bold ? 16 : 14,
          color: valueColor ?? c.text,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export default function TreasuryReview() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 16;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 16);
  const c = useColors();
  const { id, amount } = useLocalSearchParams<{ id: string; amount: string }>();

  const { data: billData } = useTreasuryProduct(id);
  const bill = billData ?? EMPTY_TBILL;
  const numericAmount = Number(amount) || 0;
  const { interest, withholdingTax, maturityValue } = calculateReturns(
    numericAmount,
    bill.yieldPct,
    bill.duration,
  );

  const settleDate =
    bill.issueDate ||
    (() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
    })();

  const maturityDateStr =
    bill.maturityDate ||
    (() => {
      const d = new Date();
      d.setDate(d.getDate() + bill.duration);
      return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
    })();

  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <View style={{ paddingTop: topPad, paddingBottom: 16, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => guardedBack("/treasury/details")}
            activeOpacity={0.7}
            style={{ width: 40, height: 40, justifyContent: "center" }}
          >
            <BackIcon color={c.text} />
          </TouchableOpacity>
          <Text
            style={{
              flex: 1,
              textAlign: "center",
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 18,
              color: c.text,
            }}
          >
            Review Bid
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad + 80 }}
        style={{ flex: 1 }}
      >
        <View style={{ paddingHorizontal: 20 }}>
          {/* Amount hero */}
          <View style={{ alignItems: "center", marginBottom: 28 }}>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_400Regular",
                fontSize: 13,
                color: MUTED,
                marginBottom: 6,
              }}
            >
              Bid Amount
            </Text>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                fontSize: 36,
                color: c.text,
                letterSpacing: -0.5,
              }}
            >
              K{fmt(numericAmount)}
            </Text>
          </View>

          {/* Bid details card */}
          <View
            style={{
              backgroundColor: c.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: c.border,
              paddingHorizontal: 18,
              marginBottom: 16,
            }}
          >
            <InfoRow label="Treasury Bill" value={`${bill.duration}-day bill`} />
            <View style={{ height: 1, backgroundColor: c.border }} />
            <InfoRow label="Annual Yield" value={`${bill.yieldPct}%`} valueColor={GREEN} />
            <View style={{ height: 1, backgroundColor: c.border }} />
            <InfoRow label="Settlement Date" value={settleDate} />
            <View style={{ height: 1, backgroundColor: c.border }} />
            <InfoRow label="Maturity Date" value={maturityDateStr} />
            <View style={{ height: 1, backgroundColor: c.border }} />
            <InfoRow label="Funding Source" value="Pine Wallet" />
          </View>

          {/* Returns card */}
          <View
            style={{
              backgroundColor: c.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: c.border,
              paddingHorizontal: 18,
              marginBottom: 16,
            }}
          >
            <InfoRow label="Bid Amount" value={`K${fmt(numericAmount)}`} />
            <View style={{ height: 1, backgroundColor: c.border }} />
            <InfoRow
              label={`Interest (${bill.duration} days)`}
              value={`K${fmt(interest)}`}
            />
            <View style={{ height: 1, backgroundColor: c.border }} />
            <InfoRow label="Withholding tax (15%)" value={`-K${fmt(withholdingTax)}`} />
            <View style={{ height: 1, backgroundColor: c.border }} />
            <InfoRow
              label="Value at maturity"
              value={`K${fmt(maturityValue)}`}
              valueColor={GREEN}
              bold
            />
          </View>

          {/* Terms */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setTermsAccepted((v) => !v)}
            style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 8 }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: termsAccepted ? c.primary : c.border,
                backgroundColor: termsAccepted ? c.primary : "transparent",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 1,
              }}
            >
              {termsAccepted && (
                <Svg width={13} height={13} viewBox="0 0 13 13" fill="none">
                  <Path
                    d="M2.5 6.5l3 3 5-5"
                    stroke={WHITE}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              )}
            </View>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_400Regular",
                fontSize: 13,
                color: MUTED,
                lineHeight: 19,
                flex: 1,
              }}
            >
              I confirm this bid and understand the funds will be held until auction settlement. I
              agree to the{" "}
              <Text style={{ color: c.primary, fontFamily: "PlusJakartaSans_600SemiBold" }}>
                Terms & Conditions
              </Text>
              .
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* CTA */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: Math.max(bottomPad, 24),
          backgroundColor: c.background,
          borderTopWidth: 1,
          borderTopColor: c.border,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={!termsAccepted}
          onPress={() =>
            guardedPush(() =>
              router.push({
                pathname: "/treasury/processing" as any,
                params: { id: bill.id, amount: String(numericAmount) },
              }),
            )
          }
          style={{
            height: 56,
            backgroundColor: c.primary,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            opacity: termsAccepted ? 1 : 0.45,
          }}
        >
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: WHITE }}>
            Confirm Bid
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

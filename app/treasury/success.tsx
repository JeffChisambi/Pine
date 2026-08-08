import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { guardedPush } from "@/utils/navigation";
import { useColors } from "@/hooks/useColors";
import { calculateReturns, EMPTY_TBILL } from "@/data/treasury";
import { useTreasuryProduct } from "@/hooks/useTreasury";

const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";

function fmt(n: number): string {
  const [w, d] = n.toFixed(2).split(".");
  return `${Number(w).toLocaleString()}.${d}`;
}

function SuccessIcon() {
  const c = useColors();
  return (
    <View
      style={{
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: c.primary + "15",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={48} height={48} viewBox="0 0 48 48" fill="none">
        <Circle cx={24} cy={24} r={24} fill={c.primary} />
        <Path
          d="M14 24l8 8 12-13"
          stroke={WHITE}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
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
        paddingVertical: 12,
      }}
    >
      <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: MUTED }}>
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

export default function TreasurySuccess() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 16;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 16);
  const c = useColors();
  const { id, amount, ref } = useLocalSearchParams<{
    id: string;
    amount: string;
    ref: string;
  }>();

  const { data: billData } = useTreasuryProduct(id);
  const bill = billData ?? EMPTY_TBILL;
  const numericAmount = Number(amount) || 0;
  const { maturityValue } = calculateReturns(numericAmount, bill.yieldPct, bill.duration);

  const settleDate = (() => {
    const d = new Date(bill.issueDate || bill.auctionDate);
    if (isNaN(d.getTime())) return bill.issueDate || "";
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  })();

  const shortSettleDate = (() => {
    const d = new Date(bill.issueDate || bill.auctionDate);
    if (isNaN(d.getTime())) return settleDate;
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  })();

  const refNumber =
    ref ||
    `TB-${String(Math.floor(Math.random() * 9000) + 1000)}-${String(
      Math.floor(Math.random() * 9000) + 1000,
    )}`;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPad + 40,
          paddingHorizontal: 20,
          paddingBottom: bottomPad + 150,
        }}
      >
        {/* Success illustration */}
        <View style={{ alignItems: "center", marginBottom: 28 }}>
          <SuccessIcon />
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 24,
              color: c.text,
              marginTop: 24,
              marginBottom: 8,
            }}
          >
            Bid Submitted
          </Text>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_400Regular",
              fontSize: 14,
              color: MUTED,
              textAlign: "center",
              lineHeight: 21,
            }}
          >
            K{fmt(numericAmount)} is held until the auction settles on {shortSettleDate}.
          </Text>
        </View>

        {/* Details card */}
        <View
          style={{
            backgroundColor: c.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: c.border,
            paddingHorizontal: 18,
            marginBottom: 20,
          }}
        >
          <InfoRow label="Tenor" value={`${bill.duration} days`} />
          <View style={{ height: 1, backgroundColor: c.border }} />
          <InfoRow label="Yield" value={`${bill.yieldPct}%`} />
          <View style={{ height: 1, backgroundColor: c.border }} />
          <InfoRow label="Settles" value={settleDate} />
          <View style={{ height: 1, backgroundColor: c.border }} />
          <InfoRow label="Reference" value={refNumber} valueColor={c.primary} />
          <View style={{ height: 1, backgroundColor: c.border }} />
          <InfoRow
            label="Value at maturity"
            value={`K${fmt(maturityValue)}`}
            valueColor={GREEN}
            bold
          />
        </View>

        {/* Disclaimer */}
        <Text
          style={{
            fontFamily: "PlusJakartaSans_400Regular",
            fontSize: 13,
            color: MUTED,
            textAlign: "center",
            lineHeight: 19,
            fontStyle: "italic",
            paddingHorizontal: 10,
          }}
        >
          If your bid is not allotted in full, the balance returns to your wallet.
        </Text>
      </ScrollView>

      {/* Buttons */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: Math.max(bottomPad, 24),
          backgroundColor: c.background,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
            guardedPush(() => router.replace("/treasury/my-investments" as any))
          }
          style={{
            height: 56,
            backgroundColor: c.primary,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
          }}
        >
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: WHITE }}>
            View My Bills
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.replace("/(tabs)" as any)}
          style={{
            height: 56,
            backgroundColor: c.card,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: c.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: c.text }}>
            Back to Home
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

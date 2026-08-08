import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { guardedBack, guardedPush } from "@/utils/navigation";
import { useColors } from "@/hooks/useColors";
import { calculateReturns, EMPTY_TBILL } from "@/data/treasury";
import { useTreasuryProduct } from "@/hooks/useTreasury";
import { useWalletBalance } from "@/services/wallet-queries";

const TEAL = "#164951";
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

const QUICK_AMOUNTS = [
  { label: "K100,000", value: 100000 },
  { label: "K250,000", value: 250000 },
  { label: "K500,000", value: 500000 },
];

export default function TreasuryBidAmount() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 16;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 16);
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: billData } = useTreasuryProduct(id);
  const bill = billData ?? EMPTY_TBILL;

  const { data: walletData } = useWalletBalance();
  const walletBalance = Number(walletData?.availableBalance ?? walletData?.balance ?? 0);

  const [rawAmount, setRawAmount] = useState("");
  const [autoRollover, setAutoRollover] = useState(false);

  const numericAmount = parseFloat(rawAmount.replace(/,/g, "")) || 0;
  const isValid = numericAmount >= bill.minInvestment;

  const { interest, withholdingTax, maturityValue } = isValid
    ? calculateReturns(numericAmount, bill.yieldPct, bill.duration)
    : { interest: 0, withholdingTax: 0, maturityValue: 0 };

  const maturityDateStr = (() => {
    if (bill.maturityDate) return bill.maturityDate;
    const d = new Date();
    d.setDate(d.getDate() + bill.duration);
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  })();

  const handleAmountChange = (val: string) => {
    const stripped = val.replace(/[^0-9]/g, "");
    setRawAmount(stripped ? Number(stripped).toLocaleString() : "");
  };

  const handleQuick = (value: number) => {
    setRawAmount(value.toLocaleString());
    Keyboard.dismiss();
  };

  const handleMax = () => {
    const maxAmount = bill.maxInvestment
      ? Math.min(walletBalance, bill.maxInvestment)
      : walletBalance;
    if (maxAmount > 0) {
      setRawAmount(Math.floor(maxAmount).toLocaleString());
      Keyboard.dismiss();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: c.background }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Fixed header — just the back row + title */}
        <View style={{ paddingTop: topPad, paddingHorizontal: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => guardedBack("/treasury")}
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
              {bill.duration}-day Bill
            </Text>
            <View style={{ width: 40 }} />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomPad + 80 }}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Yield + Maturity stats — moved inside the scroll area so nothing
              is cut off on shorter screens or when the keyboard is open. */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 24, paddingHorizontal: 16 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: c.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: c.border,
                padding: 14,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_400Regular",
                  fontSize: 11,
                  color: MUTED,
                  marginBottom: 4,
                }}
              >
                YIELD
              </Text>
              <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 20, color: c.text }}>
                {bill.yieldPct}%
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: c.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: c.border,
                padding: 14,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_400Regular",
                  fontSize: 11,
                  color: MUTED,
                  marginBottom: 4,
                }}
              >
                MATURES
              </Text>
              <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: c.text }}>
                {maturityDateStr}
              </Text>
            </View>
          </View>

          <View style={{ paddingHorizontal: 20 }}>
            {/* BID AMOUNT label */}
            <Text
              style={{
                fontFamily: "PlusJakartaSans_600SemiBold",
                fontSize: 13,
                color: MUTED,
                letterSpacing: 0.5,
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              BID AMOUNT
            </Text>

            {/* Amount input */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                justifyContent: "center",
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_600SemiBold",
                  fontSize: 22,
                  color: c.text,
                  marginRight: 8,
                }}
              >
                K
              </Text>
              <TextInput
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  fontSize: 40,
                  color: c.text,
                  minWidth: 120,
                  textAlign: "center",
                  padding: 0,
                }}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={MUTED}
                value={rawAmount}
                onChangeText={handleAmountChange}
                returnKeyType="done"
              />
            </View>

            {/* Min / Wallet row */}
            <View
              style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20 }}
            >
              <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}>
                Minimum K{bill.minInvestment.toLocaleString()}
              </Text>
              <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}>
                Wallet: K{fmt(walletBalance)}
              </Text>
            </View>

            {/* Quick amounts */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
              {QUICK_AMOUNTS.map((q) => {
                const isActive = numericAmount === q.value;
                return (
                  <TouchableOpacity
                    key={q.label}
                    onPress={() => handleQuick(q.value)}
                    activeOpacity={0.75}
                    style={{
                      flex: 1,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: isActive ? TEAL : c.card,
                      borderWidth: 1,
                      borderColor: isActive ? TEAL : c.border,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "PlusJakartaSans_600SemiBold",
                        fontSize: 12,
                        color: isActive ? WHITE : c.text,
                      }}
                    >
                      {q.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                onPress={handleMax}
                activeOpacity={0.75}
                style={{
                  paddingHorizontal: 20,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: c.card,
                  borderWidth: 1,
                  borderColor: c.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 12, color: c.text }}
                >
                  Max
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 1, backgroundColor: c.border, marginBottom: 20 }} />

            {/* Summary */}
            <View style={{ marginBottom: 24 }}>
              {[
                { label: "You invest", value: isValid ? `K${fmt(numericAmount)}` : "---" },
                {
                  label: `Interest (${bill.duration} days)`,
                  value: isValid ? `K${fmt(interest)}` : "---",
                },
                {
                  label: "Withholding tax (15%)",
                  value: isValid ? `-K${fmt(withholdingTax)}` : "---",
                },
              ].map((row) => (
                <View
                  key={row.label}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 10,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_400Regular",
                      fontSize: 14,
                      color: MUTED,
                    }}
                  >
                    {row.label}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_500Medium",
                      fontSize: 14,
                      color: c.text,
                    }}
                  >
                    {row.value}
                  </Text>
                </View>
              ))}

              <View style={{ height: 1, backgroundColor: c.border, marginVertical: 8 }} />

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 10,
                }}
              >
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_600SemiBold",
                    fontSize: 15,
                    color: c.text,
                  }}
                >
                  Value at maturity
                </Text>
                <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 17, color: GREEN }}>
                  {isValid ? `K${fmt(maturityValue)}` : "---"}
                </Text>
              </View>
            </View>

            {/* Auto rollover */}
            <View
              style={{
                backgroundColor: c.card,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: c.border,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_600SemiBold",
                    fontSize: 14,
                    color: c.text,
                    marginBottom: 4,
                  }}
                >
                  Auto roll over at maturity
                </Text>
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_400Regular",
                    fontSize: 12,
                    color: MUTED,
                    lineHeight: 17,
                  }}
                >
                  Reinvest principal into the next {bill.duration}-day auction
                </Text>
              </View>
              <Switch
                value={autoRollover}
                onValueChange={setAutoRollover}
                trackColor={{ false: c.border, true: GREEN }}
                thumbColor={WHITE}
              />
            </View>
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
            disabled={!isValid}
            onPress={() =>
              guardedPush(() =>
                router.push({
                  pathname: "/treasury/review" as any,
                  params: {
                    id: bill.id,
                    amount: String(numericAmount),
                    autoRollover: autoRollover ? "1" : "0",
                  },
                }),
              )
            }
            style={{
              height: 56,
              backgroundColor: TEAL,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              opacity: isValid ? 1 : 0.45,
            }}
          >
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: WHITE }}>
              Review Bid
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

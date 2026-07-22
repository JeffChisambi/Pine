import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Path, Rect } from "react-native-svg";
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

const QUICK_AMOUNTS = [
  { label: "100K", value: 100000 },
  { label: "500K", value: 500000 },
  { label: "1M", value: 1000000 },
  { label: "5M", value: 5000000 },
];

export default function TreasuryCalculator() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 44;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 16);
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();

  const bill = TBILL_OPTIONS.find((b) => b.id === id) ?? TBILL_OPTIONS[0];

  const [rawAmount, setRawAmount] = useState("");

  const numericAmount = parseFloat(rawAmount.replace(/,/g, "")) || 0;
  const isValid = numericAmount >= bill.minInvestment;

  const { earnings, maturityValue } = isValid
    ? calculateReturns(numericAmount, bill.yieldPct, bill.duration)
    : { earnings: 0, maturityValue: 0 };

  // Compute maturity date from today + duration
  const maturityDateStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + bill.duration);
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  })();

  const formatAmount = (val: string) => {
    const nums = val.replace(/[^0-9]/g, "");
    if (!nums) return "";
    return Number(nums).toLocaleString();
  };

  const handleAmountChange = (val: string) => {
    const stripped = val.replace(/[^0-9]/g, "");
    setRawAmount(stripped ? Number(stripped).toLocaleString() : "");
  };

  const handleQuick = (value: number) => {
    setRawAmount(value.toLocaleString());
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1, backgroundColor: c.background }}>
        {/* Header */}
        <View style={{ backgroundColor: c.background, paddingTop: topPad + 8, paddingBottom: 0, paddingHorizontal: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
            <TouchableOpacity onPress={() => guardedBack("/treasury/details")} activeOpacity={0.7} style={{ width: 40, height: 40, justifyContent: "center" }}>
              <BackIcon color={c.text} />
            </TouchableOpacity>
            <Text style={{ flex: 1, textAlign: "center", fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text }}>
              Investment Calculator
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Amount input */}
          <View style={{ alignItems: "center", paddingBottom: 28 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED, marginBottom: 10, letterSpacing: 0.4 }}>
              ENTER AMOUNT
            </Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 22, color: c.text }}>MWK</Text>
              <TextInput
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  fontSize: 44,
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
            <View style={{ width: 220, height: 1.5, backgroundColor: c.border, marginTop: 10, marginBottom: 8 }} />
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}>
              Minimum: MWK {bill.minInvestment.toLocaleString()}
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomPad + 80 }}
          style={{ flex: 1, backgroundColor: c.background }}
        >
          <View style={{ paddingTop: 0, paddingHorizontal: 20 }}>

            {/* Quick amounts */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
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
                    <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: isActive ? WHITE : c.text }}>{q.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Results card */}
            <View style={{ backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 18, marginBottom: 16 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text, marginBottom: 14 }}>
                Investment Summary
              </Text>

              {[
                { label: "T-Bill Duration", value: `${bill.duration} Days` },
                { label: "Annual Yield", value: `${bill.yieldPct}%`, color: GREEN },
                { label: "Investment Amount", value: isValid ? `MWK ${numericAmount.toLocaleString()}` : "—" },
              ].map((row, i, arr) => (
                <View key={row.label}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 12 }}>
                    <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: MUTED }}>{row.label}</Text>
                    <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: row.color ?? c.text }}>{row.value}</Text>
                  </View>
                </View>
              ))}

              <View style={{ height: 1, backgroundColor: c.border, marginTop: 4, marginBottom: 14 }} />

              {/* Estimated returns */}
              <View style={{ backgroundColor: isValid ? (GREEN + "15") : c.background, borderRadius: 12, padding: 14 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED }}>Estimated Earnings</Text>
                  <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: isValid ? GREEN : MUTED }}>
                    {isValid ? `+MWK ${earnings.toLocaleString()}` : "—"}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED }}>Maturity Value</Text>
                  <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: isValid ? c.text : MUTED }}>
                    {isValid ? `MWK ${maturityValue.toLocaleString()}` : "—"}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED }}>Est. Maturity Date</Text>
                  <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: c.text }}>{maturityDateStr}</Text>
                </View>
              </View>
            </View>

            {/* Info note */}
            {!isValid && numericAmount > 0 && (
              <View style={{ backgroundColor: "#FEF3C7", borderRadius: 10, padding: 12, marginBottom: 12 }}>
                <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: "#92400E", lineHeight: 19 }}>
                  Minimum investment is MWK {bill.minInvestment.toLocaleString()}. Please enter a higher amount.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* CTA */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: Math.max(bottomPad, 24), backgroundColor: c.background, borderTopWidth: 1, borderTopColor: c.border }}>
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={!isValid}
            onPress={() => guardedPush(() =>
              router.push({
                pathname: "/treasury/review" as any,
                params: { id: bill.id, amount: String(numericAmount) },
              })
            )}
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
              {isValid ? `Invest MWK ${numericAmount.toLocaleString()}` : "Enter Amount to Continue"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

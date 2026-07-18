import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path, Circle, Rect, G } from "react-native-svg";

const TEAL = "#164951";
const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const DARK = "#111827";
const MUTED = "#9CA3AF";
const DIVIDER = "#EBECEF";
const CARD_BG = "#F9FAFB";
const CARD_BORDER = "#F3F4F6";

function BackIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={DARK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PayPalIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
      <Rect width={28} height={28} rx={6} fill="#003087" />
      <Path d="M10 8h5.5c2.5 0 4 1.2 3.5 3.5-.5 2.5-2.5 3.5-5 3.5H12L10.5 20H8L10 8z" fill="#009cde" />
      <Path d="M11.5 9.5h4.5c2 0 3.5 1 3 3-.5 2-2 3-4.5 3H13L11.5 9.5z" fill={WHITE} />
    </Svg>
  );
}

function RadioIcon({ selected }: { selected: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Circle cx={11} cy={11} r={10} stroke={selected ? TEAL : "#D1D5DB"} strokeWidth={1.5} />
      {selected && <Circle cx={11} cy={11} r={6} fill={TEAL} />}
    </Svg>
  );
}

function TagIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Path d="M9.5 2L16 8.5l-6 6L3.5 8V2H9.5z" stroke={TEAL} strokeWidth={1.4} strokeLinejoin="round" />
      <Circle cx={6} cy={5.5} r={1} fill={TEAL} />
    </Svg>
  );
}

const PAYMENT_METHODS = [
  { id: "paypal", label: "PayPal", sub: "paypal@example.com" },
  { id: "card", label: "Visa •••• 4282", sub: "Expires 06/26" },
  { id: "bank", label: "Bank Transfer", sub: "Chase Bank •••• 9134" },
];

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;

  const [selectedPayment, setSelectedPayment] = useState("paypal");
  const [promoCode, setPromoCode] = useState("");
  const [savingRoutine, setSavingRoutine] = useState(true);

  const subtotal = 124.50;
  const fee = 1.99;
  const discount = savingRoutine ? -2.50 : 0;
  const total = subtotal + fee + discount;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Method</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <Text style={styles.sectionLabel}>Order Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Asset</Text>
            <Text style={styles.summaryValue}>Airbnb (ABNB)</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Order Type</Text>
            <Text style={styles.summaryValue}>Market Buy</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Quantity</Text>
            <Text style={styles.summaryValue}>1 share</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Price per share</Text>
            <Text style={styles.summaryValue}>K124.50</Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>Payment Method</Text>
        </View>
        <View style={styles.paymentCard}>
          {PAYMENT_METHODS.map((pm, i) => (
            <View key={pm.id}>
              <TouchableOpacity
                style={styles.paymentRow}
                onPress={() => setSelectedPayment(pm.id)}
                activeOpacity={0.75}
              >
                {pm.id === "paypal" ? <PayPalIcon /> : (
                  <View style={styles.paymentIconPlaceholder}>
                    <Text style={styles.paymentIconText}>{pm.id === "card" ? "💳" : "🏦"}</Text>
                  </View>
                )}
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentLabel}>{pm.label}</Text>
                  <Text style={styles.paymentSub}>{pm.sub}</Text>
                </View>
                <RadioIcon selected={selectedPayment === pm.id} />
              </TouchableOpacity>
              {i < PAYMENT_METHODS.length - 1 && <View style={styles.paymentDivider} />}
            </View>
          ))}
        </View>

        {/* Promo Code */}
        <Text style={styles.sectionLabel}>Promo Code</Text>
        <View style={styles.promoCard}>
          <View style={styles.promoLeft}>
            <TagIcon />
            <TextInput
              style={styles.promoInput}
              value={promoCode}
              onChangeText={setPromoCode}
              placeholder="Enter promo code"
              placeholderTextColor={MUTED}
              autoCapitalize="characters"
            />
          </View>
          <TouchableOpacity style={styles.applyBtn}>
            <Text style={styles.applyBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>

        {/* Saving Routine */}
        <View style={styles.savingCard}>
          <View style={styles.savingLeft}>
            <Text style={styles.savingTitle}>Saving Routine</Text>
            <Text style={styles.savingDesc}>Get K2.50 off by enabling auto-save</Text>
          </View>
          <Switch
            value={savingRoutine}
            onValueChange={setSavingRoutine}
            trackColor={{ false: "#E5E7EB", true: "#D1FADF" }}
            thumbColor={savingRoutine ? GREEN : "#9CA3AF"}
            ios_backgroundColor="#E5E7EB"
          />
        </View>

        {/* Total */}
        <View style={styles.totalCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRowBorder} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Processing Fee</Text>
            <Text style={styles.totalValue}>${fee.toFixed(2)}</Text>
          </View>
          {savingRoutine && (
            <>
              <View style={styles.totalRowBorder} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Saving Routine Discount</Text>
                <Text style={[styles.totalValue, { color: GREEN }]}>${discount.toFixed(2)}</Text>
              </View>
            </>
          )}
          <View style={[styles.totalRowBorder, { backgroundColor: "#D1D5DB" }]} />
          <View style={styles.totalRow}>
            <Text style={styles.totalFinalLabel}>Total</Text>
            <Text style={styles.totalFinalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push("/trade/confirm" as any)}>
          <Text style={styles.ctaBtnText}>Continue to Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WHITE },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    flex: 1,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 17,
    color: DARK,
    textAlign: "center",
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },
  sectionLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    color: DARK,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  summaryDivider: { height: 1, backgroundColor: DIVIDER },
  summaryLabel: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED },
  summaryValue: { fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: DARK },
  paymentCard: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    marginBottom: 20,
    overflow: "hidden",
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  paymentIconPlaceholder: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentIconText: { fontSize: 18 },
  paymentInfo: { flex: 1 },
  paymentLabel: { fontFamily: "PlusJakartaSans_500Medium", fontSize: 14, color: DARK, marginBottom: 2 },
  paymentSub: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED },
  paymentDivider: { height: 1, backgroundColor: CARD_BORDER, marginHorizontal: 16 },
  promoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 16,
  },
  promoLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  promoInput: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    color: DARK,
    paddingVertical: 12,
    padding: 0,
  },
  applyBtn: {
    backgroundColor: TEAL,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  applyBtnText: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: WHITE },
  savingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  savingLeft: { flex: 1 },
  savingTitle: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: DARK, marginBottom: 2 },
  savingDesc: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED },
  totalCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  totalRowBorder: { height: 1, backgroundColor: DIVIDER },
  totalLabel: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED },
  totalValue: { fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: DARK },
  totalFinalLabel: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: DARK },
  totalFinalValue: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: TEAL },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: DIVIDER,
    backgroundColor: WHITE,
  },
  ctaBtn: {
    backgroundColor: TEAL,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaBtnText: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: WHITE },
});

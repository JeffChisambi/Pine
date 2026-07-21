import { guardedBack } from "@/utils/navigation";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

const TEAL = "#164951";
const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";

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

const PAYMENT_METHODS = [
  { id: "paypal", label: "PayPal", sub: "paypal@example.com" },
  { id: "card", label: "Visa •••• 4282", sub: "Expires 06/26" },
  { id: "bank", label: "Bank Transfer", sub: "Chase Bank •••• 9134" },
];

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;
  const c = useColors();
  const [selectedPayment, setSelectedPayment] = useState("paypal");
  const [promoCode, setPromoCode] = useState("");
  const [savingRoutine, setSavingRoutine] = useState(true);

  const subtotal = 124.50;
  const fee = 1.99;
  const discount = savingRoutine ? -2.50 : 0;
  const total = subtotal + fee + discount;

  return (
    <View style={{ flex: 1, backgroundColor: c.background, paddingTop: topPad }}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => guardedBack("/(tabs)")} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M15 19l-7-7 7-7" stroke={c.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={{ flex: 1, fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: c.text, textAlign: "center" }}>Payment Method</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text, marginBottom: 10, marginTop: 4 }}>Order Summary</Text>
        <View style={{ backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, paddingHorizontal: 16, paddingVertical: 4, marginBottom: 20 }}>
          {[{ label: "Asset", value: "Airbnb (ABNB)" }, { label: "Order Type", value: "Market Buy" }, { label: "Quantity", value: "1 share" }, { label: "Price per share", value: "K124.50" }].map((row, i, arr) => (
            <React.Fragment key={row.label}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 12 }}>
                <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED }}>{row.label}</Text>
                <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: c.text }}>{row.value}</Text>
              </View>
              {i < arr.length - 1 && <View style={{ height: 1, backgroundColor: c.border }} />}
            </React.Fragment>
          ))}
        </View>

        {/* Payment Methods */}
        <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text, marginBottom: 10, marginTop: 8 }}>Payment Method</Text>
        <View style={{ backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, marginBottom: 20, overflow: "hidden" }}>
          {PAYMENT_METHODS.map((pm, i) => (
            <View key={pm.id}>
              <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 }} onPress={() => setSelectedPayment(pm.id)} activeOpacity={0.75}>
                {pm.id === "paypal" ? <PayPalIcon /> : (
                  <View style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 18 }}>{pm.id === "card" ? "💳" : "🏦"}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 14, color: c.text, marginBottom: 2 }}>{pm.label}</Text>
                  <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}>{pm.sub}</Text>
                </View>
                <RadioIcon selected={selectedPayment === pm.id} />
              </TouchableOpacity>
              {i < PAYMENT_METHODS.length - 1 && <View style={{ height: 1, backgroundColor: c.border, marginHorizontal: 16 }} />}
            </View>
          ))}
        </View>

        {/* Promo Code */}
        <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text, marginBottom: 10 }}>Promo Code</Text>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 16 }}>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
              <Path d="M9.5 2L16 8.5l-6 6L3.5 8V2H9.5z" stroke={TEAL} strokeWidth={1.4} strokeLinejoin="round" />
              <Circle cx={6} cy={5.5} r={1} fill={TEAL} />
            </Svg>
            <TextInput style={{ flex: 1, fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: c.text, paddingVertical: 12, padding: 0 }} value={promoCode} onChangeText={setPromoCode} placeholder="Enter promo code" placeholderTextColor={MUTED} autoCapitalize="characters" />
          </View>
          <TouchableOpacity style={{ backgroundColor: TEAL, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: WHITE }}>Apply</Text>
          </TouchableOpacity>
        </View>

        {/* Saving Routine */}
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F0FDF4", borderRadius: 14, borderWidth: 1, borderColor: "#BBF7D0", paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: "#166534", marginBottom: 2 }}>Saving Routine</Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}>Get K2.50 off by enabling auto-save</Text>
          </View>
          <Switch value={savingRoutine} onValueChange={setSavingRoutine} trackColor={{ false: "#E5E7EB", true: "#D1FADF" }} thumbColor={savingRoutine ? GREEN : "#9CA3AF"} ios_backgroundColor="#E5E7EB" />
        </View>

        {/* Total */}
        <View style={{ backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, paddingHorizontal: 16, paddingVertical: 4, marginBottom: 8 }}>
          {[{ label: "Subtotal", value: `$${subtotal.toFixed(2)}`, color: c.text }, { label: "Processing Fee", value: `$${fee.toFixed(2)}`, color: c.text }, ...(savingRoutine ? [{ label: "Saving Routine Discount", value: `$${discount.toFixed(2)}`, color: GREEN }] : [])].map((row, i, arr) => (
            <React.Fragment key={row.label}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 12 }}>
                <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED }}>{row.label}</Text>
                <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: row.color }}>{row.value}</Text>
              </View>
              {i < arr.length - 1 && <View style={{ height: 1, backgroundColor: c.border }} />}
            </React.Fragment>
          ))}
          <View style={{ height: 1, backgroundColor: c.border }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 12 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: c.text }}>Total</Text>
            <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: TEAL }}>${total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 16, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.background }}>
        <TouchableOpacity style={{ backgroundColor: TEAL, borderRadius: 14, paddingVertical: 16, alignItems: "center" }} onPress={() => router.push("/trade/confirm" as any)}>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: WHITE }}>Continue to Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { tradingApi, paymentsApi, ApiError } from "../../services/api";
import { getStockLogo } from "../../utils/stock-logos";
import { useColors } from "@/hooks/useColors";

const TEAL = "#164951";
const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";

function PayPalIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect width={24} height={24} rx={5} fill="#003087" />
      <Path d="M8 6h4.8c2.2 0 3.5 1 3 3-.4 2.2-2.2 3-4.4 3H10L8.8 18H7L8 6z" fill="#009cde" />
      <Path d="M9.5 7.5h4c1.8 0 3 .8 2.6 2.6-.4 1.8-1.8 2.6-4 2.6H10.5L9.5 7.5z" fill={WHITE} />
    </Svg>
  );
}

function CheckCircleSmall() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Circle cx={9} cy={9} r={8} fill="#D1FADF" />
      <Path d="M5.5 9l2.5 2.5 4-5" stroke={GREEN} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function ConfirmScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;
  const c = useColors();
  const [savingRoutine, setSavingRoutine] = useState(true);
  const [loading, setLoading] = useState(false);

  const params = useLocalSearchParams<{ stockId?: string; symbol?: string; name?: string; side?: string; amount?: string; price?: string }>();

  const symbol = params.symbol ?? "—";
  const stockName = params.name ?? "Stock";
  const isBuy = (params.side ?? "BUY") === "BUY";
  const pricePerShare = Number(params.price ?? 0);
  const quantity = Math.max(1, Number(params.amount ?? 0));
  const subtotal = quantity * pricePerShare;
  const fee = Math.round(subtotal * 0.015 * 100) / 100;
  const discount = savingRoutine ? -2.50 : 0;
  const total = subtotal + fee + discount;

  const handleConfirmOrder = async () => {
    if (!params.stockId) return;
    setLoading(true);
    try {
      if (isBuy) {
        const session = await paymentsApi.initiate({ amount: Math.ceil(total), currency: "MWK", purpose: "BUY_SHARES", stockSymbol: symbol, quantity });
        if (!session.checkoutUrl) throw new Error("Payment gateway did not return a checkout URL.");
        router.push({ pathname: "/trade/payment-webview" as any, params: { checkoutUrl: session.checkoutUrl, txRef: session.txRef, symbol, amount: String(Math.ceil(total)) } });
      } else {
        await tradingApi.sell({ stockId: params.stockId, quantity, orderType: "MARKET", pinToken: "skip" });
        router.push("/trade/success" as any);
      }
    } catch (err) {
      Alert.alert("Trade Error", err instanceof ApiError ? err.message : "Trade failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background, paddingTop: topPad }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M15 18l-6-6 6-6" stroke={c.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={{ flex: 1, fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: c.text, textAlign: "center" }}>Confirm Order</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Order header */}
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 16, gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.background, overflow: "hidden", borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center" }}>
            {getStockLogo(symbol) ? (
              <Image source={getStockLogo(symbol)!} style={{ width: 48, height: 48, borderRadius: 24 }} resizeMode="contain" />
            ) : (
              <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: TEAL }}>{symbol.charAt(0)}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: c.text, marginBottom: 3 }}>{stockName}</Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED }}>{symbol} · Market {isBuy ? "Buy" : "Sell"}</Text>
          </View>
        </View>

        {/* Summary card */}
        <View style={{ backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, paddingHorizontal: 16, paddingVertical: 4, marginBottom: 20 }}>
          {[{ label: "Shares", value: String(quantity) }, { label: "Price per Share", value: `K${pricePerShare.toLocaleString()}` }, { label: "Order Type", value: "Market" }].map((row, i, arr) => (
            <React.Fragment key={row.label}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 12 }}>
                <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED }}>{row.label}</Text>
                <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: c.text }}>{row.value}</Text>
              </View>
              {i < arr.length - 1 && <View style={{ height: 1, backgroundColor: c.border }} />}
            </React.Fragment>
          ))}
        </View>

        {isBuy && (
          <>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text, marginBottom: 10 }}>Payment Method</Text>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12, gap: 12 }}>
              <PayPalIcon />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 14, color: c.text, marginBottom: 2 }}>PayPal</Text>
                <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}>paypal@example.com</Text>
              </View>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: TEAL }}>Change</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, marginBottom: 12 }}>
              <CheckCircleSmall />
              <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED }}>No promo code applied</Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F0FDF4", borderRadius: 14, borderWidth: 1, borderColor: "#BBF7D0", paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: "#166534", marginBottom: 2 }}>Saving Routine</Text>
                <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}>Save K2.50 on this order</Text>
              </View>
              <Switch value={savingRoutine} onValueChange={setSavingRoutine} trackColor={{ false: "#E5E7EB", true: "#D1FADF" }} thumbColor={savingRoutine ? GREEN : "#9CA3AF"} ios_backgroundColor="#E5E7EB" />
            </View>
          </>
        )}

        {isBuy && (
          <View style={{ backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, paddingHorizontal: 16, paddingVertical: 4, marginBottom: 16 }}>
            {[{ label: "Subtotal", value: `K${subtotal.toFixed(2)}`, color: c.text }, { label: "Processing Fee", value: `K${fee.toFixed(2)}`, color: c.text }, ...(savingRoutine ? [{ label: "Saving Routine", value: `K${Math.abs(discount).toFixed(2)}`, color: GREEN }] : [])].map((row, i, arr) => (
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
              <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: TEAL }}>K{total.toFixed(2)}</Text>
            </View>
          </View>
        )}

        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED, textAlign: "center", lineHeight: 18 }}>
          By confirming, you agree to execute this order at market price. Orders are typically filled within seconds during market hours.
        </Text>
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 16, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.background }}>
        <TouchableOpacity style={{ backgroundColor: TEAL, borderRadius: 14, paddingVertical: 16, alignItems: "center", opacity: loading ? 0.6 : 1 }} onPress={handleConfirmOrder} disabled={loading}>
          {loading ? <ActivityIndicator color={WHITE} /> : <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: WHITE }}>Confirm</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

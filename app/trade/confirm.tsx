import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { tradingApi, paymentsApi, ApiError } from "../../services/api";
import { getStockLogo } from "../../utils/stock-logos";
import { useColors } from "@/hooks/useColors";

const PAYCHANGU_LOGO = require("../../assets/images/paychangu-logo.png");
const BANK_CARD_LOGO  = require("../../assets/images/bankcard.png");

const TEAL  = "#164951";
const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";

function PaychanguIcon() {
  return (
    <Image
      source={PAYCHANGU_LOGO}
      style={{ width: 36, height: 36, borderRadius: 8 }}
      resizeMode="contain"
    />
  );
}

function Row({ label, value, valueColor, bold }: {
  label: string; value: string; valueColor?: string; bold?: boolean;
}) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 13 }}>
      <Text style={{ fontFamily: bold ? "PlusJakartaSans_700Bold" : "PlusJakartaSans_400Regular", fontSize: 14, color: bold ? c.text : MUTED }}>{label}</Text>
      <Text style={{ fontFamily: bold ? "PlusJakartaSans_700Bold" : "PlusJakartaSans_600SemiBold", fontSize: 14, color: valueColor ?? c.text }}>{value}</Text>
    </View>
  );
}

function Divider() {
  const c = useColors();
  return <View style={{ height: 1, backgroundColor: c.border }} />;
}

export default function ConfirmScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;
  const c = useColors();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"paychangu" | "bankcard">("paychangu");

  const params = useLocalSearchParams<{
    stockId?: string; symbol?: string; name?: string;
    side?: string; amount?: string; price?: string;
  }>();

  const symbol    = params.symbol ?? "—";
  const stockName = params.name ?? "Stock";
  const isBuy     = (params.side ?? "BUY") === "BUY";
  const priceRaw  = Number(params.price ?? 0);
  const quantity  = Math.max(1, Number(params.amount ?? 0));
  const subtotal  = quantity * priceRaw;
  // Fee is 1% of the total charge (applied on top of subtotal)
  const fee       = Math.round(subtotal * 0.01 * 100) / 100;
  const total     = subtotal + fee;

  const fmt = (n: number) =>
    `MWK ${n.toLocaleString("en-MW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleConfirmOrder = async () => {
    if (!params.stockId) return;
    setLoading(true);
    try {
      if (isBuy) {
        const session = await paymentsApi.initiate({
          amount: Math.ceil(total),
          currency: "MWK",
          purpose: "BUY_SHARES",
          stockSymbol: symbol,
          quantity,
        });
        if (!session.checkoutUrl) throw new Error("Payment gateway did not return a checkout URL.");
        router.push({
          pathname: "/trade/payment-webview" as any,
          params: { checkoutUrl: session.checkoutUrl, txRef: session.txRef, symbol, amount: String(Math.ceil(total)) },
        });
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
        <Text style={{ flex: 1, fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: c.text, textAlign: "center" }}>Review Order</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* Stock identity card */}
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 20, gap: 12 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.background, overflow: "hidden", borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center" }}>
            {getStockLogo(symbol) ? (
              <Image source={getStockLogo(symbol)!} style={{ width: 48, height: 48, borderRadius: 24 }} resizeMode="contain" />
            ) : (
              <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: TEAL }}>{symbol.charAt(0)}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: c.text, marginBottom: 3 }}>{symbol}</Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED }}>{stockName}</Text>
          </View>

        </View>

        {/* Single order summary card */}
        <View style={{ backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, paddingHorizontal: 16, paddingVertical: 4, marginBottom: 20 }}>
          <Row label="Quantity" value={`${quantity} share${quantity !== 1 ? "s" : ""}`} />
          <Divider />
          <Row label="Price per Share" value={fmt(priceRaw)} />
          <Divider />
          <Row label="Processing Fee (1%)" value={fmt(fee)} />
          <Divider />
          <Row label="Total" value={fmt(total)} bold />
        </View>

        {/* Payment method */}
        {isBuy && (
          <>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text, marginBottom: 10 }}>Payment Method</Text>

            {/* Paychangu */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPaymentMethod("paychangu")}
              style={{
                flexDirection: "row", alignItems: "center",
                backgroundColor: c.card, borderRadius: 14,
                borderWidth: paymentMethod === "paychangu" ? 2 : 1,
                borderColor: paymentMethod === "paychangu" ? TEAL : c.border,
                paddingHorizontal: 16, paddingVertical: 14, marginBottom: 10, gap: 12,
              }}
            >
              <PaychanguIcon />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text, marginBottom: 2 }}>Paychangu</Text>
                <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}>Mobile money & card payments</Text>
              </View>
              <View style={{
                width: 20, height: 20, borderRadius: 10,
                borderWidth: 2,
                borderColor: paymentMethod === "paychangu" ? TEAL : MUTED,
                backgroundColor: paymentMethod === "paychangu" ? TEAL : "transparent",
                alignItems: "center", justifyContent: "center",
              }}>
                {paymentMethod === "paychangu" && (
                  <Svg width={10} height={10} viewBox="0 0 10 10" fill="none">
                    <Path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                )}
              </View>
            </TouchableOpacity>

            {/* Bank Card */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPaymentMethod("bankcard")}
              style={{
                flexDirection: "row", alignItems: "center",
                backgroundColor: c.card, borderRadius: 14,
                borderWidth: paymentMethod === "bankcard" ? 2 : 1,
                borderColor: paymentMethod === "bankcard" ? TEAL : c.border,
                paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20, gap: 12,
              }}
            >
              <Image source={BANK_CARD_LOGO} style={{ width: 36, height: 36, borderRadius: 8 }} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text, marginBottom: 2 }}>Bank Card</Text>
                <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}>Visa, Mastercard & local debit cards</Text>
              </View>
              <View style={{
                width: 20, height: 20, borderRadius: 10,
                borderWidth: 2,
                borderColor: paymentMethod === "bankcard" ? TEAL : MUTED,
                backgroundColor: paymentMethod === "bankcard" ? TEAL : "transparent",
                alignItems: "center", justifyContent: "center",
              }}>
                {paymentMethod === "bankcard" && (
                  <Svg width={10} height={10} viewBox="0 0 10 10" fill="none">
                    <Path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                )}
              </View>
            </TouchableOpacity>
          </>
        )}

        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED, textAlign: "center", lineHeight: 18 }}>
          By confirming, you agree to execute this order at market price.{"\n"}Orders are typically filled within seconds during market hours.
        </Text>
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 16, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.background }}>
        <TouchableOpacity
          style={{ backgroundColor: TEAL, borderRadius: 14, paddingVertical: 16, alignItems: "center", opacity: loading ? 0.6 : 1 }}
          onPress={handleConfirmOrder}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={WHITE} />
            : <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: WHITE }}>Confirm Order</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

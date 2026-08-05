import { guardedBack } from "@/utils/navigation";
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
import { tradingApi, ApiError, getErrorMessage, logHandledError } from "../../services/api";
import { getStockLogo } from "../../utils/stock-logos";
import { useColors } from "@/hooks/useColors";
import PinVerifyModal from "../../components/PinVerifyModal";

const TEAL  = "#164951";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";

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

  // Orders are PIN-protected server-side: Confirm opens the PIN modal, the
  // modal exchanges the PIN for a short-lived pinToken, and the order request
  // carries it in the x-pin-token header.
  const [showPinModal, setShowPinModal] = useState(false);

  const handleConfirmOrder = () => {
    if (!params.stockId || symbol === "—") return;
    setShowPinModal(true);
  };

  const submitOrder = async (pinToken: string) => {
    setShowPinModal(false);
    setLoading(true);
    try {
      const idempotencyKey = `${params.stockId}-${Date.now()}`;
      let result: any;
      if (isBuy) {
        result = await tradingApi.buy({ stockSymbol: symbol, quantity, orderType: "MARKET", idempotencyKey, pinToken });
      } else {
        result = await tradingApi.sell({ stockSymbol: symbol, quantity, orderType: "MARKET", idempotencyKey, pinToken });
      }
      router.push({
        pathname: "/trade/success" as any,
        params: {
          queued: result.queued ? "1" : "0",
          symbol,
          stockName,
          side: isBuy ? "BUY" : "SELL",
          quantity: String(quantity),
          total: fmt(result.fees?.totalCost ?? total),
          message: result.message ?? "",
        },
      });
    } catch (err) {
      logHandledError("Trade confirm", err);
      const code = err instanceof ApiError ? (err.body?.error?.code as string) : null;
      if (code === "AUTH_PIN_INVALID" || code === "AUTH_PIN_NOT_SET") {
        // pinToken expired between verification and submission — re-verify.
        Alert.alert("PIN expired", "Please enter your PIN again to confirm the order.", [
          { text: "OK", onPress: () => setShowPinModal(true) },
        ]);
      } else {
        Alert.alert("Trade Error", getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={{ flex: 1, backgroundColor: c.background, paddingTop: topPad }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => guardedBack("/(tabs)")} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M15 19l-7-7 7-7" stroke={c.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
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

        {/* Order summary card */}
        <View style={{ backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, paddingHorizontal: 16, paddingVertical: 4, marginBottom: 20 }}>
          <Row label="Order Type" value={isBuy ? "Buy" : "Sell"} valueColor={isBuy ? "#16A34A" : "#DC2626"} />
          <Divider />
          <Row label="Quantity" value={`${quantity} share${quantity !== 1 ? "s" : ""}`} />
          <Divider />
          <Row label="Price per Share" value={fmt(priceRaw)} />
          <Divider />
          <Row label="Processing Fee (1%)" value={fmt(fee)} />
          <Divider />
          <Row label="Total" value={fmt(total)} bold />
        </View>

        {/* Wallet deduction notice for buy orders */}
        {isBuy && (
          <View style={{
            backgroundColor: c.card, borderRadius: 14,
            borderWidth: 1, borderColor: c.border,
            paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20,
            flexDirection: "row", alignItems: "center", gap: 10,
          }}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M21 12a2 2 0 00-2-2h-2a2 2 0 000 4h2a2 2 0 002-2z" stroke={TEAL} strokeWidth={1.5} />
              <Path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2v-1M3 7a2 2 0 012-2h12a2 2 0 012 2v1M3 7h16" stroke={TEAL} strokeWidth={1.5} strokeLinecap="round" />
            </Svg>
            <Text style={{ flex: 1, fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED, lineHeight: 18 }}>
              Funds will be deducted from your wallet once the broker confirms your order has been executed.
            </Text>
          </View>
        )}

        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED, textAlign: "center", lineHeight: 18 }}>
          By confirming, you agree to submit this order for broker execution.{"\n"}Your broker will review and execute the order during market hours.
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

      {/* Transaction-PIN verification — required by the backend for orders */}
      <PinVerifyModal
        visible={showPinModal}
        title="Confirm with your PIN"
        subtitle={`Enter your 4-digit PIN to ${isBuy ? "buy" : "sell"} ${quantity} ${symbol} shares`}
        onVerified={submitOrder}
        onCancel={() => setShowPinModal(false)}
      />
    </View>
  );
}

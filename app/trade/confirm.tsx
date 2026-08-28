import { guardedBack } from "@/utils/navigation";
import React, { useEffect, useRef, useState } from "react";
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
import { useQueryClient } from "@tanstack/react-query";
import { tradingApi, ApiError, getErrorMessage, logHandledError, type OrderQuote } from "../../services/api";
import { useAuth } from "../../services/auth-context";
import { invalidateWalletBalance } from "../../services/wallet-queries";
import { getStockLogo } from "../../utils/stock-logos";
import { useColors } from "@/hooks/useColors";
import PinVerifyModal from "../../components/PinVerifyModal";

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
  const topPad = Platform.OS === "web" ? 48 : insets.top || 16;
  const c = useColors();
  const { user } = useAuth();
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

  // Server-computed quote — the SAME fee authority the execution engine uses
  // (broker's tiered commission + statutory levies). Nothing is estimated
  // client-side; the review shows exactly what execution will charge.
  const [quote, setQuote] = useState<OrderQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  useEffect(() => {
    if (symbol === "—" || quantity <= 0) return;
    let cancelled = false;
    setQuote(null);
    setQuoteError(null);
    tradingApi
      .quote({ symbol, quantity, side: isBuy ? "BUY" : "SELL" })
      .then((q) => { if (!cancelled) setQuote(q); })
      .catch((err) => {
        logHandledError("Order quote", err);
        if (!cancelled) setQuoteError(getErrorMessage(err));
      });
    return () => { cancelled = true; };
  }, [symbol, quantity, isBuy]);

  const price      = quote?.pricePerShare ?? priceRaw;
  const gross      = quote?.grossValue ?? quantity * priceRaw;
  const commission = quote?.commission ?? 0;
  const levies     = quote ? quote.secLevy + quote.mseLevy + quote.withholdingTax : 0;
  const total      = isBuy
    ? (quote?.totalCost ?? gross)
    : (quote?.netProceeds ?? gross);

  const fmt = (n: number) =>
    `MWK ${n.toLocaleString("en-MW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Orders are PIN-protected server-side: Confirm opens the PIN modal, the
  // modal exchanges the PIN for a short-lived pinToken, and the order request
  // carries it in the x-pin-token header.
  const [showPinModal, setShowPinModal] = useState(false);

  // Broker-required guard (client-side courtesy — the server enforces this
  // too and rejects orders with BROKER_REQUIRED when no broker is selected).
  const showBrokerRequiredAlert = () => {
    Alert.alert(
      "Select a Broker",
      "Select a broker first — your orders are executed and held by your broker.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Select Broker", onPress: () => router.push("/broker-select" as any) },
      ],
    );
  };

  // Broker risk constraints (server-computed; server-enforced at submission).
  const concentration = quote?.constraints?.concentration;
  const concentrationBlocked = isBuy && concentration?.status === "BLOCKED";

  const blocked =
    (!!quote && ((isBuy && quote.sufficientFunds === false) || (!isBuy && quote.sufficientShares === false))) ||
    concentrationBlocked;

  const handleConfirmOrder = () => {
    if (!params.stockId || symbol === "—") return;
    if (blocked) return;
    if (user && !user.broker) {
      showBrokerRequiredAlert();
      return;
    }
    setShowPinModal(true);
  };

  const qc = useQueryClient();

  // One stable idempotency key per order attempt (this screen instance). If the
  // request times out on-device but the server actually processed it, the user
  // taps Confirm again — the SAME key lets the server dedupe instead of placing
  // a second buy/sell and charging twice. Must NOT be regenerated on retry.
  const idemKeyRef = useRef(
    `${params.stockId ?? "order"}-${params.side ?? "BUY"}-${params.amount ?? "0"}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  );

  const submitOrder = async (pinToken: string) => {
    setShowPinModal(false);
    setLoading(true);
    try {
      const idempotencyKey = idemKeyRef.current;
      let result: any;
      if (isBuy) {
        result = await tradingApi.buy({ stockSymbol: symbol, quantity, orderType: "MARKET", idempotencyKey, pinToken });
      } else {
        result = await tradingApi.sell({ stockSymbol: symbol, quantity, orderType: "MARKET", idempotencyKey, pinToken });
      }
      // The order's cost is reserved server-side the moment it is accepted —
      // refresh so the available balance drops immediately.
      invalidateWalletBalance(qc).catch(() => {});
      router.push({
        pathname: "/trade/success" as any,
        params: {
          queued: result.queued ? "1" : "0",
          marketOpen: result.marketOpen ? "1" : "0",
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
      const message = getErrorMessage(err);
      if (code === "AUTH_PIN_INVALID" || code === "AUTH_PIN_NOT_SET") {
        // pinToken expired between verification and submission — re-verify.
        Alert.alert("PIN expired", "Please enter your PIN again to confirm the order.", [
          { text: "OK", onPress: () => setShowPinModal(true) },
        ]);
      } else if (
        /BROKER_REQUIRED/i.test(message) ||
        (err instanceof ApiError && /BROKER_REQUIRED/i.test(err.message))
      ) {
        // No broker selected — offer to go pick one.
        showBrokerRequiredAlert();
      } else {
        Alert.alert("Order Not Placed", message);
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
              <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.primary }}>{symbol.charAt(0)}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: c.text, marginBottom: 3 }}>{symbol}</Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED }}>{stockName}</Text>
          </View>
        </View>

        {/* Order summary card — full transparent breakdown from the server */}
        <View style={{ backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, paddingHorizontal: 16, paddingVertical: 4, marginBottom: 20 }}>
          <Row label="Order Type" value={isBuy ? "Buy" : "Sell"} valueColor={isBuy ? "#16A34A" : "#DC2626"} />
          <Divider />
          {user?.broker && (
            <>
              <Row label="Broker" value={user.broker.name} />
              <Divider />
            </>
          )}
          <Row label="Quantity" value={`${quantity} share${quantity !== 1 ? "s" : ""}`} />
          <Divider />
          <Row label="Price per Share" value={fmt(price)} />
          <Divider />
          <Row label="Order Value" value={fmt(gross)} />
          <Divider />
          {quote ? (
            <>
              <Row label="Broker Commission" value={fmt(commission)} />
              <Divider />
              <Row label="Statutory Levies" value={fmt(levies)} />
              <Divider />
              <Row
                label={isBuy ? "Total Cost" : "Net Proceeds"}
                value={fmt(total)}
                bold
                valueColor={isBuy ? undefined : "#16A34A"}
              />
              {isBuy && quote.remainingAfter != null && (
                <>
                  <Divider />
                  <Row
                    label="Balance After"
                    value={fmt(Math.max(quote.remainingAfter, 0))}
                    valueColor={quote.sufficientFunds ? undefined : "#DC2626"}
                  />
                </>
              )}
            </>
          ) : quoteError ? (
            <View style={{ paddingVertical: 13 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: "#DC2626" }}>
                {quoteError}
              </Text>
            </View>
          ) : (
            <View style={{ paddingVertical: 16, alignItems: "center" }}>
              <ActivityIndicator color={c.primary} size="small" />
              <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED, marginTop: 8 }}>
                Calculating fees…
              </Text>
            </View>
          )}
        </View>

        {/* Insufficient funds / shares warning */}
        {quote && isBuy && quote.sufficientFunds === false && (
          <View style={{ backgroundColor: "#DC262615", borderRadius: 14, borderWidth: 1, borderColor: "#DC262640", paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: "#DC2626" }}>
              Insufficient available funds — you have {fmt(quote.cashAvailable)} available.
            </Text>
          </View>
        )}
        {quote && !isBuy && quote.sufficientShares === false && (
          <View style={{ backgroundColor: "#DC262615", borderRadius: 14, borderWidth: 1, borderColor: "#DC262640", paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: "#DC2626" }}>
              Insufficient shares — {quote.sharesAvailable ?? 0} available to sell
              {quote.sharesHeld != null && quote.sharesHeld !== quote.sharesAvailable
                ? ` (${quote.sharesHeld} held, rest committed to open orders)` : ""}.
            </Text>
          </View>
        )}

        {/* Broker concentration limit — hard block (red) or soft warning (amber).
            The server enforces the same rule at submission; this is transparency. */}
        {isBuy && concentration?.status === "BLOCKED" && (
          <View style={{ backgroundColor: "#DC262615", borderRadius: 14, borderWidth: 1, borderColor: "#DC262640", paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 13, color: "#DC2626", marginBottom: 4 }}>
              Broker limit: max {concentration.maxPct}% per stock
            </Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: "#DC2626", lineHeight: 18 }}>
              {concentration.reason ?? "This order would exceed your broker's portfolio concentration limit."}
            </Text>
          </View>
        )}
        {isBuy && concentration?.status === "WARNING" && (
          <View style={{ backgroundColor: "#D9770615", borderRadius: 14, borderWidth: 1, borderColor: "#D9770640", paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: "#D97706", marginBottom: 2 }}>
              Concentration notice
            </Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: "#D97706", lineHeight: 18 }}>
              {concentration.reason}
            </Text>
          </View>
        )}

        {/* Wallet deduction notice for buy orders */}
        {isBuy && (
          <View style={{
            backgroundColor: c.card, borderRadius: 14,
            borderWidth: 1, borderColor: c.border,
            paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20,
            flexDirection: "row", alignItems: "center", gap: 10,
          }}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M21 12a2 2 0 00-2-2h-2a2 2 0 000 4h2a2 2 0 002-2z" stroke={c.primary} strokeWidth={1.5} />
              <Path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2v-1M3 7a2 2 0 012-2h12a2 2 0 012 2v1M3 7h16" stroke={c.primary} strokeWidth={1.5} strokeLinecap="round" />
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
          style={{ backgroundColor: c.primary, borderRadius: 14, paddingVertical: 16, alignItems: "center", opacity: loading || blocked ? 0.6 : 1 }}
          onPress={handleConfirmOrder}
          disabled={loading || blocked}
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

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
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
  const [savingRoutine, setSavingRoutine] = useState(true);
  const [loading, setLoading] = useState(false);

  // Read trade params from buy screen
  const params = useLocalSearchParams<{
    stockId?: string;
    symbol?: string;
    name?: string;
    side?: string;
    amount?: string;
    price?: string;
  }>();

  const symbol = params.symbol ?? "—";
  const stockName = params.name ?? "Stock";
  const isBuy = (params.side ?? "BUY") === "BUY";
  const pricePerShare = Number(params.price ?? 0);
  const quantity = Math.max(1, Number(params.amount ?? 0));
  const subtotal = quantity * pricePerShare;
  const fee = Math.round(subtotal * 0.015 * 100) / 100; // 1.5% fee
  const discount = savingRoutine ? -2.50 : 0;
  const total = subtotal + fee + discount;

  const handleConfirmOrder = async () => {
    if (!params.stockId) return;
    setLoading(true);
    try {
      if (isBuy) {
        // ── BUY: Initiate PayChangu payment ──
        const session = await paymentsApi.initiate({
          amount: Math.ceil(total),
          currency: "MWK",
          purpose: "BUY_SHARES",
          stockSymbol: symbol,
          quantity,
        });

        if (!session.checkoutUrl) {
          throw new Error("Payment gateway did not return a checkout URL. Please try again.");
        }

        // Navigate to payment webview with checkout URL
        router.push({
          pathname: "/trade/payment-webview" as any,
          params: {
            checkoutUrl: session.checkoutUrl,
            txRef: session.txRef,
            symbol,
            amount: String(Math.ceil(total)),
          },
        });
      } else {
        // ── SELL: Execute trade directly (credits wallet) ──
        await tradingApi.sell({
          stockId: params.stockId,
          quantity,
          orderType: "MARKET",
          pinToken: "skip",
        });
        router.push("/trade/success" as any);
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Trade failed. Please try again.";
      Alert.alert("Trade Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Order</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Order Details */}
        <View style={styles.orderHeader}>
          <View style={[styles.assetLogo, { backgroundColor: WHITE, overflow: "hidden", borderWidth: 1, borderColor: "#E5E7EB" }]}>
            {getStockLogo(symbol) ? (
              <Image source={getStockLogo(symbol)!} style={{ width: 48, height: 48, borderRadius: 24 }} resizeMode="contain" />
            ) : (
              <Text style={[styles.assetLogoText, { color: TEAL }]}>{symbol.charAt(0)}</Text>
            )}
          </View>
          <View style={styles.orderHeaderInfo}>
            <Text style={styles.orderAssetName}>{stockName}</Text>
            <Text style={styles.orderAssetTicker}>{symbol} · Market {isBuy ? "Buy" : "Sell"}</Text>
          </View>
        </View>

        {/* Summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shares</Text>
            <Text style={styles.summaryValue}>{quantity}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Price per Share</Text>
            <Text style={styles.summaryValue}>K{pricePerShare.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Order Type</Text>
            <Text style={styles.summaryValue}>Market</Text>
          </View>
        </View>

        {isBuy && (
          <>
            {/* Payment Method */}
            <Text style={styles.sectionLabel}>Payment Method</Text>
            <View style={styles.paymentCard}>
              <PayPalIcon />
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentLabel}>PayPal</Text>
                <Text style={styles.paymentSub}>paypal@example.com</Text>
              </View>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            </View>

            {/* Promo applied */}
            <View style={styles.promoApplied}>
              <CheckCircleSmall />
              <Text style={styles.promoAppliedText}>No promo code applied</Text>
            </View>

            {/* Saving Routine */}
            <View style={styles.savingCard}>
              <View style={styles.savingLeft}>
                <Text style={styles.savingTitle}>Saving Routine</Text>
                <Text style={styles.savingDesc}>Save K2.50 on this order</Text>
              </View>
              <Switch
                value={savingRoutine}
                onValueChange={setSavingRoutine}
                trackColor={{ false: "#E5E7EB", true: "#D1FADF" }}
                thumbColor={savingRoutine ? GREEN : "#9CA3AF"}
                ios_backgroundColor="#E5E7EB"
              />
            </View>
          </>
        )}

        {/* Total Breakdown */}
        {isBuy && (
          <View style={styles.totalCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>K{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRowBorder} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Processing Fee</Text>
              <Text style={styles.totalValue}>K{fee.toFixed(2)}</Text>
            </View>
            {savingRoutine && (
              <>
                <View style={styles.totalRowBorder} />
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Saving Routine</Text>
                  <Text style={[styles.totalValue, { color: GREEN }]}>K{Math.abs(discount).toFixed(2)}</Text>
                </View>
              </>
            )}
            <View style={[styles.totalRowBorder, { backgroundColor: "#D1D5DB" }]} />
            <View style={styles.totalRow}>
              <Text style={styles.totalFinalLabel}>Total</Text>
              <Text style={styles.totalFinalValue}>K{total.toFixed(2)}</Text>
            </View>
          </View>
        )}
        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          By confirming, you agree to execute this order at market price. Orders are typically filled within seconds during market hours.
        </Text>
      </ScrollView>

      {/* CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.ctaBtn, loading && { opacity: 0.6 }]}
          onPress={handleConfirmOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={WHITE} />
          ) : (
            <Text style={styles.ctaBtnText}>Confirm</Text>
          )}
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
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  assetLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  assetLogoText: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: WHITE },
  orderHeaderInfo: { flex: 1 },
  orderAssetName: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: DARK, marginBottom: 3 },
  orderAssetTicker: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED },
  orderStatusBadge: {
    backgroundColor: "#FEF9C3",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  orderStatusText: { fontFamily: "PlusJakartaSans_500Medium", fontSize: 12, color: "#92400E" },
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
  sectionLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    color: DARK,
    marginBottom: 10,
  },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    gap: 12,
  },
  paymentInfo: { flex: 1 },
  paymentLabel: { fontFamily: "PlusJakartaSans_500Medium", fontSize: 14, color: DARK, marginBottom: 2 },
  paymentSub: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED },
  changeText: { fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: TEAL },
  promoApplied: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    marginBottom: 12,
  },
  promoAppliedText: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED },
  savingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
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
    marginBottom: 16,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12 },
  totalRowBorder: { height: 1, backgroundColor: DIVIDER },
  totalLabel: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED },
  totalValue: { fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: DARK },
  totalFinalLabel: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: DARK },
  totalFinalValue: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: TEAL },
  disclaimer: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: MUTED,
    textAlign: "center",
    lineHeight: 18,
  },
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

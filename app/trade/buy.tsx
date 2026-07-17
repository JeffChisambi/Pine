import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Path, Circle, Rect, G } from "react-native-svg";
import { getStockLogo } from "../../utils/stock-logos";
import { useWalletBalance } from "../../services/wallet-queries";

const TEAL = "#164951";
const CARD_TEAL = "#2D5B62";
const GREEN = "#45B369";
const RED = "#EF4770";
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

function ChevronDown({ color = MUTED }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path d="M4 6l4 4 4-4" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PortfolioIcon() {
  return (
    <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
      <Rect width={40} height={40} rx={20} fill="rgba(255,255,255,0.15)" />
      <Path d="M12 28V18l8-6 8 6v10H12z" stroke={WHITE} strokeWidth={1.5} strokeLinejoin="round" />
      <Rect x={17} y={22} width={6} height={6} rx={1} stroke={WHITE} strokeWidth={1.5} />
    </Svg>
  );
}

import { useStocks } from "../../hooks/useStocks";
import { ApiStock } from "../../services/api";

const PCT_BUTTONS = ["10%", "25%", "50%", "75%", "Max"];

export default function BuyScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;
  const params = useLocalSearchParams<{ mode?: string }>();

  const [mode, setMode] = useState<"buy" | "sell">(params.mode === "sell" ? "sell" : "buy");
  const { data: stocks = [] } = useStocks();
  const [selectedStock, setSelectedStock] = useState<ApiStock | null>(null);
  const [amount, setAmount] = useState("");
  const [showStockPicker, setShowStockPicker] = useState(false);

  // Auto-select first stock once loaded
  React.useEffect(() => {
    if (stocks.length > 0 && !selectedStock) {
      setSelectedStock(stocks[0]);
    }
  }, [stocks]);

  // Wallet balance — shared React Query cache, so a deposit reflects here too
  const { data: walletBalanceData } = useWalletBalance();
  const walletBalance = Number(
    walletBalanceData?.availableBalance || walletBalanceData?.balance || 0,
  );
  const [availableShares, setAvailableShares] = useState<number>(0);

  const isBuy = mode === "buy";

  const handlePct = (pct: string) => {
    const available = isBuy ? walletBalance : availableShares;
    const map: Record<string, number> = { "10%": 0.1, "25%": 0.25, "50%": 0.5, "75%": 0.75, Max: 1 };
    const val = (available * (map[pct] || 0)).toFixed(2);
    setAmount(val);
  };

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isBuy ? "Buy Stock" : "Sell Stock"}</Text>
        <View style={{ width: 40 }} />
      </View>



      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Balance card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceLeft}>
            <Text style={styles.balanceLabel}>{isBuy ? "Available Cash" : "Available Shares"}</Text>
            <Text style={styles.balanceValue}>
              {isBuy ? `MK ${walletBalance.toLocaleString("en-MW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${availableShares} shares`}
            </Text>
            <Text style={styles.balanceSubLabel}>{isBuy ? "Ready to invest" : (selectedStock?.name ?? "")}</Text>
          </View>
          <PortfolioIcon />
        </View>

        {/* Order card */}
        <View style={styles.orderCard}>
          {/* Asset selector */}
          <TouchableOpacity
            style={styles.fieldRow}
            onPress={() => setShowStockPicker((v) => !v)}
            activeOpacity={0.75}
          >
            <Text style={styles.fieldLabel}>Select Asset</Text>
            <View style={styles.fieldRight}>
              {selectedStock ? (
                <>
                  <View style={[styles.miniLogo, { backgroundColor: WHITE, overflow: "hidden", borderWidth: 1, borderColor: "#E5E7EB" }]}>
                    {getStockLogo(selectedStock.symbol) ? (
                      <Image source={getStockLogo(selectedStock.symbol)!} style={{ width: 24, height: 24, borderRadius: 12 }} resizeMode="contain" />
                    ) : (
                      <Text style={{ color: TEAL, fontFamily: "Poppins_700Bold", fontSize: 9 }}>{selectedStock.symbol.slice(0, 3)}</Text>
                    )}
                  </View>
                  <Text style={styles.fieldValue}>{selectedStock.symbol}</Text>
                </>
              ) : (
                <Text style={styles.fieldValue}>Select…</Text>
              )}
              <ChevronDown />
            </View>
          </TouchableOpacity>

          {showStockPicker && (
            <View style={styles.picker}>
              {stocks.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.pickerRow}
                  onPress={() => { setSelectedStock(s); setShowStockPicker(false); }}
                >
                  <View style={[styles.miniLogo, { backgroundColor: WHITE, overflow: "hidden", borderWidth: 1, borderColor: "#E5E7EB" }]}>
                    {getStockLogo(s.symbol) ? (
                      <Image source={getStockLogo(s.symbol)!} style={{ width: 24, height: 24, borderRadius: 12 }} resizeMode="contain" />
                    ) : (
                      <Text style={{ color: TEAL, fontFamily: "Poppins_700Bold", fontSize: 9 }}>{s.symbol.slice(0, 3)}</Text>
                    )}
                  </View>
                  <Text style={styles.pickerRowText}>{s.symbol} — {s.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.fieldDivider} />

          {/* Amount */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>How many</Text>
            <View style={styles.fieldRight}>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                placeholderTextColor={MUTED}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>


        {/* Order summary preview */}
        {amount.length > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Asset</Text>
              <Text style={styles.summaryValue}>{selectedStock?.symbol ?? "—"}</Text>
            </View>
            <View style={styles.summaryRowBorder} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Order Type</Text>
              <Text style={styles.summaryValue}>Market {isBuy ? "Buy" : "Sell"}</Text>
            </View>
            <View style={styles.summaryRowBorder} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated Amount</Text>
              <Text style={[styles.summaryValue, { color: isBuy ? GREEN : RED }]}>
                {isBuy ? "+" : "-"}MK {selectedStock?.price ? (Number(amount) * Number(selectedStock.price)).toLocaleString() : "0"}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: TEAL }, !amount && { opacity: 0.5 }]}
          disabled={!amount || !selectedStock}
          onPress={() => router.push({
            pathname: "/trade/confirm" as any,
            params: {
              stockId: selectedStock?.id ?? "",
              symbol: selectedStock?.symbol ?? "",
              name: selectedStock?.name ?? "",
              side: mode.toUpperCase(),
              amount: amount,
              price: selectedStock?.price ?? "0",
            },
          })}
        >
          <Text style={styles.ctaBtnText}>Review Order</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: WHITE,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 17,
    color: DARK,
    textAlign: "center",
  },
  toggleWrap: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  toggleActive: {
    backgroundColor: TEAL,
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: MUTED,
  },
  toggleTextActive: {
    color: WHITE,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  balanceCard: {
    backgroundColor: TEAL,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  balanceLeft: {
    flex: 1,
  },
  balanceLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 4,
  },
  balanceValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: WHITE,
    marginBottom: 4,
  },
  balanceSubLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
  },
  orderCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    marginBottom: 16,
    overflow: "hidden",
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  fieldLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: MUTED,
  },
  fieldRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  miniLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  miniLogoImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  fieldValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: DARK,
  },
  dollarSign: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: DARK,
  },
  amountInput: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: DARK,
    minWidth: 80,
    textAlign: "right",
    padding: 0,
  },
  fieldDivider: {
    height: 1,
    backgroundColor: CARD_BORDER,
    marginHorizontal: 16,
  },
  picker: {
    borderTopWidth: 1,
    borderTopColor: CARD_BORDER,
    paddingVertical: 4,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  pickerRowText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: DARK,
  },
  pctRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  pctBtn: {
    flex: 1,
    backgroundColor: "#F3F6F6",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D0DBDC",
  },
  pctText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: TEAL,
  },
  summaryCard: {
    backgroundColor: "#F3F6F6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#D0DBDC",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  summaryRowBorder: {
    height: 1,
    backgroundColor: DIVIDER,
  },
  summaryLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: MUTED,
  },
  summaryValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: DARK,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: DIVIDER,
    backgroundColor: WHITE,
  },
  ctaBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: WHITE,
  },
});

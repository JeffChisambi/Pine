import React, { useState } from "react";
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
import { router } from "expo-router";
import Svg, { Path, Circle, G } from "react-native-svg";
import { getStockLogo } from "../../utils/stock-logos";

const TEAL = "#164951";
const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const DARK = "#111827";
const MUTED = "#9CA3AF";
const DIVIDER = "#EBECEF";
const CARD_BORDER = "#F3F4F6";

function BackIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={DARK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDown() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path d="M4 6l4 4 4-4" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SwapIcon() {
  return (
    <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
      <Circle cx={18} cy={18} r={18} fill={TEAL} />
      <Path d="M12 15h12M12 21h12" stroke={WHITE} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M20 12l4 3-4 3" stroke={WHITE} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 24l-4-3 4-3" stroke={WHITE} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

import { useStocks } from "../../hooks/useStocks";
import { ApiStock } from "../../services/api";

export default function ExchangeScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;

  const { data: stocks = [] } = useStocks();
  const [fromStock, setFromStock] = useState<ApiStock | null>(null);
  const [toStock, setToStock] = useState<ApiStock | null>(null);
  const [fromAmount, setFromAmount] = useState("2");
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  React.useEffect(() => {
    if (stocks.length >= 2 && !fromStock) {
      setFromStock(stocks[0]);
      setToStock(stocks[1]);
    }
  }, [stocks]);

  const fromPrice = fromStock?.priceRaw ?? 0;
  const toPrice = toStock?.priceRaw ?? 1;
  const toAmount = fromAmount && toPrice
    ? ((parseFloat(fromAmount) * fromPrice) / toPrice).toFixed(4)
    : "0.0000";

  const handleSwap = () => {
    const temp = fromStock;
    setFromStock(toStock);
    setToStock(temp ?? null);
  };

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exchange</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Exchange card */}
        <View style={styles.exchangeCard}>
          {/* From row */}
          <View style={styles.assetSection}>
            <Text style={styles.assetSectionLabel}>FROM</Text>
            <View style={styles.assetRow}>
              <TextInput
                style={styles.assetAmountInput}
                value={fromAmount}
                onChangeText={setFromAmount}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={MUTED}
              />
              <TouchableOpacity
                style={styles.assetSelector}
                onPress={() => { setShowFromPicker((v) => !v); setShowToPicker(false); }}
              >
                <View style={[styles.logoCircle, { backgroundColor: WHITE, overflow: "hidden", borderWidth: 1, borderColor: "#E5E7EB" }]}>
                  {fromStock?.symbol && getStockLogo(fromStock.symbol) ? (
                    <Image source={getStockLogo(fromStock.symbol)!} style={{ width: 28, height: 28, borderRadius: 14 }} resizeMode="contain" />
                  ) : (
                    <Text style={{ color: TEAL, fontFamily: "PlusJakartaSans_700Bold", fontSize: 9 }}>{fromStock?.symbol?.slice(0, 3) ?? ""}</Text>
                  )}
                </View>
                <Text style={styles.assetSelectorTicker}>{fromStock?.symbol ?? "..."}</Text>
                <ChevronDown />
              </TouchableOpacity>
            </View>
            <Text style={styles.assetSub}>
              {fromStock?.name ?? ""} · {fromStock?.price ?? ""}/share
            </Text>
          </View>

          {showFromPicker && (
            <View style={styles.picker}>
              {stocks.filter((s) => s.symbol !== toStock?.symbol).map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.pickerRow}
                  onPress={() => { setFromStock(s); setShowFromPicker(false); }}
                >
                  <View style={[styles.logoCircle, { backgroundColor: WHITE, overflow: "hidden", borderWidth: 1, borderColor: "#E5E7EB" }]}>
                    {getStockLogo(s.symbol) ? (
                      <Image source={getStockLogo(s.symbol)!} style={{ width: 28, height: 28, borderRadius: 14 }} resizeMode="contain" />
                    ) : (
                      <Text style={{ color: TEAL, fontFamily: "PlusJakartaSans_700Bold", fontSize: 9 }}>{s.symbol.slice(0, 3)}</Text>
                    )}
                  </View>
                  <View>
                    <Text style={styles.pickerTicker}>{s.symbol}</Text>
                    <Text style={styles.pickerName}>{s.name}</Text>
                  </View>
                  <Text style={styles.pickerPrice}>{s.price}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Swap divider */}
          <View style={styles.swapDivider}>
            <View style={styles.dividerLine} />
            <TouchableOpacity onPress={handleSwap}>
              <SwapIcon />
            </TouchableOpacity>
            <View style={styles.dividerLine} />
          </View>

          {/* To row */}
          <View style={styles.assetSection}>
            <Text style={styles.assetSectionLabel}>TO</Text>
            <View style={styles.assetRow}>
              <Text style={styles.assetAmountReadonly}>{toAmount}</Text>
              <TouchableOpacity
                style={styles.assetSelector}
                onPress={() => { setShowToPicker((v) => !v); setShowFromPicker(false); }}
              >
                <View style={[styles.logoCircle, { backgroundColor: WHITE, overflow: "hidden", borderWidth: 1, borderColor: "#E5E7EB" }]}>
                  {toStock?.symbol && getStockLogo(toStock.symbol) ? (
                    <Image source={getStockLogo(toStock.symbol)!} style={{ width: 28, height: 28, borderRadius: 14 }} resizeMode="contain" />
                  ) : (
                    <Text style={{ color: TEAL, fontFamily: "PlusJakartaSans_700Bold", fontSize: 9 }}>{toStock?.symbol?.slice(0, 3) ?? ""}</Text>
                  )}
                </View>
                <Text style={styles.assetSelectorTicker}>{toStock?.symbol ?? "..."}</Text>
                <ChevronDown />
              </TouchableOpacity>
            </View>
            <Text style={styles.assetSub}>
              {toStock?.name ?? ""} · {toStock?.price ?? ""}/share
            </Text>
          </View>

          {showToPicker && (
            <View style={styles.picker}>
              {stocks.filter((s) => s.symbol !== fromStock?.symbol).map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.pickerRow}
                  onPress={() => { setToStock(s); setShowToPicker(false); }}
                >
                  <View style={[styles.logoCircle, { backgroundColor: WHITE, overflow: "hidden", borderWidth: 1, borderColor: "#E5E7EB" }]}>
                    {getStockLogo(s.symbol) ? (
                      <Image source={getStockLogo(s.symbol)!} style={{ width: 28, height: 28, borderRadius: 14 }} resizeMode="contain" />
                    ) : (
                      <Text style={{ color: TEAL, fontFamily: "PlusJakartaSans_700Bold", fontSize: 9 }}>{s.symbol.slice(0, 3)}</Text>
                    )}
                  </View>
                  <View>
                    <Text style={styles.pickerTicker}>{s.symbol}</Text>
                    <Text style={styles.pickerName}>{s.name}</Text>
                  </View>
                  <Text style={styles.pickerPrice}>{s.price}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Rate info */}
        <View style={styles.rateCard}>
          <Text style={styles.rateLabel}>Exchange Rate</Text>
          <Text style={styles.rateValue}>
            1 {fromStock?.symbol ?? ""} = {fromStock && toPrice ? (fromPrice / toPrice).toFixed(4) : "0.0000"} {toStock?.symbol ?? ""}
          </Text>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>From</Text>
            <Text style={styles.summaryValue}>{fromAmount || "0"} {fromStock?.symbol ?? ""}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>To</Text>
            <Text style={[styles.summaryValue, { color: GREEN }]}>{toAmount} {toStock?.symbol ?? ""}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Fee</Text>
            <Text style={styles.summaryValue}>K0.00</Text>
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push("/trade/confirm" as any)}>
          <Text style={styles.ctaBtnText}>Exchange</Text>
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
    paddingBottom: 16,
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
  exchangeCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    marginBottom: 16,
    overflow: "hidden",
  },
  assetSection: { padding: 20 },
  assetSectionLabel: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 11,
    color: MUTED,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  assetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  assetAmountInput: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 32,
    color: DARK,
    flex: 1,
    padding: 0,
  },
  assetAmountReadonly: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 32,
    color: TEAL,
    flex: 1,
  },
  assetSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F3F6F6",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  logoCircle: {
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
  logoImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  assetSelectorTicker: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    color: DARK,
  },
  assetSub: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: MUTED,
  },
  picker: {
    borderTopWidth: 1,
    borderTopColor: CARD_BORDER,
    paddingVertical: 4,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  pickerTicker: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: DARK },
  pickerName: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED },
  pickerPrice: { fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: DARK, marginLeft: "auto" },
  swapDivider: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: CARD_BORDER },
  rateCard: {
    backgroundColor: "#F3F6F6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D0DBDC",
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  rateLabel: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED },
  rateValue: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: TEAL },
  summaryCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  summaryDivider: { height: 1, backgroundColor: DIVIDER },
  summaryLabel: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED },
  summaryValue: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: DARK },
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

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { getStockLogo } from "../../utils/stock-logos";
import { useWalletBalance } from "../../services/wallet-queries";
import { useStocks } from "../../hooks/useStocks";
import { ApiStock } from "../../services/api";
import { useColors } from "@/hooks/useColors";

const TEAL = "#164951";
const GREEN = "#45B369";
const RED = "#EF4770";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";

function PortfolioIcon() {
  return (
    <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
      <Rect width={40} height={40} rx={20} fill="rgba(255,255,255,0.15)" />
      <Path d="M12 28V18l8-6 8 6v10H12z" stroke={WHITE} strokeWidth={1.5} strokeLinejoin="round" />
      <Rect x={17} y={22} width={6} height={6} rx={1} stroke={WHITE} strokeWidth={1.5} />
    </Svg>
  );
}

export default function BuyScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;
  const params = useLocalSearchParams<{ mode?: string; ticker?: string }>();
  const c = useColors();

  const [mode, setMode] = useState<"buy" | "sell">(params.mode === "sell" ? "sell" : "buy");
  const { data: stocks = [] } = useStocks();
  const [selectedStock, setSelectedStock] = useState<ApiStock | null>(null);
  const [amount, setAmount] = useState("");
  const [showStockPicker, setShowStockPicker] = useState(false);

  useEffect(() => {
    if (stocks.length === 0) return;
    if (params.ticker) {
      const match = stocks.find(
        (s) => s.symbol.toUpperCase() === params.ticker!.toUpperCase()
      );
      setSelectedStock(match ?? stocks[0]);
    } else if (!selectedStock) {
      setSelectedStock(stocks[0]);
    }
  }, [stocks, params.ticker]);

  const { data: walletBalanceData } = useWalletBalance();
  const walletBalance = Number(walletBalanceData?.availableBalance || walletBalanceData?.balance || 0);
  const [availableShares] = useState<number>(0);
  const isBuy = mode === "buy";

  return (
    <View style={{ flex: 1, backgroundColor: c.background, paddingTop: topPad }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M15 18l-6-6 6-6" stroke={c.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={{ flex: 1, fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: c.text, textAlign: "center" }}>{isBuy ? "Buy Stock" : "Sell Stock"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        {/* Balance card — always teal */}
        <View style={{ backgroundColor: TEAL, borderRadius: 16, padding: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>{isBuy ? "Available Cash" : "Available Shares"}</Text>
            <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 28, color: WHITE, marginBottom: 4 }}>
              {isBuy ? `MK ${walletBalance.toLocaleString("en-MW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${availableShares} shares`}
            </Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{isBuy ? "Ready to invest" : (selectedStock?.name ?? "")}</Text>
          </View>
          <PortfolioIcon />
        </View>

        {/* Order card */}
        <View style={{ backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, marginBottom: 16, overflow: "hidden" }}>
          {/* Asset selector */}
          <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 16 }} onPress={() => setShowStockPicker((v) => !v)} activeOpacity={0.75}>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: MUTED }}>Select Asset</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              {selectedStock ? (
                <>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: c.background, overflow: "hidden", borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center" }}>
                    {getStockLogo(selectedStock.symbol) ? (
                      <Image source={getStockLogo(selectedStock.symbol)!} style={{ width: 24, height: 24, borderRadius: 12 }} resizeMode="contain" />
                    ) : (
                      <Text style={{ color: TEAL, fontFamily: "PlusJakartaSans_700Bold", fontSize: 9 }}>{selectedStock.symbol.slice(0, 3)}</Text>
                    )}
                  </View>
                  <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text }}>{selectedStock.symbol}</Text>
                </>
              ) : (
                <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text }}>Select…</Text>
              )}
              <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                <Path d="M4 6l4 4 4-4" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
          </TouchableOpacity>

          {showStockPicker && (
            <View style={{ borderTopWidth: 1, borderTopColor: c.border, paddingVertical: 4 }}>
              {stocks.map((s) => (
                <TouchableOpacity key={s.id} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, gap: 10 }} onPress={() => { setSelectedStock(s); setShowStockPicker(false); }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: c.background, overflow: "hidden", borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center" }}>
                    {getStockLogo(s.symbol) ? (
                      <Image source={getStockLogo(s.symbol)!} style={{ width: 24, height: 24, borderRadius: 12 }} resizeMode="contain" />
                    ) : (
                      <Text style={{ color: TEAL, fontFamily: "PlusJakartaSans_700Bold", fontSize: 9 }}>{s.symbol.slice(0, 3)}</Text>
                    )}
                  </View>
                  <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: c.text }}>{s.symbol} — {s.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={{ height: 1, backgroundColor: c.border, marginHorizontal: 16 }} />

          {/* Amount */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 16 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: MUTED }}>How many</Text>
            <TextInput
              style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 16, color: c.text, minWidth: 80, textAlign: "right", padding: 0 }}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={MUTED}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* Order summary preview */}
        {amount.length > 0 && (
          <View style={{ backgroundColor: c.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 4, borderWidth: 1, borderColor: c.border }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 12 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED }}>Asset</Text>
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: c.text }}>{selectedStock?.symbol ?? "—"}</Text>
            </View>
            <View style={{ height: 1, backgroundColor: c.border }} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 12 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED }}>Price per Share</Text>
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: c.text }}>{selectedStock?.price ?? "—"}</Text>
            </View>
            <View style={{ height: 1, backgroundColor: c.border }} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 12 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED }}>Order Type</Text>
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: c.text }}>Market {isBuy ? "Buy" : "Sell"}</Text>
            </View>
            <View style={{ height: 1, backgroundColor: c.border }} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 12 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED }}>Estimated Amount</Text>
              <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 13, color: c.text }}>
                {(() => {
                  const qty = parseInt(amount, 10);
                  const rawPrice = selectedStock?.priceRaw ?? 0;
                  if (!qty || qty <= 0 || !rawPrice) return "—";
                  const total = qty * rawPrice;
                  return `${isBuy ? "+" : "-"}MWK ${total.toLocaleString("en-MW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                })()}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 16, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.background }}>
        <TouchableOpacity
          style={{ backgroundColor: TEAL, borderRadius: 14, paddingVertical: 16, alignItems: "center", opacity: amount && selectedStock ? 1 : 0.5 }}
          disabled={!amount || !selectedStock}
          onPress={() => router.push({
            pathname: "/trade/confirm" as any,
            params: { stockId: selectedStock?.id ?? "", symbol: selectedStock?.symbol ?? "", name: selectedStock?.name ?? "", side: mode.toUpperCase(), amount, price: String(selectedStock?.priceRaw ?? 0) },
          })}
        >
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: WHITE }}>Review Order</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

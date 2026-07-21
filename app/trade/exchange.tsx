import { guardedBack } from "@/utils/navigation";
import React, { useState } from "react";
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
import { router } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { getStockLogo } from "../../utils/stock-logos";
import { useStocks } from "../../hooks/useStocks";
import { ApiStock } from "../../services/api";
import { useColors } from "@/hooks/useColors";

const TEAL = "#164951";
const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";

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

export default function ExchangeScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;
  const c = useColors();

  const { data: stocks = [] } = useStocks();
  const [fromStock, setFromStock] = useState<ApiStock | null>(null);
  const [toStock, setToStock] = useState<ApiStock | null>(null);
  const [fromAmount, setFromAmount] = useState("2");
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  React.useEffect(() => {
    if (stocks.length >= 2 && !fromStock) { setFromStock(stocks[0]); setToStock(stocks[1]); }
  }, [stocks]);

  const fromPrice = fromStock?.priceRaw ?? 0;
  const toPrice = toStock?.priceRaw ?? 1;
  const toAmount = fromAmount && toPrice ? ((parseFloat(fromAmount) * fromPrice) / toPrice).toFixed(4) : "0.0000";

  const handleSwap = () => { const temp = fromStock; setFromStock(toStock); setToStock(temp ?? null); };

  const LogoCircle = ({ symbol }: { symbol: string }) => (
    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: c.background, overflow: "hidden", borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center" }}>
      {getStockLogo(symbol) ? (
        <Image source={getStockLogo(symbol)!} style={{ width: 28, height: 28, borderRadius: 14 }} resizeMode="contain" />
      ) : (
        <Text style={{ color: TEAL, fontFamily: "PlusJakartaSans_700Bold", fontSize: 9 }}>{symbol.slice(0, 3)}</Text>
      )}
    </View>
  );

  const PickerDropdown = ({ stockList, onSelect }: { stockList: ApiStock[]; onSelect: (s: ApiStock) => void }) => (
    <View style={{ borderTopWidth: 1, borderTopColor: c.border, paddingVertical: 4 }}>
      {stockList.map((s) => (
        <TouchableOpacity key={s.id} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 10, gap: 10 }} onPress={() => onSelect(s)}>
          <LogoCircle symbol={s.symbol} />
          <View>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text }}>{s.symbol}</Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}>{s.name}</Text>
          </View>
          <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: c.text, marginLeft: "auto" }}>{s.price}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.background, paddingTop: topPad }}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 16 }}>
        <TouchableOpacity onPress={() => guardedBack("/(tabs)")} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M15 19l-7-7 7-7" stroke={c.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={{ flex: 1, fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: c.text, textAlign: "center" }}>Exchange</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        {/* Exchange card */}
        <View style={{ backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, marginBottom: 16, overflow: "hidden" }}>
          {/* From */}
          <View style={{ padding: 20 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 11, color: MUTED, letterSpacing: 0.8, marginBottom: 12 }}>FROM</Text>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <TextInput style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 32, color: c.text, flex: 1, padding: 0 }} value={fromAmount} onChangeText={setFromAmount} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={MUTED} />
              <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: c.background, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7 }} onPress={() => { setShowFromPicker((v) => !v); setShowToPicker(false); }}>
                {fromStock && <LogoCircle symbol={fromStock.symbol} />}
                <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text }}>{fromStock?.symbol ?? "..."}</Text>
                <Svg width={16} height={16} viewBox="0 0 16 16" fill="none"><Path d="M4 6l4 4 4-4" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /></Svg>
              </TouchableOpacity>
            </View>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}>{fromStock?.name ?? ""} · {fromStock?.price ?? ""}/share</Text>
          </View>

          {showFromPicker && <PickerDropdown stockList={stocks.filter((s) => s.symbol !== toStock?.symbol)} onSelect={(s) => { setFromStock(s); setShowFromPicker(false); }} />}

          {/* Swap divider */}
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, gap: 12 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
            <TouchableOpacity onPress={handleSwap}><SwapIcon /></TouchableOpacity>
            <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
          </View>

          {/* To */}
          <View style={{ padding: 20 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 11, color: MUTED, letterSpacing: 0.8, marginBottom: 12 }}>TO</Text>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 32, color: TEAL, flex: 1 }}>{toAmount}</Text>
              <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: c.background, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7 }} onPress={() => { setShowToPicker((v) => !v); setShowFromPicker(false); }}>
                {toStock && <LogoCircle symbol={toStock.symbol} />}
                <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text }}>{toStock?.symbol ?? "..."}</Text>
                <Svg width={16} height={16} viewBox="0 0 16 16" fill="none"><Path d="M4 6l4 4 4-4" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /></Svg>
              </TouchableOpacity>
            </View>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}>{toStock?.name ?? ""} · {toStock?.price ?? ""}/share</Text>
          </View>

          {showToPicker && <PickerDropdown stockList={stocks.filter((s) => s.symbol !== fromStock?.symbol)} onSelect={(s) => { setToStock(s); setShowToPicker(false); }} />}
        </View>

        {/* Rate card */}
        <View style={{ backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 14, flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED }}>Exchange Rate</Text>
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: TEAL }}>
            1 {fromStock?.symbol ?? ""} = {fromStock && toPrice ? (fromPrice / toPrice).toFixed(4) : "0.0000"} {toStock?.symbol ?? ""}
          </Text>
        </View>

        {/* Summary */}
        <View style={{ backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, paddingHorizontal: 16, paddingVertical: 4 }}>
          {[{ label: "From", value: `${fromAmount || "0"} ${fromStock?.symbol ?? ""}`, color: c.text }, { label: "To", value: `${toAmount} ${toStock?.symbol ?? ""}`, color: GREEN }, { label: "Fee", value: "K0.00", color: c.text }].map((row, i, arr) => (
            <React.Fragment key={row.label}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 12 }}>
                <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED }}>{row.label}</Text>
                <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: row.color }}>{row.value}</Text>
              </View>
              {i < arr.length - 1 && <View style={{ height: 1, backgroundColor: c.border }} />}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 16, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.background }}>
        <TouchableOpacity style={{ backgroundColor: TEAL, borderRadius: 14, paddingVertical: 16, alignItems: "center" }} onPress={() => router.push("/trade/confirm" as any)}>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: WHITE }}>Exchange</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

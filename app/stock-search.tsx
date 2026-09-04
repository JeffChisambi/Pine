import { guardedBack, guardedPush } from "@/utils/navigation";
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { SearchIcon } from "@/components/icons/AppIcons";
import { getStockLogo } from "../utils/stock-logos";
import { useStocks, useStockSearch } from "../hooks/useStocks";
import { useColors } from "@/hooks/useColors";

const GREEN = "#45B369";
const RED = "#EF4770";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";


export default function StockSearchScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 16;
  const c = useColors();
  const [query, setQuery] = useState("");

  // Optional sector filter — the market screen's sector tiles navigate here
  // with ?sector=<name> to show that sector's stocks.
  const { sector } = useLocalSearchParams<{ sector?: string }>();

  const { data: allStocks = [], isLoading: allLoading } = useStocks();
  const { data: searchResults = [], isLoading: searching } = useStockSearch(query);

  const isQuerying = query.trim().length > 0;
  const baseList = isQuerying ? searchResults : allStocks;
  const displayList = sector
    ? baseList.filter((s) => (s.sector ?? "").toLowerCase() === String(sector).toLowerCase())
    : baseList;
  const isLoading = isQuerying ? searching : allLoading;

  return (
    <View style={{ flex: 1, backgroundColor: c.background, paddingTop: topPad }}>
      {/* Search bar row */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingBottom: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => guardedBack("/(tabs)")} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M15 19l-7-7 7-7" stroke={c.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <View style={{ flex: 1, height: 52, backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, gap: 10 }}>
          <SearchIcon color={query.length > 0 ? c.primary : MUTED} size={18} />
          <TextInput
            style={{ flex: 1, fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: c.text, height: "100%" }}
            placeholder="Search stocks…"
            placeholderTextColor={MUTED}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Circle cx={12} cy={12} r={10} fill={MUTED} />
                <Path d="M15 9L9 15M9 9L15 15" stroke={WHITE} strokeWidth={1.8} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!isQuerying && (
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 16, color: c.text, marginBottom: 12 }}>All MSE Stocks</Text>
        )}
        {isLoading && (
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: MUTED }}>Searching…</Text>
          </View>
        )}
        {!isLoading && isQuerying && displayList.length === 0 && (
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: MUTED }}>No results for "{query}"</Text>
          </View>
        )}
        {!isLoading && displayList.map((s, i) => (
          <TouchableOpacity
            key={s.id}
            style={[
              { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
              i < displayList.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border },
            ]}
            onPress={() => guardedPush(() => router.push(`/stock/${s.symbol}` as any))}
            activeOpacity={0.8}
          >
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.card, overflow: "hidden", borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center" }}>
              {getStockLogo(s.symbol) ? (
                <Image source={getStockLogo(s.symbol)!} style={{ width: 36, height: 36, borderRadius: 18 }} resizeMode="contain" />
              ) : (
                <View style={{ width: 48, height: 48, backgroundColor: c.primary, justifyContent: "center", alignItems: "center" }}>
                  <Text style={{ color: WHITE, fontFamily: "PlusJakartaSans_700Bold", fontSize: 10 }}>{s.symbol.slice(0, 3)}</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: c.text }}>{s.symbol}</Text>
              <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED, marginTop: 2 }} numberOfLines={1}>{s.name}</Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: c.text }}>{s.price}</Text>
              <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 12, color: s.positive ? GREEN : RED }}>{s.change}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { getStockLogo } from "../utils/stock-logos";

const TEAL = "#164951";
const GREEN = "#45B369";
const RED = "#EF4770";
const WHITE = "#FFFFFF";
const DARK = "#111827";
const MUTED = "#9CA3AF";
const CARD_BG = "#F9FAFB";
const CARD_BORDER = "#F3F4F6";

import { useStocks, useStockSearch } from "../hooks/useStocks";

function ArrowCircle({ positive }: { positive: boolean }) {
  const color = positive ? GREEN : RED;
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Circle cx={9} cy={9} r={9} fill={color} />
      {positive ? (
        <Path d="M5.5 10.5L9 7L12.5 10.5" stroke={WHITE} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <Path d="M5.5 7.5L9 11L12.5 7.5" stroke={WHITE} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      )}
    </Svg>
  );
}

function BackIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M9.57 5.93L3.5 12L9.57 18.07" stroke={DARK} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20.5 12H3.67" stroke={DARK} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon({ active }: { active?: boolean }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={7.5} stroke={active ? TEAL : MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16.5 16.5L20.5 20.5" stroke={active ? TEAL : MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function StockSearchScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 44;
  const [query, setQuery] = useState("");

  const { data: allStocks = [], isLoading: allLoading } = useStocks();
  const { data: searchResults = [], isLoading: searching } = useStockSearch(query);

  const isQuerying = query.trim().length > 0;
  const displayList = isQuerying ? searchResults : allStocks;
  const isLoading = isQuerying ? searching : allLoading;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Search bar row */}
      <View style={styles.searchRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <SearchIcon active={query.length > 0} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stocks, ETFs…"
            placeholderTextColor={MUTED}
            value={query}
            onChangeText={setQuery}
            autoFocus
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
        style={styles.results}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!isQuerying && (

          <Text style={styles.sectionLabel}>All MSE Stocks</Text>
        )}
        {isLoading && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Searching…</Text>
          </View>
        )}
        {!isLoading && isQuerying && displayList.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No results for "{query}"</Text>
          </View>
        )}
        {!isLoading && displayList.map((s, i) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.resultRow, i < displayList.length - 1 && styles.resultBorder]}
            onPress={() => router.push(`/stock/${s.symbol}` as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.stockLogo, { backgroundColor: WHITE, overflow: "hidden", borderWidth: 1, borderColor: "#E5E7EB" }]}>
              {getStockLogo(s.symbol) ? (
                <Image source={getStockLogo(s.symbol)!} style={{ width: 36, height: 36, borderRadius: 18 }} resizeMode="contain" />
              ) : (
                <View style={[styles.stockLogo, { backgroundColor: TEAL, justifyContent: "center", alignItems: "center" }]}>
                  <Text style={{ color: WHITE, fontFamily: "Poppins_700Bold", fontSize: 10 }}>
                    {s.symbol.slice(0, 3)}
                  </Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.tickerText}>{s.symbol}</Text>
              <Text style={styles.nameText} numberOfLines={1}>{s.name}</Text>
            </View>
            <View style={styles.priceSection}>
              <Text style={styles.priceText}>{s.price}</Text>
              <View style={styles.changeRow}>
                <ArrowCircle positive={s.positive} />
                <Text style={[styles.changeText, { color: s.positive ? GREEN : RED }]}>
                  {s.change}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flex: 1,
    height: 52,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: DARK,
    height: "100%",
  },
  results: {
    flex: 1,
    paddingHorizontal: 24,
  },
  sectionLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: DARK,
    marginBottom: 12,
  },
  empty: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: MUTED,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  resultBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  stockLogo: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: WHITE,
  },
  tickerText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: DARK,
  },
  nameText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  priceSection: {
    alignItems: "flex-end",
    gap: 4,
  },
  priceText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: DARK,
  },
  changeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  changeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
});

import React from "react";
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
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { getStockLogo } from "../../utils/stock-logos";

const TEAL = "#164951";
const GREEN = "#45B369";
const RED = "#EF4770";
const WHITE = "#FFFFFF";
const DARK = "#111827";
const MUTED = "#9CA3AF";
const CARD_BG = "#F9FAFB";
const CARD_BORDER = "#F3F4F6";
const DIVIDER = "#EBECEF";
const SECTOR_BG = "#F3F6F6";
const SECTOR_BORDER = "#D0DBDC";

import { useState } from "react";
import { useStocks } from "../../hooks/useStocks";
import { ApiStock } from "../../services/api";


function MiniChart({ path, fill, positive }: { path: string; fill: string; positive: boolean }) {
  const color = positive ? GREEN : RED;
  const fillId = positive ? "greenGrad" : "redGrad";
  return (
    <Svg width={92} height={50} viewBox="0 0 96 52">
      <Defs>
        <LinearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={GREEN} stopOpacity="0.3" />
          <Stop offset="100%" stopColor={GREEN} stopOpacity="0" />
        </LinearGradient>
        <LinearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={RED} stopOpacity="0.3" />
          <Stop offset="100%" stopColor={RED} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={fill} fill={`url(#${fillId})`} />
      <Path d={path} stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

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

function SearchIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={7.5} stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16.5 16.5L20.5 20.5" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BellIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12.02 2.91C8.71 2.91 6.02 5.6 6.02 8.91V11.8C6.02 12.41 5.76 13.34 5.45 13.86L4.3 15.77C3.59 16.95 4.08 18.26 5.38 18.7C9.69 20.14 14.34 20.14 18.65 18.7C19.86 18.3 20.39 16.87 19.73 15.77L18.58 13.86C18.28 13.34 18.02 12.41 18.02 11.8V8.91C18.02 5.61 15.32 2.91 12.02 2.91Z" stroke={DARK} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" />
      <Path d="M13.87 3.2C13.56 3.11 13.24 3.04 12.91 3C11.95 2.88 11.03 2.95 10.17 3.2C10.46 2.46 11.18 1.94 12.02 1.94C12.86 1.94 13.58 2.46 13.87 3.2Z" stroke={DARK} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15.02 19.06C15.02 20.71 13.67 22.06 12.02 22.06C11.2 22.06 10.44 21.72 9.9 21.18C9.36 20.64 9.02 19.88 9.02 19.06" stroke={DARK} strokeWidth={1.5} strokeMiterlimit={10} />
    </Svg>
  );
}

function FilterIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M22 6.5H16" stroke={DARK} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 6.5H2" stroke={DARK} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 10C11.933 10 13.5 8.433 13.5 6.5C13.5 4.567 11.933 3 10 3C8.067 3 6.5 4.567 6.5 6.5C6.5 8.433 8.067 10 10 10Z" stroke={DARK} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 17.5H18" stroke={DARK} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 17.5H2" stroke={DARK} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 21C15.933 21 17.5 19.433 17.5 17.5C17.5 15.567 15.933 14 14 14C12.067 14 10.5 15.567 10.5 17.5C10.5 19.433 12.067 21 14 21Z" stroke={DARK} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StockLogo({ symbol }: { symbol: string }) {
  const logo = getStockLogo(symbol);
  if (logo) {
    return (
      <View style={styles.logoCircle}>
        <Image source={logo} style={styles.logoImage} resizeMode="contain" />
      </View>
    );
  }
  const colors = ["#164951", "#1A3A6B", "#166534", "#7C3AED", "#B45309", "#BE185D"];
  const bg = colors[symbol.charCodeAt(0) % colors.length];
  return (
    <View style={[styles.logoCircle, { backgroundColor: bg }]}>
      <Text style={{ color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 11 }}>
        {symbol.slice(0, 3)}
      </Text>
    </View>
  );
}

function StockLogoSmall({ symbol }: { symbol: string }) {
  const logo = getStockLogo(symbol);
  if (logo) {
    return (
      <View style={styles.logoCircleSmall}>
        <Image source={logo} style={{ width: 28, height: 28, borderRadius: 14 }} resizeMode="contain" />
      </View>
    );
  }
  const colors = ["#164951", "#1A3A6B", "#166534", "#7C3AED", "#B45309", "#BE185D"];
  const bg = colors[symbol.charCodeAt(0) % colors.length];
  return (
    <View style={[styles.logoCircleSmall, { backgroundColor: bg, justifyContent: "center", alignItems: "center" }]}>
      <Text style={{ color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 9 }}>
        {symbol.slice(0, 3)}
      </Text>
    </View>
  );
}

export default function MarketScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 44;
  const [searchText, setSearchText] = useState("");

  const { data: stocks = [], isLoading, error, refetch, isRefetching } = useStocks();

  // Top 4 stocks shown as "index" cards
  const featuredStocks = stocks.slice(0, 4);
  // Remaining stocks in list
  const allStocks = stocks;

  return (
    <ScrollView
      style={[styles.container, { paddingTop: topPad }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Market</Text>
      </View>

      {/* Search bar */}
      <TouchableOpacity
        style={styles.searchBar}
        activeOpacity={0.8}
        onPress={() => router.push("/stock-search")}
      >
        <SearchIcon />
        <Text style={styles.searchPlaceholder}>Search stocks, ETFs…</Text>
      </TouchableOpacity>

      {/* Featured cards */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Stocks</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.indicesScroll}>
        {isLoading ? (
          <View style={{ width: 300, paddingVertical: 24, alignItems: "center" }}>
            <Text style={{ color: MUTED, fontFamily: "Poppins_400Regular" }}>Loading market data…</Text>
          </View>
        ) : error ? (
          <View style={{ width: 300, paddingVertical: 24, alignItems: "center" }}>
            <Text style={{ color: RED, fontFamily: "Poppins_400Regular" }}>Could not load prices</Text>
          </View>
        ) : (
          featuredStocks.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={styles.indexCard}
              onPress={() => router.push(`/stock/${s.symbol}` as any)}
              activeOpacity={0.85}
            >
              <View style={styles.indexCardTop}>
                <StockLogoSmall symbol={s.symbol} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.indexName}>{s.symbol}</Text>
                  <Text style={styles.indexFull} numberOfLines={1}>{s.name}</Text>
                </View>
              </View>
              <View style={styles.indexCardBottom}>
                <View>
                  <Text style={styles.indexPrice}>{s.price}</Text>
                  <View style={styles.indexChangeRow}>
                    <ArrowCircle positive={s.positive} />
                    <Text style={[styles.indexChange, { color: s.positive ? GREEN : RED }]}>
                      {s.change}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* All Stocks list */}
      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Text style={styles.sectionTitle}>All Stocks</Text>
        {isRefetching && <Text style={{ color: MUTED, fontSize: 11, fontFamily: "Poppins_400Regular" }}>Refreshing…</Text>}
      </View>

      {isLoading ? (
        Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={[styles.stockRow, styles.stockRowBorder, { opacity: 0.4 }]}>
            <View style={[styles.logoCircle, { backgroundColor: CARD_BORDER }]} />
            <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
              <View style={{ height: 14, width: 60, backgroundColor: CARD_BORDER, borderRadius: 4 }} />
              <View style={{ height: 11, width: 120, backgroundColor: CARD_BORDER, borderRadius: 4 }} />
            </View>
            <View style={{ alignItems: "flex-end", gap: 6 }}>
              <View style={{ height: 14, width: 80, backgroundColor: CARD_BORDER, borderRadius: 4 }} />
              <View style={{ height: 11, width: 50, backgroundColor: CARD_BORDER, borderRadius: 4 }} />
            </View>
          </View>
        ))
      ) : error ? (
        <View style={{ paddingVertical: 48, alignItems: "center" }}>
          <Text style={{ color: RED, fontFamily: "Poppins_500Medium" }}>Backend unreachable</Text>
          <Text style={{ color: MUTED, fontFamily: "Poppins_400Regular", fontSize: 12, marginTop: 4 }}>Make sure the server is running</Text>
          <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: TEAL, borderRadius: 8 }}>
            <Text style={{ color: WHITE, fontFamily: "Poppins_600SemiBold" }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        allStocks.map((s, i) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.stockRow, i < allStocks.length - 1 && styles.stockRowBorder]}
            onPress={() => router.push(`/stock/${s.symbol}` as any)}
            activeOpacity={0.8}
          >
            <StockLogo symbol={s.symbol} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.stockTicker}>{s.symbol}</Text>
              <Text style={styles.stockName} numberOfLines={1}>{s.name}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.stockPrice}>{s.price}</Text>
              <Text style={[styles.stockChange, { color: s.positive ? GREEN : RED }]}>{s.change}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: DARK,
  },
  headerIcons: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: CARD_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    marginHorizontal: 24,
    height: 56,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
  },
  searchPlaceholder: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: MUTED,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: DARK,
  },

  indicesScroll: {
    paddingLeft: 24,
    paddingRight: 8,
    gap: 12,
  },
  indexCard: {
    width: 220,
    height: 130,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 14,
    justifyContent: "space-between",
  },
  indexCardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoCircleSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  logoImageSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  indexName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: DARK,
  },
  indexFull: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: MUTED,
    marginTop: 1,
  },
  indexCardBottom: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  indexPrice: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: DARK,
    marginBottom: 4,
  },
  indexChangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  indexChange: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },
  sectorsScroll: {
    paddingLeft: 24,
    paddingRight: 8,
    gap: 16,
  },
  sectorItem: {
    alignItems: "center",
    gap: 8,
    width: 70,
  },
  sectorCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: SECTOR_BG,
    borderWidth: 1,
    borderColor: SECTOR_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  sectorLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: DARK,
    textAlign: "center",
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 24,
    paddingVertical: 14,
  },
  stockRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  stockTicker: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: DARK,
  },
  stockName: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  stockPrice: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: DARK,
  },
  stockChange: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    marginTop: 2,
  },
});

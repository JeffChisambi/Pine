import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path, Circle, Line, Defs, ClipPath, Rect } from "react-native-svg";
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

import { useState } from "react";
import { useStocks } from "../../hooks/useStocks";



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

// Sparkline paths normalized from the SVG card design (viewBox 0 0 88 52)
// Reference midline sits at y=26. Higher y = lower on chart.
const SPARKLINES_UP = [
  "M0.5 25 L5 17 L7 20 L10 13 L15 8 L17 37 L19 31 H30 L33 21 L35 23 L37 15 L40 18 L44 19 L47 28 L51 0 L52 9 L55 12 L56 21 L58 16 H63 L64 33 L66 36 L68 52 L70 44 L72 42 L73 36 L76 34 L77 28 L80 27 L82 19 L84 22 H88",
  "M0 30 L8 25 L15 28 L20 20 L28 15 L35 18 L40 10 L47 15 L54 8 L58 5 L65 12 L70 8 L76 18 L82 12 L88 8",
];
const SPARKLINES_DOWN = [
  "M0 10 L8 15 L15 12 L20 22 L28 28 L35 25 L40 35 L47 30 L54 40 L58 45 L65 38 L70 44 L76 36 L82 42 L88 48",
  "M0 5 L8 12 L15 10 L20 18 L28 25 L35 22 L40 30 L44 24 L50 35 L58 42 L65 38 L70 45 L76 40 L82 46 L88 52",
];

function MiniSparkline({ positive, idx }: { positive: boolean; idx: number }) {
  const paths = positive ? SPARKLINES_UP : SPARKLINES_DOWN;
  const path = paths[idx % paths.length];
  const topId = `clip-top-${idx}`;
  const botId = `clip-bot-${idx}`;
  return (
    <Svg width={88} height={52} viewBox="0 0 88 52" fill="none">
      <Defs>
        {/* Upper half — above the midline */}
        <ClipPath id={topId}>
          <Rect x="0" y="0" width="88" height="26" />
        </ClipPath>
        {/* Lower half — below the midline */}
        <ClipPath id={botId}>
          <Rect x="0" y="26" width="88" height="26" />
        </ClipPath>
      </Defs>

      {/* Dashed midline */}
      <Line x1="0" y1="26" x2="88" y2="26" stroke="#D1D5DB" strokeWidth={1} strokeDasharray="3 3" strokeLinecap="round" />

      {/* Above midline → red */}
      <Path d={path} stroke={RED} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" clipPath={`url(#${topId})`} />
      {/* Below midline → green */}
      <Path d={path} stroke={GREEN} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" clipPath={`url(#${botId})`} />
    </Svg>
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

  // Stock Features: representative sample of stocks for the featured cards
  const stockFeatures = stocks.slice(0, 6);

  // All stocks list
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

      {/* Stock Features cards */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Stock Features</Text>
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
        ) : stockFeatures.length === 0 ? (
          <View style={{ width: 300, paddingVertical: 24, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: MUTED, fontFamily: "Poppins_400Regular", fontSize: 13 }}>
              No stocks available
            </Text>
          </View>
        ) : (
          stockFeatures.map((s, idx) => (
            <TouchableOpacity
              key={s.id}
              style={styles.featureCard}
              onPress={() => router.push(`/stock/${s.symbol}` as any)}
              activeOpacity={0.85}
            >
              {/* Top: logo + symbol + name */}
              <View style={styles.featureCardTop}>
                <StockLogoSmall symbol={s.symbol} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.featureSymbol}>{s.symbol}</Text>
                  <Text style={styles.featureName} numberOfLines={1}>{s.name}</Text>
                </View>
              </View>

              {/* Bottom: price + change (left) · sparkline (right) */}
              <View style={styles.featureCardBottom}>
                <View style={styles.featureCardLeft}>
                  <Text style={styles.featurePrice}>{s.price}</Text>
                  <View style={styles.featureChangeRow}>
                    <ArrowCircle positive={s.positive} />
                    <Text style={[styles.featureChange, { color: s.positive ? GREEN : RED }]}>
                      {s.changePct > 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                    </Text>
                  </View>
                </View>
                <MiniSparkline positive={s.positive} idx={idx} />
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
  /* Feature card — matches SVG design (240×134) */
  featureCard: {
    width: 240,
    height: 134,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: "space-between",
  },
  featureCardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureSymbol: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: DARK,
  },
  featureName: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: MUTED,
    marginTop: 1,
  },
  featureCardBottom: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  featureCardLeft: {
    flex: 1,
  },
  featurePrice: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: DARK,
    marginBottom: 5,
  },
  featureChangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  featureChange: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
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

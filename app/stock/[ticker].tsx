import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Svg, {
  Path,
  Circle,
  Line,
  Defs,
  LinearGradient,
  Stop,
  Rect,
} from "react-native-svg";
import { useStockDetail } from "../../hooks/useStocks";
import { getStockLogo } from "../../utils/stock-logos";

const TEAL = "#164951";
const CARD_TEAL = "#2D5B62";
const BORDER_TEAL = "#739297";
const GREEN = "#45B369";
const RED = "#EF4770";
const WHITE = "#FFFFFF";
const DARK = "#111827";
const MUTED = "#9CA3AF";
const SECTION_BG = "#F3F6F6";
const DIVIDER = "#EBECEF";

const { width: SCREEN_W } = Dimensions.get("window");


const TIME_TABS = ["2D", "1W", "1M", "3M", "6M", "1Y"];
const DETAIL_TABS = ["Options", "Stock", "Holdings", "PR"];

// Chart path data (viewport 0 0 375 238, chart area from design screen 32)
const CHART_LINE =
  "M72 89C87 89 88 128 103 128.5C118 129 114 109.312 120.5 108.5C126.5 107.75 125 95 131 95C137 95 136.5 108 140.5 110.5C144.5 113 149 154 156.5 154.5C164 155 162 131.5 171.5 128.5C181 125.5 179.5 114.5 182.5 114.5C185.5 114.5 185.5 120 188 121.5C190.5 123 187 132.5 193 133.5C204 136.5 208 62 219.5 62.5C226 62.783 224.5 71.5 231 74C237.5 76.5 234.5 91 239 93C243.5 95 241 108 248 108C255 108 259.5 83.7 267.5 84.5C275 85.25 280 76 286 76";
const CHART_FILL =
  "M103 128.5C88 128 87 89 72 89V187H286V76C280 76 275 85.25 267.5 84.5C259.5 83.7 255 108 248 108C241 108 243.5 95 239 93C234.5 91 237.5 76.5 231 74C224.5 71.5 226 62.783 219.5 62.5C208 62 204 136.5 193 133.5C187 132.5 190.5 123 188 121.5C185.5 120 185.5 114.5 182.5 114.5C179.5 114.5 181 125.5 171.5 128.5C162 131.5 164 155 156.5 154.5C149 154 144.5 113 140.5 110.5C136.5 108 137 95 131 95C125 95 126.5 107.75 120.5 108.5C114 109.312 118 129 103 128.5Z";
const CHART_DOWN_LINE =
  "M72 89C87 89 88 128 103 128.5C118 129 119 135 125 140C131 145 136.5 108 140.5 110.5C144.5 113 149 154 156.5 154.5C164 155 162 131.5 171.5 128.5C178 126 180 130 185 135C190 140 192 148 196 150C200 152 208 62 219.5 62.5C226 62.783 236 85 243 88C250 91 255 83.7 267.5 84.5C275 85.25 280 76 286 76";

function BackIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.57 5.93L3.5 12L9.57 18.07"
        stroke={WHITE}
        strokeWidth={1.5}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20.5 12H3.67"
        stroke={WHITE}
        strokeWidth={1.5}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BookmarkIcon({ filled }: { filled?: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16.82 2H7.18C5.05 2 3.32 3.74 3.32 5.86V19.95C3.32 21.75 4.61 22.51 6.19 21.64L11.07 18.93C11.59 18.64 12.43 18.64 12.94 18.93L17.82 21.64C19.4 22.52 20.69 21.76 20.69 19.95V5.86C20.68 3.74 18.95 2 16.82 2Z"
        stroke={WHITE}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={filled ? WHITE : "none"}
      />
    </Svg>
  );
}

function UpDownIcon({ positive }: { positive: boolean }) {
  const color = positive ? GREEN : RED;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={12} fill={color} />
      {positive ? (
        <Path
          d="M8 13.5L12 9.5L16 13.5"
          stroke={WHITE}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <Path
          d="M8 10.5L12 14.5L16 10.5"
          stroke={WHITE}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </Svg>
  );
}

function PriceChart({ positive }: { positive: boolean }) {
  const chartW = SCREEN_W;
  const chartH = 190;
  const viewW = 375;
  const viewH = 200;
  const lineColor = positive ? GREEN : RED;
  const lineData = positive ? CHART_LINE : CHART_DOWN_LINE;
  const fillData = positive ? CHART_FILL : CHART_FILL;

  return (
    <View style={{ width: chartW, height: chartH }}>
      <Svg
        width={chartW}
        height={chartH}
        viewBox={`0 20 375 170`}
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={lineColor} stopOpacity="0.35" />
            <Stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>
        {/* Horizontal grid lines */}
        {[62, 89, 116, 143, 170].map((y) => (
          <Line
            key={y}
            x1={72}
            y1={y}
            x2={350}
            y2={y}
            stroke={CARD_TEAL}
            strokeWidth={0.8}
            strokeDasharray="3 3"
            strokeLinecap="round"
          />
        ))}
        {/* Vertical separator at peak */}
        <Line
          x1={286}
          y1={62}
          x2={286}
          y2={187}
          stroke={GREEN}
          strokeWidth={0.8}
          strokeDasharray="3 3"
          strokeLinecap="round"
        />
        {/* Fill area */}
        <Path d={fillData} fill="url(#chartFill)" />
        {/* Chart line */}
        <Path
          d={lineData}
          stroke={lineColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Peak dot */}
        <Circle cx={286} cy={76} r={4} fill={TEAL} stroke={WHITE} strokeWidth={2} />
      </Svg>
    </View>
  );
}

function DetailTooltip() {
  return (
    <View style={styles.tooltip}>
      <Text style={styles.tooltipLabel}>+ K14.32</Text>
      <Text style={styles.tooltipSub}>Aug 12, 2024</Text>
    </View>
  );
}

export default function StockDetailScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 44;
  const { ticker } = useLocalSearchParams<{ ticker: string }>();
  const [activeTimeTab, setActiveTimeTab] = useState("1M");
  const [activeDetailTab, setActiveDetailTab] = useState("Overview");
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  const WATCHLIST_KEY = "@pine_watchlist_tickers";
  const MAX_WATCHLIST = 4;

  const { data: stock, isLoading, error, refetch } = useStockDetail(ticker);

  // Check if this stock is in watchlist
  useEffect(() => {
    AsyncStorage.getItem(WATCHLIST_KEY)
      .then((val) => {
        if (val) {
          const tickers: string[] = JSON.parse(val);
          setIsInWatchlist(tickers.includes(ticker?.toUpperCase()));
        }
      })
      .catch(() => {});
  }, [ticker]);

  const toggleWatchlist = async () => {
    try {
      const val = await AsyncStorage.getItem(WATCHLIST_KEY);
      const tickers: string[] = val ? JSON.parse(val) : [];
      const sym = ticker?.toUpperCase();

      if (tickers.includes(sym)) {
        // Remove
        const next = tickers.filter((t) => t !== sym);
        await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
        setIsInWatchlist(false);
      } else {
        // Add — check limit
        if (tickers.length >= MAX_WATCHLIST) {
          Alert.alert("Watchlist Full", `You can only add up to ${MAX_WATCHLIST} stocks to your watchlist. Remove one first.`);
          return;
        }
        const next = [...tickers, sym];
        await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
        setIsInWatchlist(true);
      }
    } catch {}
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: topPad, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={TEAL} />
        <Text style={{ color: MUTED, marginTop: 12, fontFamily: "Poppins_400Regular" }}>Loading {ticker}…</Text>
      </View>
    );
  }

  if (error || !stock) {
    return (
      <View style={[styles.container, { paddingTop: topPad, alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: RED, fontFamily: "Poppins_600SemiBold", fontSize: 16 }}>Could not load {ticker}</Text>
        <Text style={{ color: MUTED, fontFamily: "Poppins_400Regular", marginTop: 4 }}>Check your connection</Text>
        <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 16, backgroundColor: TEAL, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 }}>
          <Text style={{ color: "#fff", fontFamily: "Poppins_600SemiBold" }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Build stats from API data
  const stats = [
    { label: "Open", value: stock.openPrice },
    { label: "High", value: stock.highPrice },
    { label: "Low", value: stock.lowPrice },
    { label: "Volume", value: stock.volume },
    ...(stock.listedShares ? [{ label: "Listed Shares", value: stock.listedShares }] : []),
    ...(stock.description ? [{ label: "Sector", value: stock.sector }] : [{ label: "Sector", value: stock.sector }]),
  ];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      stickyHeaderIndices={[0]}
    >
      {/* Dark teal top section */}
      <View style={[styles.topSection, { paddingTop: topPad }]}>
        {/* Navigation bar */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.navTitle}>{stock.symbol}</Text>
          <TouchableOpacity style={styles.navBtn} onPress={toggleWatchlist}>
            <BookmarkIcon filled={isInWatchlist} />
          </TouchableOpacity>
        </View>

        {/* Stock card */}
        <View style={styles.stockCard}>
          <View style={styles.stockCardLeft}>
            <View style={[styles.stockLogoCircle, { backgroundColor: CARD_TEAL, overflow: "hidden" }]}>
              {getStockLogo(stock.symbol) ? (
                <Image source={getStockLogo(stock.symbol)!} style={{ width: 40, height: 40, borderRadius: 20 }} resizeMode="contain" />
              ) : (
                <Text style={styles.stockLogoText}>{stock.symbol.slice(0, 3)}</Text>
              )}
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.stockCardName}>{stock.symbol}</Text>
              <Text style={styles.stockCardFull} numberOfLines={1}>{stock.name}</Text>
            </View>
          </View>
          <View style={styles.stockCardRight}>
            <Text style={styles.stockCardPrice}>{stock.price}</Text>
            <View style={styles.stockCardChangeRow}>
              <UpDownIcon positive={stock.positive} />
              <Text style={[styles.stockCardChangePct, { color: stock.positive ? GREEN : RED }]}>
                {stock.change}
              </Text>
            </View>
          </View>
        </View>

        {/* Price chart */}
        <PriceChart positive={stock.positive} />

        {/* Tooltip above chart */}
        <View style={styles.tooltipWrapper}>
          <DetailTooltip />
        </View>

        {/* Time tabs */}
        <View style={styles.timeTabs}>
          {TIME_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.timeTab, activeTimeTab === tab && styles.timeTabActive]}
              onPress={() => setActiveTimeTab(tab)}
            >
              <Text style={[styles.timeTabText, activeTimeTab === tab && styles.timeTabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* White bottom section */}
      <View style={styles.bottomSection}>
        {/* Detail tabs */}
        <View style={styles.detailTabs}>
          {DETAIL_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.detailTab, activeDetailTab === tab && styles.detailTabActive]}
              onPress={() => setActiveDetailTab(tab)}
            >
              <Text style={[styles.detailTabText, activeDetailTab === tab && styles.detailTabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats table */}
        <View style={styles.statsTable}>
          {stats.map((stat, i) => (
            <View key={stat.label}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
              </View>
              {i < stats.length - 1 && <View style={styles.statDivider} />}
            </View>
          ))}
        </View>



        {/* Buy button */}
        <View style={styles.buySection}>
          <TouchableOpacity
            style={[styles.buyBtn, { backgroundColor: stock.positive ? GREEN : RED }]}
            activeOpacity={0.85}
          >
            <Text style={styles.buyBtnText}>
              {stock.positive ? "Buy Now" : "Sell Now"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  topSection: {
    backgroundColor: TEAL,
    paddingBottom: 0,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  navBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: WHITE,
  },
  stockCard: {
    marginHorizontal: 24,
    backgroundColor: CARD_TEAL,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: BORDER_TEAL,
  },
  stockCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  stockLogoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  stockLogoText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    color: WHITE,
  },
  stockCardName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: WHITE,
  },
  stockCardFull: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
    maxWidth: 140,
  },
  stockCardRight: {
    alignItems: "flex-end",
  },
  stockCardPrice: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: WHITE,
    marginBottom: 6,
  },
  stockCardChangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stockCardChangePct: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
  tooltipWrapper: {
    position: "absolute",
    right: 24 + 80,
    top: 175,
  },
  tooltip: {
    backgroundColor: CARD_TEAL,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 0.5,
    borderColor: BORDER_TEAL,
  },
  tooltipLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: WHITE,
  },
  tooltipSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },
  timeTabs: {
    flexDirection: "row",
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 0,
    backgroundColor: CARD_TEAL,
    borderRadius: 10,
    padding: 4,
    gap: 2,
  },
  timeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 7,
  },
  timeTabActive: {
    backgroundColor: WHITE,
  },
  timeTabText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
  },
  timeTabTextActive: {
    color: TEAL,
    fontFamily: "Poppins_600SemiBold",
  },
  bottomSection: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingTop: 0,
  },
  detailTabs: {
    flexDirection: "row",
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 20,
    gap: 8,
  },
  detailTab: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DIVIDER,
  },
  detailTabActive: {
    backgroundColor: TEAL,
    borderColor: TEAL,
  },
  detailTabText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: MUTED,
  },
  detailTabTextActive: {
    color: WHITE,
    fontFamily: "Poppins_600SemiBold",
  },
  statsTable: {
    marginHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DIVIDER,
    overflow: "hidden",
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  statLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: MUTED,
  },
  statValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: DARK,
  },
  statDivider: {
    height: 1,
    backgroundColor: DIVIDER,
    marginHorizontal: 0,
  },

  buySection: {
    marginHorizontal: 24,
    marginTop: 24,
  },
  buyBtn: {
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buyBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: WHITE,
  },
});

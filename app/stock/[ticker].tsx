import React, { useState, useEffect, useCallback } from "react";
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
} from "react-native-svg";
import { useStockDetail } from "../../hooks/useStocks";
import { getStockLogo } from "../../utils/stock-logos";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const TEAL = "#164951";
const CARD_TEAL = "#2D5B62";
const BORDER_TEAL = "#739297";
const GREEN = "#45B369";
const RED = "#EF4770";
const WHITE = "#FFFFFF";
const DARK = "#111827";
const MUTED = "#9CA3AF";
const DIVIDER = "#EBECEF";

const { width: SCREEN_W } = Dimensions.get("window");

// ─── Period tabs (matching MSE website exactly) ─────────────────────────────────
const TIME_TABS = ["1M", "3M", "6M", "1Y", "2Y", "5Y"] as const;
type TimePeriod = typeof TIME_TABS[number];

const DETAIL_TABS = ["Options", "Stock", "Holdings", "PR"] as const;

// ─── Icons ─────────────────────────────────────────────────────────────────────
function BackIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.57 5.93L3.5 12L9.57 18.07"
        stroke={WHITE} strokeWidth={1.5} strokeMiterlimit={10}
        strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        d="M20.5 12H3.67"
        stroke={WHITE} strokeWidth={1.5} strokeMiterlimit={10}
        strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

function BookmarkIcon({ filled }: { filled?: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16.82 2H7.18C5.05 2 3.32 3.74 3.32 5.86V19.95C3.32 21.75 4.61 22.51 6.19 21.64L11.07 18.93C11.59 18.64 12.43 18.64 12.94 18.93L17.82 21.64C19.4 22.52 20.69 21.76 20.69 19.95V5.86C20.68 3.74 18.95 2 16.82 2Z"
        stroke={WHITE} strokeWidth={1.5} strokeLinecap="round"
        strokeLinejoin="round" fill={filled ? WHITE : "none"}
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
        <Path d="M8 13.5L12 9.5L16 13.5" stroke={WHITE} strokeWidth={1.8}
          strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <Path d="M8 10.5L12 14.5L16 10.5" stroke={WHITE} strokeWidth={1.8}
          strokeLinecap="round" strokeLinejoin="round" />
      )}
    </Svg>
  );
}

// ─── Real price chart component ────────────────────────────────────────────────
interface PricePoint {
  date: string;
  close: number;
  volume: number;
  changePct: number | null;
}

interface PriceChartProps {
  data: PricePoint[];
  positive: boolean;
  period: string;
}

const CHART_H = 200;
const TOOLTIP_W = 196;

function PriceChart({ data, positive, period }: PriceChartProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const padL = 0;
  const padR = 0;
  const padTop = 12;
  const padBottom = 4;

  const lineColor = positive ? "#3DDC7F" : RED;
  const glowColor = positive ? "#3DDC7F" : RED;

  if (!data || data.length < 2) {
    return (
      <View style={{ width: SCREEN_W, height: CHART_H, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "rgba(255,255,255,0.35)", fontFamily: "Poppins_400Regular", fontSize: 12 }}>
          Insufficient data for this period
        </Text>
      </View>
    );
  }

  const prices = data.map((d) => d.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const plotW = SCREEN_W - padL - padR;
  const plotH = CHART_H - padTop - padBottom;

  function xFor(i: number) {
    return padL + (i / (data.length - 1)) * plotW;
  }
  function yFor(price: number) {
    return padTop + (1 - (price - minPrice) / priceRange) * plotH;
  }

  // SVG paths
  const lineParts = data.map((d, i) =>
    `${i === 0 ? "M" : "L"}${xFor(i).toFixed(1)},${yFor(d.close).toFixed(1)}`
  );
  const linePath = lineParts.join(" ");
  const fillPath =
    linePath +
    ` L${xFor(data.length - 1).toFixed(1)},${CHART_H}` +
    ` L${xFor(0).toFixed(1)},${CHART_H} Z`;

  // Active point
  const activePt = selectedIdx !== null ? data[selectedIdx] : data[data.length - 1];
  const activeX = selectedIdx !== null ? xFor(selectedIdx) : xFor(data.length - 1);
  const activeY = yFor(activePt.close);

  const formatPrice = (p: number) =>
    `MWK ${p.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Tooltip: centre on crosshair, clamp to screen
  const tooltipLeft = Math.max(12, Math.min(SCREEN_W - TOOLTIP_W - 12, activeX - TOOLTIP_W / 2));
  const changePct = activePt.changePct ?? 0;
  const changePositive = changePct >= 0;

  const handleTouch = useCallback((evt: any) => {
    const touchX = evt?.nativeEvent?.locationX ?? 0;
    const ratio = Math.max(0, Math.min(1, touchX / plotW));
    setSelectedIdx(Math.round(ratio * (data.length - 1)));
  }, [data.length, plotW]);

  const handleTouchEnd = useCallback(() => setSelectedIdx(null), []);

  return (
    <View style={{ width: SCREEN_W, height: CHART_H + 64 }}>

      {/* ── Floating pill tooltip ─────────────────────────── */}
      <View style={[styles.floatingTooltip, { left: tooltipLeft }]}>
        <Text style={styles.tooltipPrice}>{formatPrice(activePt.close)}</Text>
        <View style={[
          styles.tooltipBadge,
          { backgroundColor: changePositive ? "rgba(61,220,127,0.18)" : "rgba(239,71,112,0.18)" },
        ]}>
          <Text style={[styles.tooltipBadgeText, { color: changePositive ? "#3DDC7F" : RED }]}>
            {changePositive ? "+" : ""}{changePct.toFixed(2)}%
          </Text>
        </View>
      </View>

      {/* ── Chart ────────────────────────────────────────── */}
      <View
        style={{ width: SCREEN_W, height: CHART_H, marginTop: 44 }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleTouch}
        onResponderMove={handleTouch}
        onResponderRelease={handleTouchEnd}
      >
        <Svg width={SCREEN_W} height={CHART_H}>
          <Defs>
            {/* Rich 3-stop gradient: strong at top, invisible at bottom */}
            <LinearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%"   stopColor={glowColor} stopOpacity="0.55" />
              <Stop offset="60%"  stopColor={glowColor} stopOpacity="0.1"  />
              <Stop offset="100%" stopColor={glowColor} stopOpacity="0"    />
            </LinearGradient>
          </Defs>

          {/* Fill */}
          <Path d={fillPath} fill="url(#chartFill)" />

          {/* Line */}
          <Path
            d={linePath}
            stroke={lineColor}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Dashed vertical crosshair */}
          <Line
            x1={activeX} y1={padTop}
            x2={activeX} y2={padTop + plotH}
            stroke="rgba(255,255,255,0.6)"
            strokeWidth={1}
            strokeDasharray="3 4"
          />

          {/* Glow halos (outermost → innermost) */}
          <Circle cx={activeX} cy={activeY} r={18} fill={glowColor} opacity={0.07} />
          <Circle cx={activeX} cy={activeY} r={11} fill={glowColor} opacity={0.14} />

          {/* White dot with coloured core */}
          <Circle cx={activeX} cy={activeY} r={5.5} fill={WHITE} />
          <Circle cx={activeX} cy={activeY} r={3}   fill={lineColor} />
        </Svg>
      </View>
    </View>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────────
export default function StockDetailScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 44;
  const { ticker } = useLocalSearchParams<{ ticker: string }>();

  const [activeTimeTab, setActiveTimeTab] = useState<TimePeriod>("1M");
  const [activeDetailTab, setActiveDetailTab] = useState("Stock");
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  const WATCHLIST_KEY = "@pine_watchlist_tickers";
  const MAX_WATCHLIST = 4;

  // Pass the active period to the hook so data re-fetches on tab change
  const { data: stock, isLoading, error, refetch } = useStockDetail(ticker, activeTimeTab);

  // Watchlist
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
        const next = tickers.filter((t) => t !== sym);
        await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
        setIsInWatchlist(false);
      } else {
        if (tickers.length >= MAX_WATCHLIST) {
          Alert.alert(
            "Watchlist Full",
            `You can only add up to ${MAX_WATCHLIST} stocks to your watchlist. Remove one first.`
          );
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
        <ActivityIndicator size="large" color={GREEN} />
        <Text style={{ color: MUTED, marginTop: 12, fontFamily: "Poppins_400Regular" }}>
          Loading {ticker}…
        </Text>
      </View>
    );
  }

  if (error || !stock) {
    return (
      <View style={[styles.container, { paddingTop: topPad, alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: RED, fontFamily: "Poppins_600SemiBold", fontSize: 16 }}>
          Could not load {ticker}
        </Text>
        <Text style={{ color: MUTED, fontFamily: "Poppins_400Regular", marginTop: 4 }}>
          Check your connection
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          style={{ marginTop: 16, backgroundColor: TEAL, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 }}
        >
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
    { label: "Sector", value: stock.sector },
  ];

  const chartData: PricePoint[] = stock.priceHistory.map((h) => ({
    date: h.date,
    close: h.close,
    volume: h.volume,
    changePct: h.changePct ?? null,
  }));

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      stickyHeaderIndices={[0]}
    >
      {/* ── Dark teal top section ─────────────────────────────── */}
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

        {/* Stock info card */}
        <View style={styles.stockCard}>
          <View style={styles.stockCardLeft}>
            <View style={[styles.stockLogoCircle, { backgroundColor: CARD_TEAL, overflow: "hidden" }]}>
              {getStockLogo(stock.symbol) ? (
                <Image
                  source={getStockLogo(stock.symbol)!}
                  style={{ width: 40, height: 40, borderRadius: 20 }}
                  resizeMode="contain"
                />
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

        {/* Real price chart */}
        <View style={{ marginTop: 8 }}>
          <PriceChart
            data={chartData}
            positive={stock.positive}
            period={activeTimeTab}
          />
        </View>

        {/* Period selector tabs — below the chart */}
        <View style={styles.periodTabsRow}>
          {TIME_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.periodTab, activeTimeTab === tab && styles.periodTabActive]}
              onPress={() => setActiveTimeTab(tab)}
              activeOpacity={0.75}
            >
              <Text style={[styles.periodTabText, activeTimeTab === tab && styles.periodTabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── White bottom section ──────────────────────────────── */}
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

        {/* MSE attribution badge */}
        <View style={styles.mseBadge}>
          <Text style={styles.mseBadgeText}>
            Data sourced from Malawi Stock Exchange · MSE
          </Text>
          {stock.lastUpdated && (
            <Text style={styles.mseBadgeDate}>
              Last updated: {new Date(stock.lastUpdated).toLocaleDateString("en-GB", {
                day: "2-digit", month: "short", year: "numeric",
              })}
            </Text>
          )}
        </View>

        {/* Buy / Sell button */}
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

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  topSection: {
    backgroundColor: TEAL,
    paddingBottom: 8,
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

  // Stock card
  stockCard: {
    marginHorizontal: 24,
    backgroundColor: CARD_TEAL,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: BORDER_TEAL,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
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

  // Period tabs — below chart, darker pill container
  periodTabsRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 16,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 12,
    padding: 4,
    gap: 2,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 9,
  },
  periodTabActive: {
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  periodTabText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
  },
  periodTabTextActive: {
    color: WHITE,
    fontFamily: "Poppins_600SemiBold",
  },

  // Floating pill tooltip (absolute, moves with crosshair)
  floatingTooltip: {
    position: "absolute",
    top: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(10,18,26,0.82)",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    // subtle border
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  tooltipPrice: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: WHITE,
    letterSpacing: 0.1,
  },
  tooltipBadge: {
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 7,
  },
  tooltipBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.2,
  },

  // Bottom section
  bottomSection: {
    backgroundColor: WHITE,
    paddingTop: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -12,
  },

  // Detail tabs
  detailTabs: {
    flexDirection: "row",
    marginHorizontal: 24,
    marginTop: 24,
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

  // Stats table
  statsTable: {
    marginHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: DIVIDER,
    overflow: "hidden",
    backgroundColor: WHITE,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: WHITE,
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
  },

  // MSE attribution
  mseBadge: {
    marginHorizontal: 24,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#F3F6F6",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D0DBDC",
  },
  mseBadgeText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: TEAL,
  },
  mseBadgeDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: MUTED,
    marginTop: 2,
  },

  // Buy button
  buySection: {
    marginHorizontal: 24,
    marginTop: 20,
  },
  buyBtn: {
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
  buyBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: WHITE,
  },
});

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
  Text as SvgText,
} from "react-native-svg";
import { useStockDetail } from "../../hooks/useStocks";
import { getStockLogo } from "../../utils/stock-logos";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const TEAL = "#164951";
const CARD_TEAL = "#2D5B62";
const GREEN = "#45B369";
const RED = "#EF4770";
const WHITE = "#FFFFFF";
const DARK = "#111827";
const MUTED = "#9CA3AF";
const DIVIDER = "#EBECEF";

const { width: SCREEN_W } = Dimensions.get("window");

// ─── Period tabs ─────────────────────────────────────────────────────────────────
const TIME_TABS = ["1M", "3M", "6M", "1Y", "2Y", "5Y"] as const;
type TimePeriod = typeof TIME_TABS[number];

// ─── Icons ─────────────────────────────────────────────────────────────────────
function BackIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M9.57 5.93L3.5 12L9.57 18.07" stroke={WHITE} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20.5 12H3.67" stroke={WHITE} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BookmarkIcon({ filled }: { filled?: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M16.82 2H7.18C5.05 2 3.32 3.74 3.32 5.86V19.95C3.32 21.75 4.61 22.51 6.19 21.64L11.07 18.93C11.59 18.64 12.43 18.64 12.94 18.93L17.82 21.64C19.4 22.52 20.69 21.76 20.69 19.95V5.86C20.68 3.74 18.95 2 16.82 2Z" stroke={WHITE} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill={filled ? WHITE : "none"} />
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

// ─── Exact colors from SVG design ─────────────────────────────────────────────
const SVG_GREEN       = "#45B369";   // chart line (positive)
const SVG_RED         = "#EF4770";   // chart line (negative)
const SVG_TEAL        = "#164951";   // crosshair lines & tooltip background
const SVG_GRID        = "#EBECEF";   // horizontal grid lines
const SVG_LABEL       = "#9CA3AF";   // axis labels

const CHART_H   = 210;
const PAD_TOP   = 14;
const PAD_BTM   = 6;
const PAD_L     = 0;
const PAD_R     = 0;
// Tooltip dimensions (SVG-rendered inside chart)
const TT_W      = 172;
const TT_H      = 44;
const TT_RX     = 6;
const TT_PAD_X  = 12;

function PriceChart({ data, positive, period }: PriceChartProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const lineColor = positive ? SVG_GREEN : SVG_RED;

  if (!data || data.length < 2) {
    return (
      <View style={{ width: SCREEN_W, height: CHART_H, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "rgba(255,255,255,0.35)", fontFamily: "Poppins_400Regular", fontSize: 12 }}>
          Insufficient data for this period
        </Text>
      </View>
    );
  }

  const prices  = data.map((d) => d.close);
  const minP    = Math.min(...prices);
  const maxP    = Math.max(...prices);
  const range   = maxP - minP || 1;
  const plotW   = SCREEN_W - PAD_L - PAD_R;
  const plotH   = CHART_H - PAD_TOP - PAD_BTM;

  const xFor = (i: number)     => PAD_L + (i / (data.length - 1)) * plotW;
  const yFor = (p: number)     => PAD_TOP + (1 - (p - minP) / range) * plotH;

  // SVG paths
  const lineParts = data.map((d, i) =>
    `${i === 0 ? "M" : "L"}${xFor(i).toFixed(1)},${yFor(d.close).toFixed(1)}`
  );
  const linePath = lineParts.join(" ");
  const fillPath =
    linePath +
    ` L${xFor(data.length - 1).toFixed(1)},${CHART_H}` +
    ` L${xFor(0).toFixed(1)},${CHART_H} Z`;

  // 3 evenly-spaced Y-axis grid prices
  const yTicks = [maxP, minP + range * 0.5, minP];

  // Active point
  const activePt  = selectedIdx !== null ? data[selectedIdx] : data[data.length - 1];
  const activeX   = selectedIdx !== null ? xFor(selectedIdx) : xFor(data.length - 1);
  const activeY   = yFor(activePt.close);
  const changePct = activePt.changePct ?? 0;

  const fmtPrice = (p: number) =>
    `MWK ${p.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Tooltip: centre on crosshair, clamp inside chart
  const ttX   = Math.max(PAD_L + 4, Math.min(SCREEN_W - TT_W - 4, activeX - TT_W / 2));
  const ttY   = PAD_TOP + 4;          // fixed near chart top
  const priceTxt  = fmtPrice(activePt.close);
  const changeTxt = `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`;
  const changeColor = changePct >= 0 ? SVG_GREEN : SVG_RED;

  const handleTouch = useCallback((evt: any) => {
    const touchX = evt?.nativeEvent?.locationX ?? 0;
    const ratio  = Math.max(0, Math.min(1, touchX / plotW));
    setSelectedIdx(Math.round(ratio * (data.length - 1)));
  }, [data.length, plotW]);

  const handleTouchEnd = useCallback(() => setSelectedIdx(null), []);

  return (
    <View
      style={{ width: SCREEN_W, height: CHART_H }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleTouch}
      onResponderMove={handleTouch}
      onResponderRelease={handleTouchEnd}
    >
      <Svg width={SCREEN_W} height={CHART_H}>
        <Defs>
          {/* Exact gradient from SVG: #45B369 at 0.19 → 0, always green */}
          <LinearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor={SVG_GREEN} stopOpacity="0.19" />
            <Stop offset="100%" stopColor={SVG_GREEN} stopOpacity="0"    />
          </LinearGradient>
        </Defs>

        {/* ── Horizontal grid lines: #EBECEF, dasharray "3 3" ── */}
        {yTicks.map((price, i) => {
          const y = yFor(price);
          return (
            <Line
              key={i}
              x1={PAD_L} y1={y} x2={SCREEN_W - PAD_R} y2={y}
              stroke={SVG_GRID}
              strokeWidth={1}
              strokeLinecap="round"
              strokeDasharray="3 3"
            />
          );
        })}

        {/* ── Fill ── */}
        <Path d={fillPath} fill="url(#chartFill)" />

        {/* ── Price line: 1.5px, rounded ── */}
        <Path
          d={linePath}
          stroke={lineColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* ── Vertical crosshair: #164951, 0.5px, dasharray "2 2" ── */}
        <Line
          x1={activeX} y1={PAD_TOP}
          x2={activeX} y2={PAD_TOP + plotH}
          stroke={SVG_TEAL}
          strokeWidth={0.5}
          strokeLinecap="round"
          strokeDasharray="2 2"
        />

        {/* ── Horizontal crosshair: #164951, 0.5px, dasharray "2 2" ── */}
        <Line
          x1={PAD_L} y1={activeY}
          x2={SCREEN_W - PAD_R} y2={activeY}
          stroke={SVG_TEAL}
          strokeWidth={0.5}
          strokeLinecap="round"
          strokeDasharray="2 2"
        />

        {/* ── Active dot: white fill, #45B369 stroke, r=4, sw=2 ── */}
        <Circle cx={activeX} cy={activeY} r={4} fill={WHITE} stroke={SVG_GREEN} strokeWidth={2} />

        {/* ── Tooltip: #164951 rect, white text, rx=6 ── */}
        {/* Background rect */}
        <Path
          d={`M${ttX + TT_RX},${ttY} h${TT_W - TT_RX * 2} a${TT_RX},${TT_RX} 0 0 1 ${TT_RX},${TT_RX} v${TT_H - TT_RX * 2} a${TT_RX},${TT_RX} 0 0 1 -${TT_RX},${TT_RX} h-${TT_W - TT_RX * 2} a${TT_RX},${TT_RX} 0 0 1 -${TT_RX},-${TT_RX} v-${TT_H - TT_RX * 2} a${TT_RX},${TT_RX} 0 0 1 ${TT_RX},-${TT_RX} Z`}
          fill={SVG_TEAL}
        />
        {/* Price text */}
        <SvgText
          x={ttX + TT_PAD_X}
          y={ttY + 18}
          fill={WHITE}
          fontSize={12}
          fontFamily="Poppins_600SemiBold"
        >
          {priceTxt}
        </SvgText>
        {/* Change % text */}
        <SvgText
          x={ttX + TT_PAD_X}
          y={ttY + 34}
          fill={changeColor}
          fontSize={11}
          fontFamily="Poppins_500Medium"
        >
          {changeTxt}
        </SvgText>
      </Svg>
    </View>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────────
export default function StockDetailScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 44;
  const bottomPad = insets.bottom || 16;
  const { ticker } = useLocalSearchParams<{ ticker: string }>();

  const [activeTimeTab, setActiveTimeTab] = useState<TimePeriod>("1M");
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);

  const WATCHLIST_KEY = "@pine_watchlist_tickers";
  const MAX_WATCHLIST = 4;

  const { data: stock, isLoading, error, refetch } = useStockDetail(ticker, activeTimeTab);

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
        <ActivityIndicator size="large" color={GREEN} />
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

  const chartData: PricePoint[] = stock.priceHistory.map((h) => ({
    date: h.date, close: h.close, volume: h.volume, changePct: h.changePct ?? null,
  }));

  const keyStats = [
    { label: "Market Cap",    value: stock.listedShares ?? "—" },
    { label: "Current Price", value: stock.price },
    { label: "Open",          value: stock.openPrice },
    { label: "High",          value: stock.highPrice },
    { label: "Low",           value: stock.lowPrice },
    { label: "Volume",        value: stock.volume },
    ...(stock.sector ? [{ label: "Sector", value: stock.sector }] : []),
  ];

  const changeBadgeBg = stock.positive ? "rgba(61,220,127,0.18)" : "rgba(239,71,112,0.18)";
  const changeBadgeFg = stock.positive ? "#3DDC7F" : RED;

  const aboutText =
    (stock as any).description ??
    `${stock.name} is a company listed on the Malawi Stock Exchange (MSE). It operates within the ${
      stock.sector ?? "financial"
    } sector and offers investors exposure to the Malawian economy.`;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + bottomPad }}
      >
        {/* ── Dark teal top section ──────────────────────────────── */}
        <View style={[styles.topSection, { paddingTop: topPad }]}>

          {/* Nav */}
          <View style={styles.navBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}><BackIcon /></TouchableOpacity>
            <TouchableOpacity style={styles.navBtn} onPress={toggleWatchlist}><BookmarkIcon filled={isInWatchlist} /></TouchableOpacity>
          </View>

          {/* Logo + name inline */}
          <View style={styles.inlineHeader}>
            <View style={styles.headerLogoWrap}>
              {getStockLogo(stock.symbol) ? (
                <Image source={getStockLogo(stock.symbol)!} style={{ width: 28, height: 28, borderRadius: 14 }} resizeMode="contain" />
              ) : (
                <Text style={styles.headerLogoText}>{stock.symbol.slice(0, 2)}</Text>
              )}
            </View>
            <Text style={styles.headerName} numberOfLines={1}>{stock.name}</Text>
          </View>

          {/* Price + badge + Today */}
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>{stock.price}</Text>
            <View style={[styles.changeBadge, { backgroundColor: changeBadgeBg }]}>
              <Text style={[styles.changeBadgeText, { color: changeBadgeFg }]}>
                {stock.positive ? "▲" : "▼"} {stock.change}
              </Text>
            </View>
            <Text style={styles.todayLabel}>Today</Text>
          </View>

          {/* Chart */}
          <View style={{ marginTop: 8 }}>
            <PriceChart data={chartData} positive={stock.positive} period={activeTimeTab} />
          </View>

          {/* Period tabs */}
          <View style={styles.periodTabsRow}>
            {TIME_TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.periodTab, activeTimeTab === tab && styles.periodTabActive]}
                onPress={() => setActiveTimeTab(tab)}
                activeOpacity={0.75}
              >
                <Text style={[styles.periodTabText, activeTimeTab === tab && styles.periodTabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── White bottom section ───────────────────────────────── */}
        <View style={styles.bottomSection}>

          {/* About */}
          <View style={styles.aboutSection}>
            <Text style={styles.sectionTitle}>About {stock.name}</Text>
            <Text style={styles.aboutBody} numberOfLines={aboutExpanded ? undefined : 3}>{aboutText}</Text>
            <TouchableOpacity onPress={() => setAboutExpanded((p) => !p)}>
              <Text style={styles.readMore}>{aboutExpanded ? "Read less" : "Read more"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dividerLine} />

          {/* Key Statistics */}
          <View style={styles.statsSection}>
            <View style={styles.statsSectionHeader}>
              <Text style={styles.sectionTitle}>Key Statistics</Text>
              <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
            </View>
            <View style={styles.statsGrid}>
              {keyStats.map((stat) => (
                <View key={stat.label} style={styles.statCell}>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text style={styles.statValue}>{stat.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* MSE badge */}
          <View style={styles.mseBadge}>
            <Text style={styles.mseBadgeText}>Data sourced from Malawi Stock Exchange · MSE</Text>
            {stock.lastUpdated && (
              <Text style={styles.mseBadgeDate}>
                Last updated: {new Date(stock.lastUpdated).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ── Sticky Sell / Buy bar ─────────────────────────────── */}
      <View style={[styles.stickyBar, { paddingBottom: bottomPad > 0 ? bottomPad : 16 }]}>
        <TouchableOpacity style={styles.sellBtn} activeOpacity={0.85} onPress={() => router.push(`/trade/sell?ticker=${ticker}` as any)}>
          <Text style={styles.sellBtnText}>Sell</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buyBtn} activeOpacity={0.85} onPress={() => router.push(`/trade/buy?ticker=${ticker}` as any)}>
          <Text style={styles.buyBtnText}>Buy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper:   { flex: 1, backgroundColor: WHITE },
  container: { flex: 1, backgroundColor: WHITE },

  // ── Top teal
  topSection: { backgroundColor: TEAL, paddingBottom: 20 },
  navBar:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingBottom: 16 },
  navBtn:     { width: 40, height: 40, alignItems: "center", justifyContent: "center" },

  // ── Inline header
  inlineHeader:   { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, gap: 10, marginBottom: 8 },
  headerLogoWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: CARD_TEAL, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  headerLogoText: { fontFamily: "Poppins_700Bold", fontSize: 11, color: WHITE },
  headerName:     { fontFamily: "Poppins_500Medium", fontSize: 15, color: "rgba(255,255,255,0.8)", flex: 1 },

  // ── Price row
  priceRow:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, gap: 10, marginBottom: 4 },
  priceText:       { fontFamily: "Poppins_700Bold", fontSize: 28, color: WHITE, letterSpacing: -0.5 },
  changeBadge:     { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  changeBadgeText: { fontFamily: "Poppins_600SemiBold", fontSize: 12, letterSpacing: 0.2 },
  todayLabel:      { fontFamily: "Poppins_400Regular", fontSize: 13, color: "rgba(255,255,255,0.5)" },

  // ── Period tabs
  periodTabsRow:       { flexDirection: "row", marginHorizontal: 20, marginTop: 4, marginBottom: 4, backgroundColor: "rgba(0,0,0,0.25)", borderRadius: 12, padding: 4, gap: 2 },
  periodTab:           { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 9 },
  periodTabActive:     { backgroundColor: "rgba(255,255,255,0.14)" },
  periodTabText:       { fontFamily: "Poppins_500Medium", fontSize: 12, color: "rgba(255,255,255,0.45)" },
  periodTabTextActive: { color: WHITE, fontFamily: "Poppins_600SemiBold" },

  // ── Bottom white
  bottomSection: { backgroundColor: WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: 0, paddingTop: 8 },

  // ── About
  aboutSection: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20 },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 17, color: DARK, marginBottom: 10 },
  aboutBody:    { fontFamily: "Poppins_400Regular", fontSize: 13.5, color: "#4B5563", lineHeight: 22 },
  readMore:     { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: TEAL, marginTop: 6 },
  dividerLine:  { height: 1, backgroundColor: DIVIDER, marginHorizontal: 24 },

  // ── Key Statistics
  statsSection:       { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
  statsSectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  seeAll:             { fontFamily: "Poppins_500Medium", fontSize: 13, color: TEAL },
  statsGrid:          { flexDirection: "row", flexWrap: "wrap", rowGap: 16 },
  statCell:           { width: "50%" },
  statLabel:          { fontFamily: "Poppins_400Regular", fontSize: 12, color: MUTED, marginBottom: 3 },
  statValue:          { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: DARK },

  // ── MSE badge
  mseBadge:     { marginHorizontal: 24, marginBottom: 8, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: "#F3F6F6", borderRadius: 10, borderWidth: 1, borderColor: "#D0DBDC" },
  mseBadgeText: { fontFamily: "Poppins_500Medium", fontSize: 11, color: TEAL },
  mseBadgeDate: { fontFamily: "Poppins_400Regular", fontSize: 10, color: MUTED, marginTop: 2 },

  // ── Sticky Sell/Buy bar
  stickyBar:   { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", paddingHorizontal: 24, paddingTop: 14, gap: 12, backgroundColor: WHITE, borderTopWidth: 1, borderTopColor: DIVIDER },
  sellBtn:     { flex: 1, height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: TEAL, backgroundColor: WHITE },
  sellBtnText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: TEAL },
  buyBtn:      { flex: 1, height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: TEAL, shadowColor: TEAL, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 },
  buyBtnText:  { fontFamily: "Poppins_700Bold", fontSize: 15, color: WHITE },
});

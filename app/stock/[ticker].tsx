import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
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
import { useQueryClient } from "@tanstack/react-query";
import { useStockDetail, stockKeys } from "../../hooks/useStocks";
import { ApiStock } from "../../services/api";
import { getStockLogo } from "../../utils/stock-logos";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine   = Animated.createAnimatedComponent(Line);

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
      <Path d="M9.57 5.93L3.5 12L9.57 18.07" stroke={DARK} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20.5 12H3.67" stroke={DARK} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StarIcon({ filled }: { filled?: boolean }) {
  return (
    <Svg width={23} height={21} viewBox="0 0 23 21" fill="none">
      <Path
        d="M21.75 8.25H13.6875L11.25 0.75L8.8125 8.25H0.75L7.3125 12.75L4.78125 20.25L11.25 15.5625L17.7188 20.25L15.1875 12.75L21.75 8.25Z"
        stroke={filled ? TEAL : MUTED}
        strokeWidth={1.5}
        strokeLinejoin="round"
        fill={filled ? TEAL : "none"}
      />
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
const SVG_GREEN = "#45B369";
const SVG_RED   = "#EF4770";
const SVG_TEAL  = "#164951";
const SVG_GRID  = "#EBECEF";
const SVG_LABEL = "#9CA3AF";

// Chart dimensions
const CHART_H   = 220;
const Y_PAD     = 54;   // left gap for Y-axis labels
const PAD_R     = 16;
const PAD_TOP   = 18;
const PAD_BTM   = 28;   // bottom gap for X-axis labels

// Tooltip square size
const TT_SIZE = 82;
const TT_RX   = 8;

/** Format a price for the Y-axis label */
function fmtYLabel(p: number): string {
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1)}M`;
  if (p >= 10_000)    return `${(p / 1_000).toFixed(1)}K`;
  if (p >= 1_000)     return p.toLocaleString("en", { maximumFractionDigits: 0 });
  return p.toFixed(2);
}

/** Format a date string for the X-axis label depending on period */
function fmtXLabel(dateStr: string, period: string): string {
  const d = new Date(dateStr);
  if (period === "1M")
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  if (period === "3M" || period === "6M")
    return d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
  return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

function PriceChart({ data, positive, period }: PriceChartProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // ── Reanimated shared values for the dot / crosshair position ────
  // Initialise to 0; corrected immediately by the effects below.
  const animX = useSharedValue(0);
  const animY = useSharedValue(0);

  // Pre-computed x/y pixel positions for every data point — stored as
  // shared values so gesture worklets can read them on the UI thread
  // without touching the JS heap.
  const xsShared = useSharedValue<number[]>([]);
  const ysShared = useSharedValue<number[]>([]);

  // Animated props for the SVG dot
  const dotAnimProps = useAnimatedProps(() => ({
    cx: animX.value,
    cy: animY.value,
  }));

  // Animated props for the vertical crosshair
  const vLineAnimProps = useAnimatedProps(() => ({
    x1: animX.value,
    x2: animX.value,
  }));

  // Animated props for the horizontal crosshair
  const hLineAnimProps = useAnimatedProps(() => ({
    y1: animY.value,
    y2: animY.value,
  }));

  // Animated style for the tooltip card — floats above the dot,
  // drops below only when the dot is too close to the top edge.
  const CARD_H = 52; // approx card height (paddingVertical 8×2 + two text lines)
  const DOT_GAP = 12;
  const tooltipAnimStyle = useAnimatedStyle(() => {
    const x = Math.max(
      Y_PAD,
      Math.min(SCREEN_W - TT_SIZE - 4, animX.value - TT_SIZE / 2)
    );
    const aboveY = animY.value - CARD_H - DOT_GAP;
    const y = aboveY >= PAD_TOP ? aboveY : animY.value + DOT_GAP;
    return { left: x, top: y };
  });

  // ── Snap dot instantly to a data index ───────────────────────────
  const snapToIdx = useCallback((idx: number, d: PricePoint[]) => {
    if (!d || d.length < 2) return;
    const prices = d.map((p) => p.close);
    const minP   = Math.min(...prices);
    const maxP   = Math.max(...prices);
    const range  = maxP - minP || 1;
    const plotW  = SCREEN_W - Y_PAD - PAD_R;
    const plotH  = CHART_H - PAD_TOP - PAD_BTM;
    animX.value  = Y_PAD + (idx / (d.length - 1)) * plotW;
    animY.value  = PAD_TOP + (1 - (d[idx].close - minP) / range) * plotH;
  }, []);

  // Instantly reset when data changes (period switch) and
  // pre-compute x/y pixel arrays for the gesture worklet.
  useEffect(() => {
    if (!data || data.length < 2) return;
    const prices = data.map((p) => p.close);
    const minP   = Math.min(...prices);
    const maxP   = Math.max(...prices);
    const range  = maxP - minP || 1;
    const plotW  = SCREEN_W - Y_PAD - PAD_R;
    const plotH  = CHART_H - PAD_TOP - PAD_BTM;
    xsShared.value = data.map((_, i) => Y_PAD + (i / (data.length - 1)) * plotW);
    ysShared.value = data.map((p)    => PAD_TOP + (1 - (p.close - minP) / range) * plotH);
    setSelectedIdx(null);
    snapToIdx(data.length - 1, data);
  }, [data]);

  // ── RNGH Pan gesture — updates dot on the UI thread instantly ─────
  // xsShared/ysShared are pre-computed on data change and read here
  // as worklet-accessible shared values, so there is no JS→UI round-trip.
  const PLOT_W = SCREEN_W - Y_PAD - PAD_R;
  const pickAndSnap = (x: number, animate: boolean) => {
    "worklet";
    const xs  = xsShared.value;
    const ys  = ysShared.value;
    const len = xs.length;
    if (len < 2) return;
    const t   = Math.max(0, Math.min(1, (x - Y_PAD) / PLOT_W));
    const idx = Math.round(t * (len - 1));
    if (animate) {
      animX.value = withSpring(xs[idx], { damping: 20, stiffness: 300, mass: 0.6 });
      animY.value = withSpring(ys[idx], { damping: 20, stiffness: 300, mass: 0.6 });
    } else {
      animX.value = xs[idx];
      animY.value = ys[idx];
    }
    runOnJS(setSelectedIdx)(idx);   // only for tooltip text
  };

  const gesture = Gesture.Pan()
    .minDistance(0)
    .activeOffsetX([-4, 4])
    .onBegin((e)  => { "worklet"; pickAndSnap(e.x, true); })   // spring on first tap
    .onUpdate((e) => { "worklet"; pickAndSnap(e.x, false); }); // instant while dragging

  // ── Early return for empty data ───────────────────────────────────
  if (!data || data.length < 2) {
    return (
      <View style={{ width: SCREEN_W, height: CHART_H, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: MUTED, fontFamily: "PlusJakartaSans_400Regular", fontSize: 12 }}>
          Insufficient data for this period
        </Text>
      </View>
    );
  }

  // ── Chart geometry ────────────────────────────────────────────────
  const prices = data.map((d) => d.close);
  const minP   = Math.min(...prices);
  const maxP   = Math.max(...prices);
  const range  = maxP - minP || 1;
  const plotW  = SCREEN_W - Y_PAD - PAD_R;
  const plotH  = CHART_H - PAD_TOP - PAD_BTM;

  const xFor = (i: number) => Y_PAD + (i / (data.length - 1)) * plotW;
  const yFor = (p: number) => PAD_TOP + (1 - (p - minP) / range) * plotH;

  const peakIdx = prices.indexOf(maxP);

  const buildSeg = (from: number, to: number) =>
    data.slice(from, to + 1)
      .map((d, j) => `${j === 0 ? "M" : "L"}${xFor(from + j).toFixed(1)},${yFor(d.close).toFixed(1)}`)
      .join(" ");

  const greenPath = buildSeg(0, peakIdx);
  const redPath   = peakIdx < data.length - 1 ? buildSeg(peakIdx, data.length - 1) : null;

  const greenFill =
    greenPath +
    ` L${xFor(peakIdx).toFixed(1)},${(PAD_TOP + plotH).toFixed(1)}` +
    ` L${xFor(0).toFixed(1)},${(PAD_TOP + plotH).toFixed(1)} Z`;

  const yTicks      = [0, 1, 2, 3, 4].map((i) => minP + (range * (4 - i)) / 4);
  const xLabelIdxs  = [0, 1, 2, 3, 4].map((i) => Math.round((i / 4) * (data.length - 1)));

  // ── Active point (for text/colour — not for position, which is animated) ─
  const activeIdx   = selectedIdx !== null ? selectedIdx : data.length - 1;
  const activePt    = data[activeIdx];
  const changePct   = activePt.changePct ?? 0;
  const changeColor = changePct >= 0 ? SVG_GREEN : SVG_RED;
  const priceTxt    = `MWK ${activePt.close.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const changeTxt   = `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`;

  return (
    <GestureDetector gesture={gesture}>
    <View style={{ width: SCREEN_W, height: CHART_H }}>
      <Svg width={SCREEN_W} height={CHART_H}>
        <Defs>
          <LinearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor={SVG_GREEN} stopOpacity="0.19" />
            <Stop offset="100%" stopColor={SVG_GREEN} stopOpacity="0"    />
          </LinearGradient>
        </Defs>

        {/* ── Y-axis grid lines + labels ─────────────────────────── */}
        {yTicks.map((price, i) => {
          const y = yFor(price);
          return (
            <React.Fragment key={i}>
              <Line
                x1={Y_PAD} y1={y} x2={SCREEN_W - PAD_R} y2={y}
                stroke={SVG_GRID} strokeWidth={1} strokeLinecap="round" strokeDasharray="3 3"
              />
              <SvgText
                x={Y_PAD - 6} y={y + 4} textAnchor="end"
                fill={SVG_LABEL} fontSize={10} fontFamily="PlusJakartaSans_400Regular"
              >
                {fmtYLabel(price)}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* ── Green fill ─────────────────────────────────────────── */}
        <Path d={greenFill} fill="url(#chartFill)" />

        {/* ── Green line ─────────────────────────────────────────── */}
        <Path d={greenPath} stroke={SVG_GREEN} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* ── Red line (falling segment) ─────────────────────────── */}
        {redPath && (
          <Path d={redPath} stroke={SVG_RED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        )}

        {/* ── X-axis date labels ─────────────────────────────────── */}
        {xLabelIdxs.map((idx, i) => (
          <SvgText
            key={i} x={xFor(idx)} y={PAD_TOP + plotH + 18}
            textAnchor={i === 0 ? "start" : i === 4 ? "end" : "middle"}
            fill={SVG_LABEL} fontSize={10} fontFamily="PlusJakartaSans_400Regular"
          >
            {fmtXLabel(data[idx].date, period)}
          </SvgText>
        ))}

        {/* ── Animated vertical crosshair ────────────────────────── */}
        <AnimatedLine
          animatedProps={vLineAnimProps}
          y1={PAD_TOP} y2={PAD_TOP + plotH}
          stroke={SVG_TEAL} strokeWidth={0.5} strokeLinecap="round" strokeDasharray="2 2"
        />

        {/* ── Animated horizontal crosshair ──────────────────────── */}
        <AnimatedLine
          animatedProps={hLineAnimProps}
          x1={Y_PAD} x2={SCREEN_W - PAD_R}
          stroke={SVG_TEAL} strokeWidth={0.5} strokeLinecap="round" strokeDasharray="2 2"
        />

        {/* ── Animated dot ───────────────────────────────────────── */}
        <AnimatedCircle
          animatedProps={dotAnimProps}
          r={4} fill={WHITE} stroke={SVG_GREEN} strokeWidth={2}
        />
      </Svg>

      {/* ── Square tooltip card (absolute, animated position) ──────── */}
      <Animated.View
        style={[
          {
            position: "absolute",
            width: TT_SIZE,
            backgroundColor: SVG_TEAL,
            borderRadius: TT_RX,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 6,
            paddingVertical: 8,
          },
          tooltipAnimStyle,
        ]}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{ color: WHITE, fontSize: 12, fontFamily: "PlusJakartaSans_700Bold", textAlign: "center" }}
        >
          {priceTxt}
        </Text>
        <Text
          style={{ color: changeColor, fontSize: 11, fontFamily: "PlusJakartaSans_500Medium", marginTop: 4 }}
        >
          {changeTxt}
        </Text>
      </Animated.View>
    </View>
    </GestureDetector>
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

  // Pull the matching ApiStock from the TanStack Query list cache — available
  // instantly without any network call, so the page renders immediately.
  const queryClient = useQueryClient();
  const cachedStock = useMemo<ApiStock | null>(() => {
    const allListCaches = queryClient
      .getQueryCache()
      .findAll({ queryKey: ["stocks", "list"] });
    for (const entry of allListCaches) {
      const list = entry.state.data as ApiStock[] | undefined;
      if (list) {
        const found = list.find((s) => s.symbol === ticker?.toUpperCase());
        if (found) return found;
      }
    }
    return null;
  }, [ticker]);

  // Use the richer detail data when available, otherwise fall back to list cache.
  const displayStock = stock ?? cachedStock;

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

  // Only show the full error screen when we have nothing to display at all.
  if (error && !displayStock) {
    return (
      <View style={[styles.container, { paddingTop: topPad, alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: RED, fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 16 }}>Could not load {ticker}</Text>
        <Text style={{ color: MUTED, fontFamily: "PlusJakartaSans_400Regular", marginTop: 4 }}>Check your connection</Text>
        <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 16, backgroundColor: TEAL, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 }}>
          <Text style={{ color: "#fff", fontFamily: "PlusJakartaSans_600SemiBold" }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Minimal skeleton while we have no data at all (very rare — only on first ever load).
  if (!displayStock) {
    return (
      <View style={[styles.container, { paddingTop: topPad, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={GREEN} />
      </View>
    );
  }

  const chartData: PricePoint[] = stock?.priceHistory.map((h) => ({
    date: h.date, close: h.close, volume: h.volume, changePct: h.changePct ?? null,
  })) ?? [];

  const keyStats = [
    { label: "Market Cap",    value: stock?.listedShares ?? "—" },
    { label: "Current Price", value: displayStock.price },
    { label: "Open",          value: stock?.openPrice ?? "—" },
    { label: "High",          value: stock?.highPrice ?? "—" },
    { label: "Low",           value: stock?.lowPrice ?? "—" },
    { label: "Volume",        value: displayStock.volume },
    ...(displayStock.sector ? [{ label: "Sector", value: displayStock.sector }] : []),
  ];

  const changeBadgeFg = displayStock.positive ? GREEN : RED;

  const aboutText =
    stock?.description ??
    `${displayStock.name} is a company listed on the Malawi Stock Exchange (MSE). It operates within the ${
      displayStock.sector ?? "financial"
    } sector and offers investors exposure to the Malawian economy.`;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + bottomPad }}
      >
        {/* ── White top section ──────────────────────────────── */}
        <View style={[styles.topSection, { paddingTop: topPad }]}>

          {/* Nav */}
          <View style={styles.navBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}><BackIcon /></TouchableOpacity>
            <TouchableOpacity style={styles.navBtn} onPress={toggleWatchlist}><StarIcon filled={isInWatchlist} /></TouchableOpacity>
          </View>

          {/* Stock info row: logo+ticker+name on left, price+change on right */}
          <View style={styles.inlineHeader}>
            {/* Logo */}
            <View style={styles.headerLogoWrap}>
              {getStockLogo(displayStock.symbol) ? (
                <Image source={getStockLogo(displayStock.symbol)!} style={{ width: 36, height: 36, borderRadius: 18 }} resizeMode="contain" />
              ) : (
                <Text style={styles.headerLogoText}>{displayStock.symbol.slice(0, 2).toLowerCase()}</Text>
              )}
            </View>

            {/* Ticker + company name */}
            <View style={styles.headerTextBlock}>
              <Text style={styles.headerTicker}>{displayStock.symbol}</Text>
              <Text style={styles.headerName} numberOfLines={1}>{displayStock.name}</Text>
            </View>

            {/* Price + change */}
            <View style={styles.headerPriceBlock}>
              <Text style={styles.headerPrice}>{displayStock.price}</Text>
              <View style={styles.headerChangePill}>
                <Text style={[styles.headerChangeText, { color: changeBadgeFg }]}>
                  {displayStock.positive ? "▲" : "▼"} {displayStock.change}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── White chart card ───────────────────────────────────── */}
        <View style={styles.chartCard}>
          {/* Period tabs — above the chart, pill-style */}
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

          {/* Chart — only this area loads from the backend */}
          {isLoading ? (
            <View style={styles.chartLoading}>
              <ActivityIndicator size="large" color={GREEN} />
            </View>
          ) : (
            <PriceChart data={chartData} positive={displayStock.positive} period={activeTimeTab} />
          )}
        </View>

        {/* ── White bottom section ───────────────────────────────── */}
        <View style={styles.bottomSection}>

          {/* About */}
          <View style={styles.aboutSection}>
            <Text style={styles.sectionTitle}>About {displayStock.name}</Text>
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
            {displayStock.lastUpdated && (
              <Text style={styles.mseBadgeDate}>
                Last updated: {new Date(displayStock.lastUpdated).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
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

  // ── Top white
  topSection: { backgroundColor: WHITE, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: DIVIDER },
  navBar:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingBottom: 12 },
  navBtn:     { width: 40, height: 40, alignItems: "center", justifyContent: "center" },

  // ── Inline header: logo | ticker+name | price+change
  inlineHeader:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, gap: 12, marginBottom: 4 },
  headerLogoWrap:   { width: 44, height: 44, borderRadius: 22, backgroundColor: WHITE, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 1, borderColor: "#E5E7EB" },
  headerLogoText:   { fontFamily: "PlusJakartaSans_700Bold", fontSize: 14, color: WHITE },
  headerTextBlock:  { flex: 1, justifyContent: "center", gap: 2 },
  headerTicker:     { fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: DARK },
  headerName:       { fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED },
  headerPriceBlock: { alignItems: "flex-end", gap: 4 },
  headerPrice:      { fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: DARK },
  headerChangePill: { flexDirection: "row", alignItems: "center" },
  headerChangeText: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 12 },

  // ── Chart card (white section holding tabs + chart)
  chartCard:    { backgroundColor: WHITE, paddingTop: 14, paddingBottom: 4 },
  chartLoading: { width: SCREEN_W, height: CHART_H, alignItems: "center", justifyContent: "center" },

  // ── Period tabs — pill style matching reference image
  periodTabsRow:       { flexDirection: "row", marginHorizontal: 16, marginBottom: 10, gap: 4, justifyContent: "center" },
  periodTab:           { paddingVertical: 7, paddingHorizontal: 13, alignItems: "center", borderRadius: 8 },
  periodTabActive:     { backgroundColor: SVG_TEAL },
  periodTabText:       { fontFamily: "PlusJakartaSans_500Medium", fontSize: 12, color: DARK },
  periodTabTextActive: { color: WHITE, fontFamily: "PlusJakartaSans_600SemiBold" },

  // ── Bottom white
  bottomSection: { backgroundColor: WHITE, paddingTop: 8 },

  // ── About
  aboutSection: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20 },
  sectionTitle: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 17, color: DARK, marginBottom: 10 },
  aboutBody:    { fontFamily: "PlusJakartaSans_400Regular", fontSize: 13.5, color: "#4B5563", lineHeight: 22 },
  readMore:     { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: TEAL, marginTop: 6 },
  dividerLine:  { height: 1, backgroundColor: DIVIDER, marginHorizontal: 24 },

  // ── Key Statistics
  statsSection:       { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
  statsSectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  seeAll:             { fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: TEAL },
  statsGrid:          { flexDirection: "row", flexWrap: "wrap", rowGap: 16 },
  statCell:           { width: "50%" },
  statLabel:          { fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED, marginBottom: 3 },
  statValue:          { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: DARK },

  // ── MSE badge
  mseBadge:     { marginHorizontal: 24, marginBottom: 8, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: "#F3F6F6", borderRadius: 10, borderWidth: 1, borderColor: "#D0DBDC" },
  mseBadgeText: { fontFamily: "PlusJakartaSans_500Medium", fontSize: 11, color: TEAL },
  mseBadgeDate: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 10, color: MUTED, marginTop: 2 },

  // ── Sticky Sell/Buy bar
  stickyBar:   { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", paddingHorizontal: 24, paddingTop: 14, gap: 12, backgroundColor: WHITE, borderTopWidth: 1, borderTopColor: DIVIDER },
  sellBtn:     { flex: 1, height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: TEAL, backgroundColor: WHITE },
  sellBtnText: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: TEAL },
  buyBtn:      { flex: 1, height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: TEAL, shadowColor: TEAL, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 },
  buyBtnText:  { fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: WHITE },
});

import { guardedBack } from "@/utils/navigation";
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
import { useIsWatched, useToggleWatchlist } from "../../hooks/useWatchlist";
import { useHoldingQuantity } from "../../hooks/usePortfolio";
import { ApiStock } from "../../services/api";
import { getStockLogo } from "../../utils/stock-logos";
import { useColors } from "@/hooks/useColors";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine   = Animated.createAnimatedComponent(Line);

// ─── Static brand tokens ────────────────────────────────────────────────────────
const TEAL  = "#164951";
const GREEN = "#45B369";
const RED   = "#EF4770";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";

const { width: SCREEN_W } = Dimensions.get("window");

// ─── Period tabs ─────────────────────────────────────────────────────────────────
const TIME_TABS = ["1M", "3M", "6M", "1Y", "2Y", "5Y"] as const;
type TimePeriod = typeof TIME_TABS[number];

// ─── Chart color tokens (brand / subtle — fine on both themes) ────────────────
const SVG_GREEN = "#45B369";
const SVG_RED   = "#EF4770";
const SVG_TEAL  = "#164951";
const SVG_GRID  = "#EBECEF";
const SVG_LABEL = "#9CA3AF";

// Chart dimensions
const CHART_H  = 220;
const Y_PAD    = 54;
const PAD_R    = 16;
const PAD_TOP  = 18;
const PAD_BTM  = 28;
const TT_SIZE  = 82;
const TT_RX    = 8;

function fmtYLabel(p: number): string {
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1)}M`;
  if (p >= 10_000)    return `${(p / 1_000).toFixed(1)}K`;
  if (p >= 1_000)     return p.toLocaleString("en", { maximumFractionDigits: 0 });
  return p.toFixed(2);
}

function fmtXLabel(dateStr: string, period: string): string {
  const d = new Date(dateStr);
  if (period === "1M") return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  if (period === "3M" || period === "6M") return d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
  return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

interface PricePoint { date: string; close: number; volume: number; changePct: number | null; }
interface PriceChartProps { data: PricePoint[]; positive: boolean; period: string; }

function PriceChart({ data, positive, period }: PriceChartProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const animX = useSharedValue(0);
  const animY = useSharedValue(0);
  const xsShared = useSharedValue<number[]>([]);
  const ysShared = useSharedValue<number[]>([]);

  const dotAnimProps    = useAnimatedProps(() => ({ cx: animX.value, cy: animY.value }));
  const vLineAnimProps  = useAnimatedProps(() => ({ x1: animX.value, x2: animX.value }));
  const hLineAnimProps  = useAnimatedProps(() => ({ y1: animY.value, y2: animY.value }));

  const CARD_H  = 52;
  const DOT_GAP = 12;
  const tooltipAnimStyle = useAnimatedStyle(() => {
    const x = Math.max(Y_PAD, Math.min(SCREEN_W - TT_SIZE - 4, animX.value - TT_SIZE / 2));
    const aboveY = animY.value - CARD_H - DOT_GAP;
    const y = aboveY >= PAD_TOP ? aboveY : animY.value + DOT_GAP;
    return { left: x, top: y };
  });

  const snapToIdx = useCallback((idx: number, d: PricePoint[]) => {
    if (!d || d.length < 2) return;
    const prices = d.map((p) => p.close);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || 1;
    const plotW = SCREEN_W - Y_PAD - PAD_R;
    const plotH = CHART_H - PAD_TOP - PAD_BTM;
    animX.value = Y_PAD + (idx / (d.length - 1)) * plotW;
    animY.value = PAD_TOP + (1 - (d[idx].close - minP) / range) * plotH;
  }, []);

  useEffect(() => {
    if (!data || data.length < 2) return;
    const prices = data.map((p) => p.close);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || 1;
    const plotW = SCREEN_W - Y_PAD - PAD_R;
    const plotH = CHART_H - PAD_TOP - PAD_BTM;
    xsShared.value = data.map((_, i) => Y_PAD + (i / (data.length - 1)) * plotW);
    ysShared.value = data.map((p) => PAD_TOP + (1 - (p.close - minP) / range) * plotH);
    setSelectedIdx(null);
    snapToIdx(data.length - 1, data);
  }, [data]);

  const PLOT_W = SCREEN_W - Y_PAD - PAD_R;
  const pickAndSnap = (x: number, animate: boolean) => {
    "worklet";
    const xs = xsShared.value;
    const ys = ysShared.value;
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
    runOnJS(setSelectedIdx)(idx);
  };

  const gesture = Gesture.Pan()
    .minDistance(0)
    .activeOffsetX([-4, 4])
    .onBegin((e)  => { "worklet"; pickAndSnap(e.x, true); })
    .onUpdate((e) => { "worklet"; pickAndSnap(e.x, false); });

  if (!data || data.length < 2) {
    return (
      <View style={{ width: SCREEN_W, height: CHART_H, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: MUTED, fontFamily: "PlusJakartaSans_400Regular", fontSize: 12 }}>Insufficient data for this period</Text>
      </View>
    );
  }

  const prices  = data.map((d) => d.close);
  const minP    = Math.min(...prices);
  const maxP    = Math.max(...prices);
  const range   = maxP - minP || 1;
  const plotW   = SCREEN_W - Y_PAD - PAD_R;
  const plotH   = CHART_H - PAD_TOP - PAD_BTM;
  const xFor    = (i: number) => Y_PAD + (i / (data.length - 1)) * plotW;
  const yFor    = (p: number) => PAD_TOP + (1 - (p - minP) / range) * plotH;
  const peakIdx = prices.indexOf(maxP);

  const buildSeg = (from: number, to: number) =>
    data.slice(from, to + 1)
      .map((d, j) => `${j === 0 ? "M" : "L"}${xFor(from + j).toFixed(1)},${yFor(d.close).toFixed(1)}`)
      .join(" ");

  const greenPath = buildSeg(0, peakIdx);
  const redPath   = peakIdx < data.length - 1 ? buildSeg(peakIdx, data.length - 1) : null;
  const greenFill = greenPath + ` L${xFor(peakIdx).toFixed(1)},${(PAD_TOP + plotH).toFixed(1)}` + ` L${xFor(0).toFixed(1)},${(PAD_TOP + plotH).toFixed(1)} Z`;
  const yTicks     = [0, 1, 2, 3, 4].map((i) => minP + (range * (4 - i)) / 4);
  const xLabelIdxs = [0, 1, 2, 3, 4].map((i) => Math.round((i / 4) * (data.length - 1)));

  const activeIdx   = selectedIdx !== null ? selectedIdx : data.length - 1;
  const activePt    = data[activeIdx];
  const changePct   = activePt.changePct ?? 0;
  const changeColor = changePct >= 0 ? SVG_GREEN : SVG_RED;
  const priceTxt    = `MWK ${activePt.close.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const dateTxt     = new Date(activePt.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: period === "1Y" || period === "5Y" ? "numeric" : undefined });

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
        {yTicks.map((price, i) => {
          const y = yFor(price);
          return (
            <React.Fragment key={i}>
              <Line x1={Y_PAD} y1={y} x2={SCREEN_W - PAD_R} y2={y} stroke={SVG_GRID} strokeWidth={1} strokeLinecap="round" strokeDasharray="3 3" />
              <SvgText x={Y_PAD - 6} y={y + 4} textAnchor="end" fill={SVG_LABEL} fontSize={10} fontFamily="PlusJakartaSans_400Regular">{fmtYLabel(price)}</SvgText>
            </React.Fragment>
          );
        })}
        <Path d={greenFill} fill="url(#chartFill)" />
        <Path d={greenPath} stroke={SVG_GREEN} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {redPath && <Path d={redPath} stroke={SVG_RED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
        {xLabelIdxs.map((idx, i) => (
          <SvgText key={i} x={xFor(idx)} y={PAD_TOP + plotH + 18} textAnchor={i === 0 ? "start" : i === 4 ? "end" : "middle"} fill={SVG_LABEL} fontSize={10} fontFamily="PlusJakartaSans_400Regular">
            {fmtXLabel(data[idx].date, period)}
          </SvgText>
        ))}
        <AnimatedLine animatedProps={vLineAnimProps} y1={PAD_TOP} y2={PAD_TOP + plotH} stroke={SVG_TEAL} strokeWidth={0.5} strokeLinecap="round" strokeDasharray="2 2" />
        <AnimatedLine animatedProps={hLineAnimProps} x1={Y_PAD} x2={SCREEN_W - PAD_R} stroke={SVG_TEAL} strokeWidth={0.5} strokeLinecap="round" strokeDasharray="2 2" />
        <AnimatedCircle animatedProps={dotAnimProps} r={4} fill={WHITE} stroke={SVG_GREEN} strokeWidth={2} />
      </Svg>
      <Animated.View style={[{ position: "absolute", width: TT_SIZE, backgroundColor: SVG_TEAL, borderRadius: TT_RX, alignItems: "center", justifyContent: "center", paddingHorizontal: 6, paddingVertical: 8 }, tooltipAnimStyle]}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: WHITE, fontSize: 12, fontFamily: "PlusJakartaSans_700Bold", textAlign: "center" }}>{priceTxt}</Text>
        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 10, fontFamily: "PlusJakartaSans_500Medium", marginTop: 4 }}>{dateTxt}</Text>
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
  const c = useColors();

  const [activeTimeTab, setActiveTimeTab] = useState<TimePeriod>("1M");
  const [aboutExpanded, setAboutExpanded] = useState(false);

  const { data: stock, isLoading, error, refetch } = useStockDetail(ticker, activeTimeTab);

  const isInWatchlist = useIsWatched(ticker);
  const toggleMutation = useToggleWatchlist();
  const holdingQty = useHoldingQuantity(ticker);
  const canSell = holdingQty > 0;

  const queryClient = useQueryClient();
  const cachedStock = useMemo<ApiStock | null>(() => {
    const allListCaches = queryClient.getQueryCache().findAll({ queryKey: ["stocks", "list"] });
    for (const entry of allListCaches) {
      const list = entry.state.data as ApiStock[] | undefined;
      if (list) {
        const found = list.find((s) => s.symbol === ticker?.toUpperCase());
        if (found) return found;
      }
    }
    return null;
  }, [ticker]);

  const displayStock = stock ?? cachedStock;

  const toggleWatchlist = useCallback(() => {
    if (toggleMutation.isPending) return; // debounce rapid taps
    toggleMutation.mutate(
      { symbol: ticker ?? '', currentlyWatched: isInWatchlist },
      {
        onError: (err) => {
          Alert.alert(
            "Watchlist Error",
            err.message ?? "Could not update watchlist. Please try again."
          );
        },
      }
    );
  }, [ticker, isInWatchlist, toggleMutation]);

  if (error && !displayStock) {
    return (
      <View style={[{ flex: 1, backgroundColor: c.background, paddingTop: topPad, alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: RED, fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 16 }}>Could not load {ticker}</Text>
        <Text style={{ color: MUTED, fontFamily: "PlusJakartaSans_400Regular", marginTop: 4 }}>Check your connection</Text>
        <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 16, backgroundColor: TEAL, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 }}>
          <Text style={{ color: WHITE, fontFamily: "PlusJakartaSans_600SemiBold" }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!displayStock) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background, paddingTop: topPad, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={GREEN} />
      </View>
    );
  }

  const chartData: PricePoint[] = stock?.priceHistory.map((h) => ({
    date: h.date, close: h.close, volume: h.volume, changePct: h.changePct ?? null,
  })) ?? [];

  const keyStats = [
    { label: "Open",          value: stock?.openPrice ?? "—" },
    { label: "High",          value: stock?.highPrice ?? "—" },
    { label: "Low",           value: stock?.lowPrice ?? "—" },
    { label: "Current Price", value: displayStock.price },
    { label: "Volume",        value: displayStock.volume },
    { label: "Turnover",      value: stock?.turnover ?? "—" },
    { label: "Market Cap",    value: stock?.marketCap ?? "—" },
    ...(displayStock.sector ? [{ label: "Sector", value: displayStock.sector }] : []),
  ];

  const changeBadgeFg = displayStock.positive ? GREEN : RED;
  const aboutText = stock?.description ?? `${displayStock.name} is a company listed on the Malawi Stock Exchange (MSE). It operates within the ${displayStock.sector ?? "financial"} sector and offers investors exposure to the Malawian economy.`;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: c.background }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + bottomPad }}
      >
        {/* Top section */}
        <View style={{ backgroundColor: c.background, paddingTop: topPad, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: c.border }}>
          {/* Nav */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingBottom: 12 }}>
            <TouchableOpacity onPress={() => guardedBack("/stock-search")} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path d="M15 19l-7-7 7-7" stroke={c.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
            <TouchableOpacity style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }} onPress={toggleWatchlist}>
              <Svg width={23} height={21} viewBox="0 0 23 21" fill="none">
                <Path d="M21.75 8.25H13.6875L11.25 0.75L8.8125 8.25H0.75L7.3125 12.75L4.78125 20.25L11.25 15.5625L17.7188 20.25L15.1875 12.75L21.75 8.25Z" stroke={isInWatchlist ? TEAL : MUTED} strokeWidth={1.5} strokeLinejoin="round" fill={isInWatchlist ? TEAL : "none"} />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Inline header */}
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, gap: 12, marginBottom: 4 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.card, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 1, borderColor: c.border }}>
              {getStockLogo(displayStock.symbol) ? (
                <Image source={getStockLogo(displayStock.symbol)!} style={{ width: 36, height: 36, borderRadius: 18 }} resizeMode="contain" />
              ) : (
                <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 14, color: WHITE }}>{displayStock.symbol.slice(0, 2).toLowerCase()}</Text>
              )}
            </View>
            <View style={{ flex: 1, justifyContent: "center", gap: 2 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: c.text }}>{displayStock.symbol}</Text>
              <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }} numberOfLines={1}>{displayStock.name}</Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: c.text }}>{displayStock.price}</Text>
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 12, color: changeBadgeFg }}>
                {displayStock.positive ? "▲" : "▼"} {displayStock.change}
              </Text>
            </View>
          </View>
        </View>

        {/* Chart card */}
        <View style={{ backgroundColor: c.background, paddingTop: 14, paddingBottom: 4 }}>
          {/* Period tabs */}
          <View style={{ flexDirection: "row", marginHorizontal: 16, marginBottom: 10, gap: 4, justifyContent: "center" }}>
            {TIME_TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={{ paddingVertical: 7, paddingHorizontal: 13, alignItems: "center", borderRadius: 8, backgroundColor: activeTimeTab === tab ? SVG_TEAL : "transparent" }}
                onPress={() => setActiveTimeTab(tab)}
                activeOpacity={0.75}
              >
                <Text style={{ fontFamily: activeTimeTab === tab ? "PlusJakartaSans_600SemiBold" : "PlusJakartaSans_500Medium", fontSize: 12, color: activeTimeTab === tab ? WHITE : c.text }}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {isLoading ? (
            <View style={{ width: SCREEN_W, height: CHART_H, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator size="large" color={GREEN} />
            </View>
          ) : (
            <PriceChart data={chartData} positive={displayStock.positive} period={activeTimeTab} />
          )}
        </View>

        {/* Bottom section */}
        <View style={{ backgroundColor: c.background, paddingTop: 8 }}>
          {/* About */}
          <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 17, color: c.text, marginBottom: 10 }}>About {displayStock.name}</Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13.5, color: c.text, lineHeight: 22, opacity: 0.75 }} numberOfLines={aboutExpanded ? undefined : 3}>{aboutText}</Text>
            <TouchableOpacity onPress={() => setAboutExpanded((p) => !p)}>
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: TEAL, marginTop: 6 }}>{aboutExpanded ? "Read less" : "Read more"}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 1, backgroundColor: c.border, marginHorizontal: 24 }} />

          {/* Key Statistics */}
          <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 17, color: c.text }}>Key Statistics</Text>
              <TouchableOpacity><Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: TEAL }}>See All</Text></TouchableOpacity>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {keyStats.map((stat, idx) => (
                <View
                  key={stat.label}
                  style={{
                    width: "50%",
                    paddingLeft: idx % 2 === 0 ? 0 : 12,
                    paddingRight: idx % 2 === 0 ? 12 : 0,
                    marginBottom: 20,
                    alignItems: idx % 2 === 0 ? "flex-start" : "flex-end",
                  }}
                >
                  <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED, marginBottom: 3 }}>{stat.label}</Text>
                  <Text
                    style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text, textAlign: idx % 2 === 0 ? "left" : "right" }}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {stat.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* MSE badge */}
          <View style={{ marginHorizontal: 24, marginBottom: 8, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: c.card, borderRadius: 10, borderWidth: 1, borderColor: c.border }}>
            <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 11, color: TEAL }}>Data sourced from Malawi Stock Exchange · MSE</Text>
            {displayStock.lastUpdated && (
              <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 10, color: MUTED, marginTop: 2 }}>
                Last updated: {new Date(displayStock.lastUpdated).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Sell / Buy bar */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", paddingHorizontal: 24, paddingTop: 14, paddingBottom: bottomPad > 0 ? bottomPad : 16, gap: 12, backgroundColor: c.background, borderTopWidth: 1, borderTopColor: c.border }}>
        <TouchableOpacity
          style={[
            { flex: 1, height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
            canSell
              ? { borderColor: TEAL, backgroundColor: c.background }
              : { borderColor: MUTED, backgroundColor: c.background, opacity: 0.45 },
          ]}
          activeOpacity={canSell ? 0.85 : 1}
          onPress={() => canSell && router.push(`/trade/sell?ticker=${ticker}` as any)}
          disabled={!canSell}
        >
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: canSell ? TEAL : MUTED }}>Sell</Text>
          {!canSell && (
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 9, color: MUTED, marginTop: 1 }}>No shares owned</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1, height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: TEAL, shadowColor: TEAL, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 }} activeOpacity={0.85} onPress={() => router.push(`/trade/buy?ticker=${ticker}` as any)}>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: WHITE }}>Buy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

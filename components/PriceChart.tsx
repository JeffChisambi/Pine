import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, {
  Path,
  Circle,
  Line,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { useColors } from "@/hooks/useColors";

/**
 * Line/area chart with a native-thread scrub tooltip.
 *
 * Extracted verbatim from the stock detail page so the Portfolio Analytics
 * screen shares the exact same chart (grid, gradient fill, peak split colour,
 * pan-to-scrub crosshair + tooltip). Only the value/date formatting is
 * parameterised.
 */

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine   = Animated.createAnimatedComponent(Line);

const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";

const { width: SCREEN_W } = Dimensions.get("window");

// ─── Chart color tokens (brand / subtle — fine on both themes) ────────────────
const SVG_GREEN = "#45B369";
const SVG_RED   = "#EF4770";
const SVG_GRID  = "#EBECEF";
const SVG_LABEL = "#9CA3AF";

// Chart dimensions
export const CHART_H = 220;
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
  if (period === "1W" || period === "1M") return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  if (period === "3M" || period === "6M") return d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
  return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

export interface PricePoint {
  date: string;
  close: number;
  volume: number;
  /** Change relative to the reference point (period start / previous close). */
  changePct: number | null;
}

export interface PriceChartProps {
  data: PricePoint[];
  positive: boolean;
  period: string;
  /** Prefix in the scrub tooltip, e.g. "MWK " (stock) or "K " (portfolio). */
  valuePrefix?: string;
  /** Message shown when fewer than two points are available. */
  emptyMessage?: string;
}

export function PriceChart({ data, positive, period, valuePrefix = "MWK ", emptyMessage = "Insufficient data for this period" }: PriceChartProps) {
  const c = useColors();
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
        <Text style={{ color: MUTED, fontFamily: "PlusJakartaSans_400Regular", fontSize: 12 }}>{emptyMessage}</Text>
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
  // Dedupe: with fewer points than label slots (e.g. 2 days of data) the
  // rounding maps several slots to the same index, stacking identical date
  // labels on top of each other into unreadable overdraw.
  const xLabelIdxs = Array.from(
    new Set([0, 1, 2, 3, 4].map((i) => Math.round((i / 4) * (data.length - 1)))),
  );

  const activeIdx   = selectedIdx !== null ? selectedIdx : data.length - 1;
  const activePt    = data[activeIdx];
  const priceTxt    = `${valuePrefix}${activePt.close.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const dateTxt     = new Date(activePt.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: period === "1Y" || period === "5Y" || period === "ALL" ? "numeric" : undefined });

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
          <SvgText key={i} x={xFor(idx)} y={PAD_TOP + plotH + 18} textAnchor={idx === 0 ? "start" : idx === data.length - 1 ? "end" : "middle"} fill={SVG_LABEL} fontSize={10} fontFamily="PlusJakartaSans_400Regular">
            {fmtXLabel(data[idx].date, period)}
          </SvgText>
        ))}
        <AnimatedLine animatedProps={vLineAnimProps} y1={PAD_TOP} y2={PAD_TOP + plotH} stroke={c.primary} strokeWidth={0.5} strokeLinecap="round" strokeDasharray="2 2" />
        <AnimatedLine animatedProps={hLineAnimProps} x1={Y_PAD} x2={SCREEN_W - PAD_R} stroke={c.primary} strokeWidth={0.5} strokeLinecap="round" strokeDasharray="2 2" />
        <AnimatedCircle animatedProps={dotAnimProps} r={4} fill={WHITE} stroke={SVG_GREEN} strokeWidth={2} />
      </Svg>
      <Animated.View style={[{ position: "absolute", width: TT_SIZE, backgroundColor: c.primary, borderRadius: TT_RX, alignItems: "center", justifyContent: "center", paddingHorizontal: 6, paddingVertical: 8 }, tooltipAnimStyle]}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: WHITE, fontSize: 12, fontFamily: "PlusJakartaSans_700Bold", textAlign: "center" }}>{priceTxt}</Text>
        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 10, fontFamily: "PlusJakartaSans_500Medium", marginTop: 4 }}>{dateTxt}</Text>
      </Animated.View>
    </View>
    </GestureDetector>
  );
}

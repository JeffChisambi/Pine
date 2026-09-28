import React, { useState, useEffect, useCallback } from "react";
import { View, Text } from "react-native";
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
import { useLayoutWidth } from "@/hooks/useLayoutWidth";

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


// ─── Chart color tokens (brand / subtle — fine on both themes) ────────────────
const SVG_GREEN = "#45B369";
const SVG_RED   = "#EF4770";
const SVG_GRID  = "#EBECEF";
const SVG_LABEL = "#9CA3AF";

// Chart dimensions
export const CHART_H = 220;
export const Y_PAD = 54;
export const PAD_R = 16;
export const PAD_TOP = 18;
export const PAD_BTM = 28;
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
  const SCREEN_W = useLayoutWidth();
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

// ─── Comparison chart ────────────────────────────────────────────────────────
/**
 * Two stocks on one set of axes, drawn with the chart chrome above: the same
 * padding, dashed grid, label type, crosshair and scrub tooltip as the stock
 * detail chart.
 *
 * The one deliberate difference is the y-axis. MSE counters trade orders of
 * magnitude apart, so plotting raw prices would flatten one line against the
 * axis. Both series are therefore percentage change from the period's first
 * close, and each line keeps its own colour instead of the single-series
 * green/red peak split.
 */
export interface ComparisonSeries {
  symbol: string;
  color: string;
  /** Oldest first. `pct` is change from the period's first close. */
  points: Array<{ t: number; close: number; pct: number }>;
}

export interface ComparisonChartProps {
  a: ComparisonSeries;
  b: ComparisonSeries;
  period: string;
  /** Rendered width; defaults to the layout width, like PriceChart. */
  width?: number;
}

export function ComparisonChart({ a, b, period, width }: ComparisonChartProps) {
  const layoutW = useLayoutWidth();
  const SCREEN_W = width ?? layoutW;
  const c = useColors();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const animX = useSharedValue(0);
  const animYA = useSharedValue(0);
  const animYB = useSharedValue(0);
  const xsShared = useSharedValue<number[]>([]);
  const ysAShared = useSharedValue<number[]>([]);
  const ysBShared = useSharedValue<number[]>([]);

  const dotAProps = useAnimatedProps(() => ({ cx: animX.value, cy: animYA.value }));
  const dotBProps = useAnimatedProps(() => ({ cx: animX.value, cy: animYB.value }));
  const vLineProps = useAnimatedProps(() => ({ x1: animX.value, x2: animX.value }));

  const plotW = SCREEN_W - Y_PAD - PAD_R;
  const plotH = CHART_H - PAD_TOP - PAD_BTM;

  // Both lines are sampled onto one shared timeline so a single scrub
  // position reads a comparable point on each of them.
  const grid = React.useMemo(() => {
    const tMin = Math.min(a.points[0]?.t ?? 0, b.points[0]?.t ?? 0);
    const tMax = Math.max(
      a.points[a.points.length - 1]?.t ?? 0,
      b.points[b.points.length - 1]?.t ?? 0,
    );
    const span = tMax - tMin || 1;
    const STEPS = 60;
    const at = (s: ComparisonSeries, t: number) => {
      const pts = s.points;
      if (!pts.length) return null;
      if (t <= pts[0].t) return pts[0];
      if (t >= pts[pts.length - 1].t) return pts[pts.length - 1];
      let lo = 0;
      for (let i = 1; i < pts.length; i++) {
        if (pts[i].t <= t) lo = i;
        else break;
      }
      return pts[lo];
    };
    const ts = Array.from({ length: STEPS + 1 }, (_, i) => tMin + (span * i) / STEPS);
    const sampled = ts.map((t) => ({ t, a: at(a, t), b: at(b, t) }));
    const all = [...a.points, ...b.points].map((p) => p.pct);
    let yMin = Math.min(0, ...all);
    let yMax = Math.max(0, ...all);
    const ySpan = yMax - yMin || 1;
    yMin -= ySpan * 0.08;
    yMax += ySpan * 0.08;
    const x = (t: number) => Y_PAD + ((t - tMin) / span) * plotW;
    const y = (v: number) => PAD_TOP + (1 - (v - yMin) / (yMax - yMin)) * plotH;
    const pathFor = (s: ComparisonSeries) =>
      s.points
        .map((p, i) => (i === 0 ? "M" : "L") + x(p.t).toFixed(1) + "," + y(p.pct).toFixed(1))
        .join(" ");
    return {
      sampled,
      x,
      y,
      pathA: pathFor(a),
      pathB: pathFor(b),
      yTicks: [0, 1, 2, 3, 4].map((i) => yMin + ((yMax - yMin) * (4 - i)) / 4),
      zeroY: y(0),
    };
  }, [a, b, plotW, plotH]);

  const snapToIdx = useCallback((idx: number) => {
    const xs = xsShared.value;
    const ya = ysAShared.value;
    const yb = ysBShared.value;
    if (xs.length < 2) return;
    animX.value = xs[idx];
    animYA.value = ya[idx];
    animYB.value = yb[idx];
  }, []);

  useEffect(() => {
    const xs = grid.sampled.map((s) => grid.x(s.t));
    xsShared.value = xs;
    ysAShared.value = grid.sampled.map((s) => grid.y(s.a?.pct ?? 0));
    ysBShared.value = grid.sampled.map((s) => grid.y(s.b?.pct ?? 0));
    setSelectedIdx(null);
    snapToIdx(xs.length - 1);
  }, [grid]);

  const pickAndSnap = (x: number, animate: boolean) => {
    "worklet";
    const xs = xsShared.value;
    const ya = ysAShared.value;
    const yb = ysBShared.value;
    const len = xs.length;
    if (len < 2) return;
    const t = Math.max(0, Math.min(1, (x - Y_PAD) / plotW));
    const idx = Math.round(t * (len - 1));
    if (animate) {
      const cfg = { damping: 20, stiffness: 300, mass: 0.6 };
      animX.value = withSpring(xs[idx], cfg);
      animYA.value = withSpring(ya[idx], cfg);
      animYB.value = withSpring(yb[idx], cfg);
    } else {
      animX.value = xs[idx];
      animYA.value = ya[idx];
      animYB.value = yb[idx];
    }
    runOnJS(setSelectedIdx)(idx);
  };

  const gesture = Gesture.Pan()
    .minDistance(0)
    .activeOffsetX([-4, 4])
    .onBegin((e) => {
      "worklet";
      pickAndSnap(e.x, true);
    })
    .onUpdate((e) => {
      "worklet";
      pickAndSnap(e.x, false);
    });

  const TT_W = 136;
  const tooltipAnimStyle = useAnimatedStyle(() => {
    const x = Math.max(Y_PAD, Math.min(SCREEN_W - TT_W - 4, animX.value - TT_W / 2));
    const above = Math.min(animYA.value, animYB.value) - 70;
    return { left: x, top: above >= PAD_TOP ? above : Math.max(animYA.value, animYB.value) + 12 };
  });

  if (a.points.length < 2 || b.points.length < 2) {
    return (
      <View style={{ width: SCREEN_W, height: CHART_H, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: MUTED, fontFamily: "PlusJakartaSans_400Regular", fontSize: 12 }}>Insufficient data for this period</Text>
      </View>
    );
  }

  const activeIdx = selectedIdx !== null ? selectedIdx : grid.sampled.length - 1;
  const active = grid.sampled[activeIdx];
  const dateTxt = new Date(active.t).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: period === "1Y" || period === "2Y" || period === "5Y" || period === "ALL" ? "numeric" : undefined,
  });
  const xLabelIdxs = Array.from(
    new Set([0, 1, 2, 3, 4].map((i) => Math.round((i / 4) * (grid.sampled.length - 1)))),
  );
  const pctTxt = (v: number | undefined) => ((v ?? 0) >= 0 ? "+" : "") + (v ?? 0).toFixed(2) + "%";

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ width: SCREEN_W, height: CHART_H }}>
        <Svg width={SCREEN_W} height={CHART_H}>
          {grid.yTicks.map((v, i) => {
            const y = grid.y(v);
            return (
              <React.Fragment key={i}>
                <Line x1={Y_PAD} y1={y} x2={SCREEN_W - PAD_R} y2={y} stroke={SVG_GRID} strokeWidth={1} strokeLinecap="round" strokeDasharray="3 3" />
                <SvgText x={Y_PAD - 6} y={y + 4} textAnchor="end" fill={SVG_LABEL} fontSize={10} fontFamily="PlusJakartaSans_400Regular">
                  {(v >= 0 ? "+" : "") + v.toFixed(1) + "%"}
                </SvgText>
              </React.Fragment>
            );
          })}
          {/* The 0% line: where both stocks started the period */}
          <Line x1={Y_PAD} y1={grid.zeroY} x2={SCREEN_W - PAD_R} y2={grid.zeroY} stroke={SVG_LABEL} strokeWidth={1} opacity={0.6} />
          <Path d={grid.pathB} stroke={b.color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Path d={grid.pathA} stroke={a.color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {xLabelIdxs.map((idx, i) => (
            <SvgText
              key={i}
              x={grid.x(grid.sampled[idx].t)}
              y={PAD_TOP + plotH + 18}
              textAnchor={idx === 0 ? "start" : idx === grid.sampled.length - 1 ? "end" : "middle"}
              fill={SVG_LABEL}
              fontSize={10}
              fontFamily="PlusJakartaSans_400Regular"
            >
              {fmtXLabel(new Date(grid.sampled[idx].t).toISOString(), period)}
            </SvgText>
          ))}
          <AnimatedLine animatedProps={vLineProps} y1={PAD_TOP} y2={PAD_TOP + plotH} stroke={c.primary} strokeWidth={0.5} strokeLinecap="round" strokeDasharray="2 2" />
          <AnimatedCircle animatedProps={dotBProps} r={4} fill={WHITE} stroke={b.color} strokeWidth={2} />
          <AnimatedCircle animatedProps={dotAProps} r={4} fill={WHITE} stroke={a.color} strokeWidth={2} />
        </Svg>
        <Animated.View style={[{ position: "absolute", width: TT_W, backgroundColor: c.primary, borderRadius: TT_RX, paddingHorizontal: 10, paddingVertical: 8 }, tooltipAnimStyle]}>
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 10, fontFamily: "PlusJakartaSans_500Medium", marginBottom: 2 }}>{dateTxt}</Text>
          {([[a, active.a?.pct], [b, active.b?.pct]] as const).map(([s, pct]) => (
            <View key={s.symbol} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
              <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: s.color }} />
              <Text style={{ color: WHITE, fontSize: 11, fontFamily: "PlusJakartaSans_600SemiBold", flex: 1 }}>{s.symbol}</Text>
              <Text style={{ color: WHITE, fontSize: 11, fontFamily: "PlusJakartaSans_700Bold", fontVariant: ["tabular-nums"] }}>{pctTxt(pct)}</Text>
            </View>
          ))}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

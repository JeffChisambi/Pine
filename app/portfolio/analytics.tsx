import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Circle, Line } from "react-native-svg";
import { guardedBack } from "@/utils/navigation";
import { useColors } from "@/hooks/useColors";
import { PriceChart, PricePoint, CHART_H } from "@/components/PriceChart";
import {
  useHoldings,
  usePortfolioSummary,
  usePortfolioPerformance,
  PERFORMANCE_PERIODS,
  PerformancePeriod,
} from "@/hooks/usePortfolio";

// ─── Static brand tokens (same as stock page / portfolio tab) ─────────────────
const GREEN = "#45B369";
const RED   = "#EF4770";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";
const SVG_GRID = "#EBECEF";

const { width: SCREEN_W } = Dimensions.get("window");

const fmtK = (n: number, digits = 2) =>
  `K ${Math.abs(n).toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: digits })}`;

const fmtSigned = (n: number) => `${n > 0 ? "+" : n < 0 ? "-" : ""}${fmtK(n)}`;

const fmtPct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;

function ArrowUpIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path d="M7 11V3M3 7l4-4 4 4" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ArrowDownIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path d="M7 3v8M3 7l4 4 4-4" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/**
 * Empty state for a brand-new portfolio: no daily snapshots exist yet, so
 * the only truthful thing to plot is today's value as a single point.
 * Same canvas size as the real chart so the layout doesn't jump once the
 * first snapshot lands.
 */
function SinglePointChart({ value, primary }: { value: number; primary: string }) {
  const Y_PAD = 54, PAD_R = 16;
  const midY = CHART_H / 2 - 8;
  const dotX = SCREEN_W - PAD_R - 6;
  return (
    <View style={{ width: SCREEN_W, height: CHART_H, alignItems: "center", justifyContent: "center" }}>
      <Svg width={SCREEN_W} height={CHART_H} style={{ position: "absolute" }}>
        {[0, 1, 2, 3, 4].map((i) => {
          const y = 18 + (i / 4) * (CHART_H - 18 - 28);
          return <Line key={i} x1={Y_PAD} y1={y} x2={SCREEN_W - PAD_R} y2={y} stroke={SVG_GRID} strokeWidth={1} strokeLinecap="round" strokeDasharray="3 3" />;
        })}
        <Line x1={Y_PAD} y1={midY} x2={dotX} y2={midY} stroke={GREEN} strokeWidth={1.5} strokeLinecap="round" strokeDasharray="2 4" opacity={0.5} />
        <Circle cx={dotX} cy={midY} r={4} fill={WHITE} stroke={GREEN} strokeWidth={2} />
      </Svg>
      <View style={{ backgroundColor: primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, alignItems: "center", marginTop: -36 }}>
        <Text style={{ color: WHITE, fontSize: 12, fontFamily: "PlusJakartaSans_700Bold" }}>{fmtK(value)}</Text>
        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 10, fontFamily: "PlusJakartaSans_500Medium", marginTop: 4 }}>
          {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </Text>
      </View>
      <Text style={{ color: MUTED, fontFamily: "PlusJakartaSans_500Medium", fontSize: 12, marginTop: 34 }}>Your history starts today</Text>
      <Text style={{ color: MUTED, fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, marginTop: 3 }}>Daily snapshots are recorded after market close</Text>
    </View>
  );
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function PortfolioAnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 16;
  const bottomPad = insets.bottom || 16;
  const c = useColors();

  const [period, setPeriod] = useState<PerformancePeriod>("1M");

  const { data: summary, isLoading: summaryLoading, error: summaryError, refetch: refetchSummary } = usePortfolioSummary();
  const { data: perf, isLoading: perfLoading, isFetching: perfFetching, refetch: refetchPerf } = usePortfolioPerformance(period);
  const { data: holdings = [] } = useHoldings();

  // Snapshots store holdings + wallet cash, so the live "today" point must be
  // built the same way or the last step of the line would be a fake drop.
  const liveValue = summary ? Number(summary.totalMarketValue ?? 0) + Number(summary.cashBalance ?? 0) : null;

  const chartData = useMemo<PricePoint[]>(() => {
    const series = perf?.series ?? [];
    const pts: { date: string; close: number }[] = series.map((s) => ({ date: s.date, close: Number(s.totalValue) }));

    if (liveValue !== null) {
      const today = new Date();
      const last = pts[pts.length - 1];
      if (last && isSameDay(new Date(last.date), today)) {
        // Today's snapshot is stale by definition (cron runs at close) — show live.
        pts[pts.length - 1] = { date: last.date, close: liveValue };
      } else if (pts.length > 0) {
        pts.push({ date: today.toISOString(), close: liveValue });
      }
    }

    const base = pts[0]?.close ?? 0;
    return pts.map((p) => ({
      date: p.date,
      close: p.close,
      volume: 0,
      changePct: base > 0 ? ((p.close - base) / base) * 100 : null,
    }));
  }, [perf?.series, liveValue]);

  const hasHistory = chartData.length >= 2;
  const first = chartData[0];
  const lastPt = chartData[chartData.length - 1];
  const changeAbs = hasHistory && first && lastPt ? lastPt.close - first.close : 0;
  const changePct = hasHistory && first && first.close > 0 ? (changeAbs / first.close) * 100 : 0;
  const direction: "up" | "down" | "flat" = changeAbs > 0 ? "up" : changeAbs < 0 ? "down" : "flat";
  const changeColor = direction === "up" ? GREEN : direction === "down" ? RED : c.mutedForeground;

  const headlineValue = liveValue ?? lastPt?.close ?? null;

  // Best / worst holding by unrealized %, only when there is something to rank.
  const ranked = useMemo(() => {
    const withPnl = holdings.filter((h) => Number(h.quantity) > 0);
    if (withPnl.length === 0) return { best: null, worst: null };
    const sorted = [...withPnl].sort((a, b) => Number(b.pnlPercent) - Number(a.pnlPercent));
    return { best: sorted[0], worst: sorted.length > 1 ? sorted[sorted.length - 1] : null };
  }, [holdings]);

  const unrealized = Number(summary?.totalUnrealizedPnl ?? 0);
  const unrealizedPct = Number(summary?.totalPnlPercent ?? 0);
  const dailyReturn = Number(perf?.metrics?.dailyReturn ?? 0);
  const dailyReturnPct = Number(perf?.metrics?.dailyReturnPct ?? 0);

  const pnlColor = (n: number) => (n > 0 ? GREEN : n < 0 ? RED : c.text);

  const tiles: { label: string; value: string; sub?: string; color?: string }[] = [
    { label: "Invested", value: summary ? fmtK(Number(summary.totalInvested ?? 0)) : "—" },
    { label: "Cash", value: summary ? fmtK(Number(summary.cashBalance ?? 0)) : "—" },
    {
      label: "Unrealized P&L",
      value: summary ? fmtSigned(unrealized) : "—",
      sub: summary ? fmtPct(unrealizedPct) : undefined,
      color: summary ? pnlColor(unrealized) : undefined,
    },
    {
      label: "Today",
      value: perf ? fmtSigned(dailyReturn) : "—",
      sub: perf ? fmtPct(dailyReturnPct) : undefined,
      color: perf ? pnlColor(dailyReturn) : undefined,
    },
    ...(ranked.best
      ? [{ label: "Best holding", value: ranked.best.symbol, sub: fmtPct(Number(ranked.best.pnlPercent)), color: pnlColor(Number(ranked.best.pnlPercent)) }]
      : []),
    ...(ranked.worst
      ? [{ label: "Worst holding", value: ranked.worst.symbol, sub: fmtPct(Number(ranked.worst.pnlPercent)), color: pnlColor(Number(ranked.worst.pnlPercent)) }]
      : []),
  ];

  const periodLabel: Record<PerformancePeriod, string> = {
    "1W": "past week", "1M": "past month", "3M": "past 3 months", "1Y": "past year", ALL: "all time",
  };

  if (summaryError && !summary) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background, paddingTop: topPad, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: RED, fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 16 }}>Could not load your portfolio</Text>
        <Text style={{ color: MUTED, fontFamily: "PlusJakartaSans_400Regular", marginTop: 4 }}>Check your connection</Text>
        <TouchableOpacity onPress={() => { refetchSummary(); refetchPerf(); }} style={{ marginTop: 16, backgroundColor: c.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 }}>
          <Text style={{ color: WHITE, fontFamily: "PlusJakartaSans_600SemiBold" }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: c.background }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 + bottomPad }}
      >
        {/* Top section — same nav + inline header pattern as the stock page */}
        <View style={{ backgroundColor: c.background, paddingTop: topPad, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: c.border }}>
          <View style={{ paddingHorizontal: 20, flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity onPress={() => guardedBack("/(tabs)/portfolio")} style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path d="M15 19l-7-7 7-7" stroke={c.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
            <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 17, color: c.text, marginLeft: 4 }}>Portfolio Analytics</Text>
          </View>

          <View style={{ paddingHorizontal: 24, marginTop: 14 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: c.mutedForeground, letterSpacing: 0.3, marginBottom: 6 }}>
              Total portfolio value
            </Text>
            {headlineValue === null ? (
              summaryLoading ? <ActivityIndicator color={GREEN} style={{ alignSelf: "flex-start", marginVertical: 10 }} /> :
              <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 34, color: c.text, letterSpacing: -1 }}>—</Text>
            ) : (
              <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 34, color: c.text, letterSpacing: -1 }} adjustsFontSizeToFit numberOfLines={1}>
                {fmtK(headlineValue)}
              </Text>
            )}

            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: c.card, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: c.border }}>
                {hasHistory && direction === "up" && <ArrowUpIcon color={GREEN} />}
                {hasHistory && direction === "down" && <ArrowDownIcon color={RED} />}
                <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: hasHistory ? changeColor : c.mutedForeground }}>
                  {hasHistory ? `${fmtSigned(changeAbs)} (${fmtPct(changePct)})` : "No change yet"}
                </Text>
              </View>
              <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: c.mutedForeground }}>{periodLabel[period]}</Text>
            </View>
          </View>
        </View>

        {/* Chart card — identical period pills + chart as the stock page */}
        <View style={{ backgroundColor: c.background, paddingTop: 14, paddingBottom: 4 }}>
          <View style={{ flexDirection: "row", marginHorizontal: 16, marginBottom: 10, gap: 4, justifyContent: "center" }}>
            {PERFORMANCE_PERIODS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={{ paddingVertical: 7, paddingHorizontal: 13, alignItems: "center", borderRadius: 8, backgroundColor: period === tab ? c.primary : "transparent" }}
                onPress={() => setPeriod(tab)}
                activeOpacity={0.75}
              >
                <Text style={{ fontFamily: period === tab ? "PlusJakartaSans_600SemiBold" : "PlusJakartaSans_500Medium", fontSize: 12, color: period === tab ? WHITE : c.text }}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {perfLoading || (summaryLoading && !summary) ? (
            <View style={{ width: SCREEN_W, height: CHART_H, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator size="large" color={GREEN} />
            </View>
          ) : hasHistory ? (
            <View style={{ opacity: perfFetching ? 0.6 : 1 }}>
              <PriceChart data={chartData} positive={direction !== "down"} period={period} valuePrefix="K " emptyMessage="Not enough history for this period" />
            </View>
          ) : (
            <SinglePointChart value={headlineValue ?? 0} primary={c.primary} />
          )}
        </View>

        {/* Breakdown */}
        <View style={{ backgroundColor: c.background, paddingTop: 8 }}>
          <View style={{ height: 1, backgroundColor: c.border, marginHorizontal: 24 }} />
          <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 17, color: c.text, marginBottom: 14 }}>Breakdown</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {tiles.map((t, idx) => (
                <View
                  key={t.label}
                  style={{
                    width: "50%",
                    paddingLeft: idx % 2 === 0 ? 0 : 12,
                    paddingRight: idx % 2 === 0 ? 12 : 0,
                    marginBottom: 20,
                    alignItems: idx % 2 === 0 ? "flex-start" : "flex-end",
                  }}
                >
                  <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED, marginBottom: 3 }}>{t.label}</Text>
                  <Text
                    style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: t.color ?? c.text, textAlign: idx % 2 === 0 ? "left" : "right" }}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {t.value}
                  </Text>
                  {t.sub && (
                    <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 12, color: t.color ?? MUTED, marginTop: 2 }}>{t.sub}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>

          <View style={{ marginHorizontal: 24, marginBottom: 8, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: c.card, borderRadius: 10, borderWidth: 1, borderColor: c.border }}>
            <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 11, color: c.primary }}>Value includes holdings at latest MSE close plus wallet cash</Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 10, color: MUTED, marginTop: 2 }}>
              History is recorded daily after market close and after every settled trade
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

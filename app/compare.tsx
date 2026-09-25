/**
 * Compare two stocks over a period.
 *
 * Prices on the MSE differ by orders of magnitude (NBM trades in the
 * thousands, some counters under MK 100), so the two lines are drawn as
 * percentage change from the first day of the period — the only scale on
 * which "which did better" can be read straight off the chart. The summary
 * underneath puts the numbers to it: each stock's return, its high and low
 * for the period, and the gap between the two.
 */
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Line, Path, Circle, Text as SvgText } from "react-native-svg";
import { useColors } from "@/hooks/useColors";
import { useLayoutWidth } from "@/hooks/useLayoutWidth";
import { useStockDetail, useStocks } from "@/hooks/useStocks";
import { guardedBack } from "@/utils/navigation";
import type { ApiStock, ApiStockDetail } from "@/services/api";

const PERIODS = ["1M", "3M", "6M", "1Y", "2Y", "5Y"] as const;
type Period = (typeof PERIODS)[number];

const COLOR_A = "#45B369";
const COLOR_B = "#6366F1";
const CHART_H = 230;
const PAD_L = 44;
const PAD_R = 12;
const PAD_T = 14;
const PAD_B = 26;

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19l-7-7 7-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDown({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

interface Series {
  points: Array<{ t: number; pct: number; close: number }>;
  returnPct: number;
  high: number;
  low: number;
  first: number;
  last: number;
}

/** Oldest-first closes → % change from the period's first close. */
function toSeries(detail: ApiStockDetail | undefined): Series | null {
  const hist = (detail?.priceHistory ?? [])
    .filter((p) => Number.isFinite(p.close) && p.close > 0)
    .map((p) => ({ t: new Date(p.date).getTime(), close: p.close }))
    .filter((p) => Number.isFinite(p.t))
    .sort((a, b) => a.t - b.t);
  if (hist.length < 2) return null;
  const first = hist[0].close;
  const last = hist[hist.length - 1].close;
  const closes = hist.map((p) => p.close);
  return {
    points: hist.map((p) => ({ t: p.t, close: p.close, pct: ((p.close - first) / first) * 100 })),
    returnPct: ((last - first) / first) * 100,
    high: Math.max(...closes),
    low: Math.min(...closes),
    first,
    last,
  };
}

const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
const fmtMK = (n: number) => `MK ${n.toLocaleString("en-MW", { maximumFractionDigits: 2 })}`;

export default function CompareScreen() {
  const params = useLocalSearchParams<{ a?: string; b?: string }>();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top;
  const width = useLayoutWidth();

  const { data: stocks = [], isLoading: loadingList } = useStocks();
  const [a, setA] = useState<string | undefined>(params.a);
  const [b, setB] = useState<string | undefined>(params.b);
  const [period, setPeriod] = useState<Period>("3M");
  const [picking, setPicking] = useState<"a" | "b" | null>(null);

  // Default the pair to the two largest names once the list arrives, so the
  // screen opens on a real comparison instead of two empty slots.
  const symA = a ?? stocks[0]?.symbol;
  const symB = b ?? stocks.find((s) => s.symbol !== symA)?.symbol;

  const qa = useStockDetail(symA, period);
  const qb = useStockDetail(symB, period);
  const sa = useMemo(() => toSeries(qa.data), [qa.data]);
  const sb = useMemo(() => toSeries(qb.data), [qb.data]);

  const chartW = width - 40;

  const chart = useMemo(() => {
    if (!sa || !sb) return null;
    const tMin = Math.min(sa.points[0].t, sb.points[0].t);
    const tMax = Math.max(sa.points[sa.points.length - 1].t, sb.points[sb.points.length - 1].t);
    const all = [...sa.points, ...sb.points].map((p) => p.pct);
    let yMin = Math.min(0, ...all);
    let yMax = Math.max(0, ...all);
    const span = yMax - yMin || 1;
    yMin -= span * 0.08;
    yMax += span * 0.08;
    const plotW = chartW - PAD_L - PAD_R;
    const plotH = CHART_H - PAD_T - PAD_B;
    const x = (t: number) => PAD_L + ((t - tMin) / (tMax - tMin || 1)) * plotW;
    const y = (v: number) => PAD_T + (1 - (v - yMin) / (yMax - yMin)) * plotH;
    const path = (s: Series) =>
      s.points.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.t).toFixed(1)},${y(p.pct).toFixed(1)}`).join(" ");
    const ticks = [yMax, (yMax + yMin) / 2, yMin].map((v) => ({ v, y: y(v) }));
    const fmtDate = (t: number) =>
      new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(period === "2Y" || period === "5Y" ? { year: "2-digit" } : {}) });
    return {
      pathA: path(sa),
      pathB: path(sb),
      zeroY: y(0),
      ticks,
      endA: { x: x(sa.points[sa.points.length - 1].t), y: y(sa.returnPct) },
      endB: { x: x(sb.points[sb.points.length - 1].t), y: y(sb.returnPct) },
      startLabel: fmtDate(tMin),
      endLabel: fmtDate(tMax),
    };
  }, [sa, sb, chartW, period]);

  const loading = qa.isLoading || qb.isLoading || loadingList;
  const nameOf = (sym?: string) => stocks.find((s) => s.symbol === sym)?.name ?? "";

  const verdict = useMemo(() => {
    if (!sa || !sb || !symA || !symB) return null;
    const gap = sa.returnPct - sb.returnPct;
    if (Math.abs(gap) < 0.01) return `${symA} and ${symB} moved the same over this period.`;
    const [winner, loser] = gap > 0 ? [symA, symB] : [symB, symA];
    return `${winner} did better than ${loser} by ${Math.abs(gap).toFixed(2)} percentage points over this period.`;
  }, [sa, sb, symA, symB]);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => guardedBack("/(tabs)")} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <BackIcon color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>Compare stocks</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32 }}>
        {/* Pickers */}
        <View style={styles.pickRow}>
          {([["a", symA, COLOR_A], ["b", symB, COLOR_B]] as const).map(([slot, sym, color]) => (
            <TouchableOpacity
              key={slot}
              onPress={() => setPicking(slot)}
              activeOpacity={0.8}
              style={[styles.pick, { borderColor: c.border, backgroundColor: c.card }]}
              accessibilityRole="button"
              accessibilityLabel={`Choose ${slot === "a" ? "first" : "second"} stock, currently ${sym ?? "none"}`}
            >
              <View style={[styles.swatch, { backgroundColor: color }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.pickSym, { color: c.text }]} numberOfLines={1}>{sym ?? "Choose"}</Text>
                <Text style={[styles.pickName, { color: c.mutedForeground }]} numberOfLines={1}>{nameOf(sym) || " "}</Text>
              </View>
              <ChevronDown color={c.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Periods */}
        <View style={[styles.periods, { backgroundColor: c.secondary }]}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              style={[styles.periodBtn, p === period && { backgroundColor: c.primary }]}
              accessibilityRole="button"
              accessibilityState={{ selected: p === period }}
            >
              <Text style={[styles.periodText, { color: p === period ? "#FFFFFF" : c.mutedForeground }]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart */}
        <View style={[styles.chartCard, { backgroundColor: c.card, borderColor: c.border }]}>
          {loading ? (
            <View style={{ height: CHART_H, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator color={COLOR_A} />
            </View>
          ) : !chart ? (
            <View style={{ height: CHART_H, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
              <Text style={{ color: c.mutedForeground, fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, textAlign: "center" }}>
                Not enough price history for {(!sa ? symA : symB) ?? "this stock"} in this period. Try a different period.
              </Text>
            </View>
          ) : (
            <Svg width={chartW} height={CHART_H}>
              {chart.ticks.map((t, i) => (
                <React.Fragment key={i}>
                  <Line x1={PAD_L} x2={chartW - PAD_R} y1={t.y} y2={t.y} stroke={c.border} strokeWidth={1} strokeDasharray="3 4" />
                  <SvgText x={PAD_L - 6} y={t.y + 4} fontSize={10} fill={c.mutedForeground} textAnchor="end">
                    {`${t.v >= 0 ? "+" : ""}${t.v.toFixed(1)}%`}
                  </SvgText>
                </React.Fragment>
              ))}
              {/* The 0% line: where each stock started */}
              <Line x1={PAD_L} x2={chartW - PAD_R} y1={chart.zeroY} y2={chart.zeroY} stroke={c.mutedForeground} strokeWidth={1} opacity={0.6} />
              <Path d={chart.pathB} stroke={COLOR_B} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
              <Path d={chart.pathA} stroke={COLOR_A} strokeWidth={2.4} fill="none" strokeLinejoin="round" strokeLinecap="round" />
              <Circle cx={chart.endB.x} cy={chart.endB.y} r={3.5} fill={COLOR_B} />
              <Circle cx={chart.endA.x} cy={chart.endA.y} r={3.5} fill={COLOR_A} />
              <SvgText x={PAD_L} y={CHART_H - 6} fontSize={10} fill={c.mutedForeground}>{chart.startLabel}</SvgText>
              <SvgText x={chartW - PAD_R} y={CHART_H - 6} fontSize={10} fill={c.mutedForeground} textAnchor="end">{chart.endLabel}</SvgText>
            </Svg>
          )}
        </View>

        {verdict && <Text style={[styles.verdict, { color: c.text }]}>{verdict}</Text>}

        {/* Side-by-side numbers */}
        {sa && sb && (
          <View style={[styles.table, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={[styles.tr, { borderBottomColor: c.border }]}>
              <Text style={[styles.th, { color: c.mutedForeground }]}> </Text>
              <Text style={[styles.thVal, { color: COLOR_A }]}>{symA}</Text>
              <Text style={[styles.thVal, { color: COLOR_B }]}>{symB}</Text>
            </View>
            {([
              ["Return", fmtPct(sa.returnPct), fmtPct(sb.returnPct), true],
              ["Start price", fmtMK(sa.first), fmtMK(sb.first), false],
              ["Latest price", fmtMK(sa.last), fmtMK(sb.last), false],
              ["Period high", fmtMK(sa.high), fmtMK(sb.high), false],
              ["Period low", fmtMK(sa.low), fmtMK(sb.low), false],
            ] as const).map(([label, va, vb, signed], i, arr) => (
              <View key={label} style={[styles.tr, i < arr.length - 1 && { borderBottomColor: c.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                <Text style={[styles.th, { color: c.mutedForeground }]}>{label}</Text>
                <Text style={[styles.td, { color: signed ? (sa.returnPct >= 0 ? COLOR_A : "#EF4444") : c.text }]}>{va}</Text>
                <Text style={[styles.td, { color: signed ? (sb.returnPct >= 0 ? COLOR_A : "#EF4444") : c.text }]}>{vb}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={[styles.foot, { color: c.mutedForeground }]}>
          Lines show each stock's % change from the first trading day in the period, so stocks at very different prices can be compared. Past performance does not predict future returns.
        </Text>
      </ScrollView>

      <StockPicker
        visible={picking != null}
        stocks={stocks}
        exclude={picking === "a" ? symB : symA}
        onClose={() => setPicking(null)}
        onPick={(sym) => {
          if (picking === "a") setA(sym);
          else setB(sym);
          setPicking(null);
        }}
      />
    </View>
  );
}

function StockPicker({ visible, stocks, exclude, onClose, onPick }: {
  visible: boolean;
  stocks: ApiStock[];
  exclude?: string;
  onClose: () => void;
  onPick: (symbol: string) => void;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return stocks
      .filter((s) => s.symbol !== exclude)
      .filter((s) => !needle || s.symbol.toLowerCase().includes(needle) || s.name.toLowerCase().includes(needle));
  }, [stocks, exclude, q]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
      <View style={{ flex: 1, backgroundColor: c.background, paddingTop: insets.top + 8 }}>
        <View style={styles.pickerHeader}>
          <Text style={[styles.headerTitle, { color: c.text }]}>Choose a stock</Text>
          <TouchableOpacity onPress={onClose} accessibilityRole="button">
            <Text style={{ color: c.primary, fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search by name or symbol"
          placeholderTextColor={c.mutedForeground}
          style={[styles.search, { borderColor: c.border, color: c.text, backgroundColor: c.card }]}
          autoCorrect={false}
        />
        <FlatList
          data={list}
          keyExtractor={(s) => s.symbol}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => { setQ(""); onPick(item.symbol); }} style={[styles.pickerRow, { borderBottomColor: c.border }]} activeOpacity={0.7}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.pickSym, { color: c.text }]}>{item.symbol}</Text>
                <Text style={[styles.pickName, { color: c.mutedForeground }]} numberOfLines={1}>{item.name}</Text>
              </View>
              <Text style={[styles.pickPrice, { color: c.text }]}>{item.price}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 17 },
  pickRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  pick: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  swatch: { width: 10, height: 10, borderRadius: 5 },
  pickSym: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 15 },
  pickName: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, marginTop: 1 },
  pickPrice: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13 },
  periods: { flexDirection: "row", borderRadius: 12, padding: 4, marginTop: 16 },
  periodBtn: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: "center" },
  periodText: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13 },
  chartCard: { borderWidth: 1, borderRadius: 16, marginTop: 16, overflow: "hidden" },
  verdict: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, lineHeight: 21, marginTop: 14 },
  table: { borderWidth: 1, borderRadius: 16, marginTop: 14, paddingHorizontal: 14 },
  tr: { flexDirection: "row", alignItems: "center", paddingVertical: 11 },
  th: { flex: 1.2, fontFamily: "PlusJakartaSans_400Regular", fontSize: 13 },
  thVal: { flex: 1, textAlign: "right", fontFamily: "PlusJakartaSans_700Bold", fontSize: 13 },
  td: { flex: 1, textAlign: "right", fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, fontVariant: ["tabular-nums"] },
  foot: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, lineHeight: 16, marginTop: 16 },
  pickerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
  search: { marginHorizontal: 20, height: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, marginBottom: 8 },
  pickerRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
});

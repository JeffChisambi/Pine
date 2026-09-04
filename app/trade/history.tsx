import { guardedBack, guardedPush } from "@/utils/navigation";
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { useQuery } from "@tanstack/react-query";
import { getStockLogo } from "../../utils/stock-logos";
import { useColors } from "@/hooks/useColors";
import { type TBillInvestment } from "@/data/treasury";
import { useMyInvestments } from "@/hooks/useTreasury";
import { mapInvestment } from "@/utils/treasury-map";
import { tradingApi, walletApi } from "../../services/api";

const GREEN = "#45B369";
const RED = "#EF4770";
const AMBER = "#F59E0B";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";

function ArrowIcon({ type }: { type: "buy" | "sell" }) {
  const color = type === "buy" ? GREEN : RED;
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      {type === "buy" ? (
        <Path d="M8 12V4M4 8l4 4 4-4" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <Path d="M8 4v8M4 8l4-4 4 4" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      )}
    </Svg>
  );
}

type FilterType = "All" | "Pending" | "Complete";
const FILTERS: FilterType[] = ["All", "Pending", "Complete"];

interface Order {
  id: string; ticker: string; name: string; image: any;
  type: "buy" | "sell"; date: string; time: string;
  amount: string; shares: string; status: "Pending" | "Complete" | "Cancelled" | "Rejected";
  /** Set on rejected orders — the reason the broker/system gave. */
  reason?: string | null;
  change: string; positive: boolean;
  /** Sort key */
  ts: number;
}

/** Wallet money movements shown alongside orders (deposits, withdrawals, dividends…). */
interface MoneyEntry {
  id: string;
  kind: "deposit" | "withdrawal" | "dividend" | "other";
  label: string;
  sub: string;
  amount: string;
  positive: boolean;
  status: "Pending" | "Complete" | "Cancelled";
  date: string;
  time: string;
  ts: number;
}

type HistoryRow =
  | { rowType: "order"; item: Order }
  | { rowType: "money"; item: MoneyEntry };

function groupRowsByDate(rows: HistoryRow[]): { date: string; rows: HistoryRow[] }[] {
  const map: Record<string, HistoryRow[]> = {};
  for (const r of rows) {
    const d = r.item.date;
    if (!map[d]) map[d] = [];
    map[d].push(r);
  }
  return Object.entries(map).map(([date, rows]) => ({ date, rows }));
}

function fmtDateLabel(iso: string): { date: string; time: string; ts: number } {
  const d = new Date(iso);
  const ts = d.getTime();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const day = new Date(d); day.setHours(0, 0, 0, 0);
  const date =
    day.getTime() === today.getTime() ? "Today"
    : day.getTime() === yesterday.getTime() ? "Yesterday"
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return { date, time, ts: isNaN(ts) ? 0 : ts };
}

function mapOrderStatus(s: string): Order["status"] {
  const u = (s || "").toUpperCase();
  if (["FILLED", "COMPLETED", "SETTLED", "PENDING_SETTLEMENT", "PARTIALLY_FILLED"].includes(u)) return "Complete";
  // Rejected is its own outcome: the investor did not cancel it, and they
  // need to know why it was refused.
  if (u === "REJECTED") return "Rejected";
  if (["CANCELLED", "EXPIRED"].includes(u)) return "Cancelled";
  return "Pending";
}

function mapTxStatus(s: string): MoneyEntry["status"] {
  const u = (s || "").toUpperCase();
  if (u === "COMPLETED") return "Complete";
  if (["FAILED", "REVERSED", "CANCELLED"].includes(u)) return "Cancelled";
  return "Pending";
}

function StatusBadge({ status }: { status: Order["status"] }) {
  const configs = {
    Pending:   { bg: AMBER + "28", text: AMBER },
    Complete:  { bg: "transparent",  text: GREEN },
    Cancelled: { bg: RED   + "28", text: RED   },
    Rejected:  { bg: RED   + "28", text: RED   },
  };
  const cfg = configs[status];
  return (
    <View style={{ borderRadius: 10, paddingHorizontal: status === "Complete" ? 0 : 8, paddingVertical: 3, backgroundColor: cfg.bg }}>
      <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 11, color: cfg.text }}>{status}</Text>
    </View>
  );
}

function TBillStatusPill({ status }: { status: TBillInvestment["status"] }) {
  const configs = {
    active:  { bg: GREEN + "22", text: GREEN,   label: "Active" },
    pending: { bg: AMBER + "22", text: AMBER,   label: "Pending" },
    matured: { bg: "#6366F122",  text: "#6366F1", label: "Matured" },
    closed:  { bg: MUTED + "22", text: MUTED,   label: "Closed" },
  };
  const cfg = configs[status];
  return (
    <View style={{ borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: cfg.bg }}>
      <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 11, color: cfg.text }}>{cfg.label}</Text>
    </View>
  );
}

function TBillsSection({ c, filter }: { c: ReturnType<typeof useColors>; filter: FilterType }) {
  // Real investments from the backend (was hardcoded mock data).
  const { data: apiInvestments = [] } = useMyInvestments();
  const all: TBillInvestment[] = apiInvestments.map(mapInvestment);
  const investments = all.filter((inv) => {
    if (filter === "Pending") return inv.status === "pending";
    if (filter === "Complete") return inv.status === "matured";
    return true;
  });

  if (investments.length === 0) return null;

  return (
    <View style={{ marginTop: 8 }}>
      <View style={{ paddingVertical: 8, marginBottom: 4 }}>
        <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 12, color: MUTED, letterSpacing: 0.5, textTransform: "uppercase" }}>Debt Securities</Text>
      </View>
      {investments.map((inv, i) => (
        <TouchableOpacity
          key={inv.id}
          activeOpacity={0.75}
          onPress={() => guardedPush(() => router.push({ pathname: "/treasury/investment-detail" as any, params: { id: inv.id } }))}
          style={[
            { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 12 },
            i < investments.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border },
          ]}
        >
          {/* T-Bill icon */}
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.primary + "18", alignItems: "center", justifyContent: "center" }}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke={c.primary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M9 22V12h6v10" stroke={c.primary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: c.text, marginBottom: 3 }}>
              {inv.duration}-Day Bill
            </Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}>
              {inv.referenceNumber} · {inv.investmentDate}
            </Text>
          </View>

          <View style={{ alignItems: "flex-end", gap: 5 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text }}>
              MWK {inv.amountInvested.toLocaleString()}
            </Text>
            <TBillStatusPill status={inv.status} />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 16;
  const c = useColors();
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");

  // ── Real data: trading orders + wallet money movements ──────────────────
  const ordersQuery = useQuery({
    queryKey: ["trading", "history"],
    queryFn: () => tradingApi.getHistory(50),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
  const walletQuery = useQuery({
    queryKey: ["wallet", "history"],
    queryFn: () => walletApi.getHistory(50),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const orders: Order[] = useMemo(
    () =>
      (ordersQuery.data?.orders ?? []).map((o) => {
        const { date, time, ts } = fmtDateLabel(o.createdAt);
        const qty = Number(o.quantity) || 0;
        return {
          id: o.id,
          ticker: o.symbol,
          name: o.symbol,
          image: null,
          type: o.side === "BUY" ? "buy" as const : "sell" as const,
          date, time, ts,
          amount: `MWK ${Number(o.totalAmount ?? 0).toLocaleString()}`,
          shares: `${qty} share${qty === 1 ? "" : "s"}`,
          status: mapOrderStatus(o.status),
          reason: o.status?.toUpperCase() === "REJECTED" ? (o.rejectionReason ?? null) : null,
          change: "",
          positive: o.side === "SELL",
        };
      }),
    [ordersQuery.data],
  );

  const moneyEntries: MoneyEntry[] = useMemo(
    () =>
      (walletQuery.data?.transactions ?? [])
        // Trade debits/credits already appear as orders — show only money events.
        .filter((t) => !String(t.type).startsWith("TRADE_"))
        .map((t) => {
          const { date, time, ts } = fmtDateLabel(String(t.createdAt));
          const type = String(t.type).toUpperCase();
          const kind: MoneyEntry["kind"] =
            type === "DEPOSIT" ? "deposit"
            : type === "WITHDRAWAL" ? "withdrawal"
            : type.startsWith("DIVIDEND") ? "dividend"
            : "other";
          const label =
            kind === "deposit" ? "Deposit"
            : kind === "withdrawal" ? "Withdrawal"
            : kind === "dividend" ? "Dividend received"
            : type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, " ");
          return {
            id: t.id,
            kind,
            label,
            sub: t.description || time,
            amount: `${kind === "withdrawal" ? "-" : "+"}MWK ${Number(t.amount).toLocaleString()}`,
            positive: kind !== "withdrawal",
            status: mapTxStatus(String(t.status)),
            date, time, ts,
          };
        }),
    [walletQuery.data],
  );

  const rows: HistoryRow[] = useMemo(() => {
    const all: HistoryRow[] = [
      ...orders.map((o) => ({ rowType: "order" as const, item: o })),
      ...moneyEntries.map((m) => ({ rowType: "money" as const, item: m })),
    ];
    const byFilter =
      activeFilter === "All" ? all : all.filter((r) => r.item.status === activeFilter);
    return byFilter.sort((a, b) => b.item.ts - a.item.ts);
  }, [orders, moneyEntries, activeFilter]);

  const filtered = activeFilter === "All" ? orders : orders.filter((o) => o.status === activeFilter);
  const grouped = groupRowsByDate(rows);
  const isLoading = ordersQuery.isLoading || walletQuery.isLoading;

  return (
    <View style={{ flex: 1, backgroundColor: c.background, paddingTop: topPad }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => guardedBack("/(tabs)")} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M15 19l-7-7 7-7" stroke={c.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={{ flex: 1, fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: c.text, textAlign: "center" }}>Order History</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter tabs */}
      <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}>
        {FILTERS.map((f) => {
          const active = f === activeFilter;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.75}
              style={[
                { flex: 1, paddingVertical: 9, borderRadius: 20, borderWidth: 1, alignItems: "center" },
                active ? { backgroundColor: c.primary, borderColor: c.primary } : { backgroundColor: c.card, borderColor: c.border },
              ]}
            >
              <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, lineHeight: 18, color: active ? WHITE : c.text }}>{f}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Summary strip */}
      <View style={{ flexDirection: "row", marginHorizontal: 20, backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, paddingVertical: 12, marginBottom: 16 }}>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text, marginBottom: 2 }}>{filtered.length}</Text>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}>Orders</Text>
        </View>
        <View style={{ width: 1, backgroundColor: c.border, marginVertical: 4 }} />
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: GREEN, marginBottom: 2 }}>{filtered.filter((o) => o.type === "buy").length}</Text>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}>Buys</Text>
        </View>
        <View style={{ width: 1, backgroundColor: c.border, marginVertical: 4 }} />
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: RED, marginBottom: 2 }}>{filtered.filter((o) => o.type === "sell").length}</Text>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}>Sells</Text>
        </View>
      </View>

      {/* Unified history list: orders + deposits + withdrawals + dividends */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator color={c.primary} />
          </View>
        ) : grouped.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: MUTED }}>No {activeFilter.toLowerCase()} activity yet</Text>
          </View>
        ) : (
          grouped.map(({ date, rows: dayRows }) => (
            <View key={date}>
              <View style={{ paddingVertical: 8, marginBottom: 4 }}>
                <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 12, color: MUTED, letterSpacing: 0.5, textTransform: "uppercase" }}>{date}</Text>
              </View>
              {dayRows.map((row, i) => {
                const borderStyle = i < dayRows.length - 1 ? { borderBottomWidth: 1, borderBottomColor: c.border } : null;
                if (row.rowType === "order") {
                  const order = row.item;
                  return (
                    <View key={`o-${order.id}`} style={[{ flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 12 }, borderStyle]}>
                      <View style={{ position: "relative" }}>
                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
                          {(order.image || getStockLogo(order.ticker)) ? (
                            <Image source={order.image || getStockLogo(order.ticker)!} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
                          ) : (
                            <View style={{ width: "100%", height: "100%", backgroundColor: c.primary, alignItems: "center", justifyContent: "center" }}>
                              <Text style={{ color: WHITE, fontFamily: "PlusJakartaSans_700Bold", fontSize: 10 }}>{order.ticker.slice(0, 3)}</Text>
                            </View>
                          )}
                        </View>
                        <View style={{ position: "absolute", bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: order.type === "buy" ? GREEN + "28" : RED + "28", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: c.background }}>
                          <ArrowIcon type={order.type} />
                        </View>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: c.text, marginBottom: 3 }}>{order.ticker}</Text>
                        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}>{order.type === "buy" ? "Buy" : "Sell"} · {order.shares} · {order.time}</Text>
                        {order.status === "Rejected" && (
                          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: RED, marginTop: 3, lineHeight: 17 }}>
                            {order.reason || "This order could not be processed."}
                          </Text>
                        )}
                      </View>
                      <View style={{ alignItems: "flex-end", gap: 5 }}>
                        <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text }}>{order.amount}</Text>
                        <StatusBadge status={order.status} />
                      </View>
                    </View>
                  );
                }
                const m = row.item;
                const iconColor = m.kind === "withdrawal" ? RED : m.kind === "dividend" ? c.primary : GREEN;
                return (
                  <View key={`m-${m.id}`} style={[{ flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 12 }, borderStyle]}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: iconColor + "18", alignItems: "center", justifyContent: "center" }}>
                      {m.kind === "dividend" ? (
                        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                          <Circle cx={12} cy={12} r={8.5} stroke={iconColor} strokeWidth={1.8} />
                          <Path d="M12 8v8M9.5 10.2c0-1 1.1-1.7 2.5-1.7s2.5.7 2.5 1.7-1.1 1.5-2.5 1.8-2.5.8-2.5 1.8 1.1 1.7 2.5 1.7 2.5-.7 2.5-1.7" stroke={iconColor} strokeWidth={1.5} strokeLinecap="round" />
                        </Svg>
                      ) : (
                        <Svg width={18} height={18} viewBox="0 0 16 16" fill="none">
                          {m.kind === "withdrawal" ? (
                            <Path d="M8 12V4M4 8l4-4 4 4" stroke={iconColor} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                          ) : (
                            <Path d="M8 4v8M4 8l4 4 4-4" stroke={iconColor} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                          )}
                        </Svg>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: c.text, marginBottom: 3 }}>{m.label}</Text>
                      <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }} numberOfLines={1}>{m.sub}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 5 }}>
                      <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: m.positive ? GREEN : c.text }}>{m.amount}</Text>
                      <StatusBadge status={m.status} />
                    </View>
                  </View>
                );
              })}
            </View>
          ))
        )}

        {/* Treasury Bills section */}
        <TBillsSection c={c} filter={activeFilter} />

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

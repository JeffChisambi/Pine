import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { getStockLogo } from "../../utils/stock-logos";

const TEAL = "#164951";
const GREEN = "#45B369";
const RED = "#EF4770";
const YELLOW = "#FFD84A";
const WHITE = "#FFFFFF";
const DARK = "#111827";
const MUTED = "#9CA3AF";
const DIVIDER = "#EBECEF";
const CARD_BG = "#F9FAFB";
const CARD_BORDER = "#F3F4F6";

function BackIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={DARK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

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

type FilterType = "All" | "Pending" | "Complete" | "Cancelled";

const FILTERS: FilterType[] = ["All", "Pending", "Complete", "Cancelled"];

interface Order {
  id: string;
  ticker: string;
  name: string;
  image: any;
  type: "buy" | "sell";
  date: string;
  time: string;
  amount: string;
  shares: string;
  status: "Pending" | "Complete" | "Cancelled";
  change: string;
  positive: boolean;
}

import { STOCKS } from "../data/stocks";

// Orders populated from GET /orders
const ORDERS: Order[] = [];

function groupByDate(orders: Order[]): { date: string; orders: Order[] }[] {
  const map: Record<string, Order[]> = {};
  for (const o of orders) {
    if (!map[o.date]) map[o.date] = [];
    map[o.date].push(o);
  }
  return Object.entries(map).map(([date, orders]) => ({ date, orders }));
}

function StatusBadge({ status }: { status: Order["status"] }) {
  const configs = {
    Pending: { bg: "#FEF9C3", text: "#92400E" },
    Complete: { bg: "#D1FADF", text: "#166534" },
    Cancelled: { bg: "#FEE2E2", text: "#991B1B" },
  };
  const cfg = configs[status];
  return (
    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.statusText, { color: cfg.text }]}>{status}</Text>
    </View>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");

  // API state — populated from GET /orders
  const [orders, setOrders] = useState<Order[]>(ORDERS);

  const filtered =
    activeFilter === "All" ? orders : orders.filter((o) => o.status === activeFilter);
  const grouped = groupByDate(filtered);

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={{ flexGrow: 0, flexShrink: 0 }}
      >
        {FILTERS.map((f) => {
          const active = f === activeFilter;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, active && styles.filterTabActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Summary row */}
      <View style={styles.summaryStrip}>
        <View style={styles.summaryStripItem}>
          <Text style={styles.summaryStripValue}>{filtered.length}</Text>
          <Text style={styles.summaryStripLabel}>Orders</Text>
        </View>
        <View style={styles.summaryStripDivider} />
        <View style={styles.summaryStripItem}>
          <Text style={[styles.summaryStripValue, { color: GREEN }]}>
            {filtered.filter((o) => o.type === "buy").length}
          </Text>
          <Text style={styles.summaryStripLabel}>Buys</Text>
        </View>
        <View style={styles.summaryStripDivider} />
        <View style={styles.summaryStripItem}>
          <Text style={[styles.summaryStripValue, { color: RED }]}>
            {filtered.filter((o) => o.type === "sell").length}
          </Text>
          <Text style={styles.summaryStripLabel}>Sells</Text>
        </View>
      </View>

      {/* Orders list */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {grouped.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No {activeFilter.toLowerCase()} orders</Text>
          </View>
        ) : (
          grouped.map(({ date, orders }) => (
            <View key={date}>
              <View style={styles.dateSectionHeader}>
                <Text style={styles.dateSectionText}>{date}</Text>
              </View>
              {orders.map((order, i) => (
                <View
                  key={order.id}
                  style={[
                    styles.orderCard,
                    i < orders.length - 1 && styles.orderCardBorder,
                  ]}
                >
                  {/* Left: Logo + type indicator */}
                  <View style={styles.logoWrap}>
                    <View style={[styles.logoCircle, { backgroundColor: WHITE, overflow: "hidden", borderWidth: 1, borderColor: CARD_BORDER }]}>
                      {(order.image || getStockLogo(order.ticker)) ? (
                        <Image source={order.image || getStockLogo(order.ticker)!} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
                      ) : (
                        <View style={{ width: "100%", height: "100%", backgroundColor: TEAL, alignItems: "center", justifyContent: "center", borderRadius: 18 }}>
                          <Text style={{ color: WHITE, fontFamily: "PlusJakartaSans_700Bold", fontSize: 10 }}>{order.ticker.slice(0, 3)}</Text>
                        </View>
                      )}
                    </View>
                    <View
                      style={[
                        styles.typeIndicator,
                        { backgroundColor: order.type === "buy" ? "#D1FADF" : "#FEE2E2" },
                      ]}
                    >
                      <ArrowIcon type={order.type} />
                    </View>
                  </View>

                  {/* Middle: Info */}
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderTicker}>{order.ticker}</Text>
                    <Text style={styles.orderMeta}>
                      {order.type === "buy" ? "Buy" : "Sell"} · {order.shares} · {order.time}
                    </Text>
                  </View>

                  {/* Right: Amount + status */}
                  <View style={styles.orderRight}>
                    <Text style={styles.orderAmount}>{order.amount}</Text>
                    <StatusBadge status={order.status} />
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WHITE },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    flex: 1,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 17,
    color: DARK,
    textAlign: "center",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 12,
  },
  filterTab: {
    paddingHorizontal: 18,
    height: 34,
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "#F3F4F6",
  },
  filterTabActive: {
    backgroundColor: GREEN,
  },
  filterText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 13,
    color: MUTED,
  },
  filterTextActive: {
    color: WHITE,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  summaryStrip: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingVertical: 12,
    marginBottom: 16,
  },
  summaryStripItem: { flex: 1, alignItems: "center" },
  summaryStripValue: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 18,
    color: DARK,
    marginBottom: 2,
  },
  summaryStripLabel: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED },
  summaryStripDivider: { width: 1, backgroundColor: DIVIDER, marginVertical: 4 },
  scroll: { paddingHorizontal: 20 },
  dateSectionHeader: {
    paddingVertical: 8,
    marginBottom: 4,
  },
  dateSectionText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: MUTED,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  orderCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  orderCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },
  logoWrap: { position: "relative" },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 10, color: WHITE, letterSpacing: 0.3 },
  typeIndicator: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: WHITE,
  },
  orderInfo: { flex: 1 },
  orderTicker: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: DARK, marginBottom: 3 },
  orderMeta: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED },
  orderRight: { alignItems: "flex-end", gap: 5 },
  orderAmount: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: DARK },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: { fontFamily: "PlusJakartaSans_500Medium", fontSize: 11 },
  emptyState: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: MUTED },
});

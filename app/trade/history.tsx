import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { getStockLogo } from "../../utils/stock-logos";
import { useColors } from "@/hooks/useColors";

const TEAL = "#164951";
const GREEN = "#45B369";
const RED = "#EF4770";
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

type FilterType = "All" | "Pending" | "Complete" | "Cancelled";
const FILTERS: FilterType[] = ["All", "Pending", "Complete", "Cancelled"];

interface Order {
  id: string; ticker: string; name: string; image: any;
  type: "buy" | "sell"; date: string; time: string;
  amount: string; shares: string; status: "Pending" | "Complete" | "Cancelled";
  change: string; positive: boolean;
}

function groupByDate(orders: Order[]): { date: string; orders: Order[] }[] {
  const map: Record<string, Order[]> = {};
  for (const o of orders) { if (!map[o.date]) map[o.date] = []; map[o.date].push(o); }
  return Object.entries(map).map(([date, orders]) => ({ date, orders }));
}

function StatusBadge({ status }: { status: Order["status"] }) {
  const configs = { Pending: { bg: "#FEF9C3", text: "#92400E" }, Complete: { bg: "#D1FADF", text: "#166534" }, Cancelled: { bg: "#FEE2E2", text: "#991B1B" } };
  const cfg = configs[status];
  return (
    <View style={{ borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: cfg.bg }}>
      <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 11, color: cfg.text }}>{status}</Text>
    </View>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;
  const c = useColors();
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [orders] = useState<Order[]>([]);

  const filtered = activeFilter === "All" ? orders : orders.filter((o) => o.status === activeFilter);
  const grouped = groupByDate(filtered);

  return (
    <View style={{ flex: 1, backgroundColor: c.background, paddingTop: topPad }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M15 18l-6-6 6-6" stroke={c.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={{ flex: 1, fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: c.text, textAlign: "center" }}>Order History</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: "row", paddingHorizontal: 20, gap: 8, paddingBottom: 12 }} style={{ flexGrow: 0, flexShrink: 0 }}>
        {FILTERS.map((f) => {
          const active = f === activeFilter;
          return (
            <TouchableOpacity key={f} style={{ paddingHorizontal: 18, height: 34, justifyContent: "center", borderRadius: 17, backgroundColor: active ? GREEN : c.card, borderWidth: active ? 0 : 1, borderColor: c.border }} onPress={() => setActiveFilter(f)}>
              <Text style={{ fontFamily: active ? "PlusJakartaSans_600SemiBold" : "PlusJakartaSans_500Medium", fontSize: 13, color: active ? WHITE : MUTED }}>{f}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

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

      {/* Orders list */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        {grouped.length === 0 ? (
          <View style={{ paddingVertical: 60, alignItems: "center" }}>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: MUTED }}>No {activeFilter.toLowerCase()} orders</Text>
          </View>
        ) : (
          grouped.map(({ date, orders }) => (
            <View key={date}>
              <View style={{ paddingVertical: 8, marginBottom: 4 }}>
                <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 12, color: MUTED, letterSpacing: 0.5, textTransform: "uppercase" }}>{date}</Text>
              </View>
              {orders.map((order, i) => (
                <View key={order.id} style={[{ flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 12 }, i < orders.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border }]}>
                  <View style={{ position: "relative" }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
                      {(order.image || getStockLogo(order.ticker)) ? (
                        <Image source={order.image || getStockLogo(order.ticker)!} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
                      ) : (
                        <View style={{ width: "100%", height: "100%", backgroundColor: TEAL, alignItems: "center", justifyContent: "center" }}>
                          <Text style={{ color: WHITE, fontFamily: "PlusJakartaSans_700Bold", fontSize: 10 }}>{order.ticker.slice(0, 3)}</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ position: "absolute", bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: order.type === "buy" ? "#D1FADF" : "#FEE2E2", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: c.background }}>
                      <ArrowIcon type={order.type} />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: c.text, marginBottom: 3 }}>{order.ticker}</Text>
                    <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}>{order.type === "buy" ? "Buy" : "Sell"} · {order.shares} · {order.time}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 5 }}>
                    <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text }}>{order.amount}</Text>
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

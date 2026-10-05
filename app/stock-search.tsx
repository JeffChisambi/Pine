import { guardedBack, guardedPush } from "@/utils/navigation";
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { SearchIcon } from "@/components/icons/AppIcons";
import { getStockLogo } from "../utils/stock-logos";
import { useStocks, useStockSearch } from "../hooks/useStocks";
import { useColors } from "@/hooks/useColors";

const GREEN = "#45B369";
const RED = "#EF4770";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";


/**
 * Quick filters, in plain words.
 *
 * Someone new to investing does not arrive knowing a ticker. They arrive
 * knowing a budget, or that they want something that is going up. Each
 * filter answers one of those questions and says what it does underneath,
 * so a beginner learns what "most traded" means by using it.
 */
type QuickFilter = "all" | "affordable" | "rising" | "falling" | "active";

const AFFORDABLE_MAX = 100;

const QUICK_FILTERS: Array<{ key: QuickFilter; label: string; hint: string }> = [
  { key: "all", label: "All", hint: "Every stock on the exchange." },
  {
    key: "affordable",
    label: `Under MK ${AFFORDABLE_MAX}`,
    hint: `Shares priced below MK ${AFFORDABLE_MAX}, so a small amount buys more of them. A low price does not mean a good deal.`,
  },
  {
    key: "rising",
    label: "Rising today",
    hint: "Stocks whose price is up today. One good day says little about the next.",
  },
  {
    key: "falling",
    label: "Falling today",
    hint: "Stocks whose price is down today. Some investors look here for bargains; a fall can also continue.",
  },
  {
    key: "active",
    label: "Most traded",
    hint: "The stocks with the most shares changing hands, which are usually the easiest to buy and sell.",
  },
];

/** "1,234,567" → 1234567. Volume arrives formatted for display. */
function parseVolume(v: string | null | undefined): number {
  const n = Number(String(v ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function FilterChip({
  label,
  active,
  onPress,
  c,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  c: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={{
        paddingVertical: 7,
        paddingHorizontal: 13,
        borderRadius: 999,
        backgroundColor: active ? c.primary : c.card,
        borderWidth: active ? 0 : 1,
        borderColor: c.border,
      }}
    >
      <Text
        style={{
          fontFamily: active ? "PlusJakartaSans_600SemiBold" : "PlusJakartaSans_500Medium",
          fontSize: 12.5,
          color: active ? WHITE : c.text,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function StockSearchScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 16;
  const c = useColors();
  const [query, setQuery] = useState("");

  // Optional sector filter — the market screen's sector tiles navigate here
  // with ?sector=<name> to show that sector's stocks.
  const { sector } = useLocalSearchParams<{ sector?: string }>();

  const { data: allStocks = [], isLoading: allLoading } = useStocks();
  const { data: searchResults = [], isLoading: searching } = useStockSearch(query);

  const [quick, setQuick] = useState<QuickFilter>("all");
  // Arriving from a sector tile on the market screen preselects that sector.
  const [sectorFilter, setSectorFilter] = useState<string | null>(sector ? String(sector) : null);

  const sectors = useMemo(
    () =>
      Array.from(new Set(allStocks.map((st) => st.sector).filter(Boolean) as string[])).sort((a, b) =>
        a.localeCompare(b),
      ),
    [allStocks],
  );

  const isQuerying = query.trim().length > 0;
  const baseList = isQuerying ? searchResults : allStocks;

  const displayList = useMemo(() => {
    let list = baseList;
    if (sectorFilter) {
      list = list.filter((st) => (st.sector ?? "").toLowerCase() === sectorFilter.toLowerCase());
    }
    switch (quick) {
      case "affordable":
        list = list.filter((st) => st.priceRaw > 0 && st.priceRaw < AFFORDABLE_MAX).sort((a, b) => a.priceRaw - b.priceRaw);
        break;
      case "rising":
        list = list.filter((st) => st.changePct > 0).sort((a, b) => b.changePct - a.changePct);
        break;
      case "falling":
        list = list.filter((st) => st.changePct < 0).sort((a, b) => a.changePct - b.changePct);
        break;
      case "active":
        list = [...list].sort((a, b) => parseVolume(b.volume) - parseVolume(a.volume));
        break;
    }
    return list;
  }, [baseList, sectorFilter, quick]);

  const isLoading = isQuerying ? searching : allLoading;
  const filtering = quick !== "all" || sectorFilter !== null;
  const activeHint = QUICK_FILTERS.find((f) => f.key === quick)?.hint;
  const clearFilters = () => {
    setQuick("all");
    setSectorFilter(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background, paddingTop: topPad }}>
      {/* Search bar row */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingBottom: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => guardedBack("/(tabs)")} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M15 19l-7-7 7-7" stroke={c.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <View style={{ flex: 1, height: 52, backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, gap: 10 }}>
          <SearchIcon color={query.length > 0 ? c.primary : MUTED} size={18} />
          <TextInput
            style={{ flex: 1, fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: c.text, height: "100%" }}
            placeholder="Search stocks…"
            placeholderTextColor={MUTED}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Circle cx={12} cy={12} r={10} fill={MUTED} />
                <Path d="M15 9L9 15M9 9L15 15" stroke={WHITE} strokeWidth={1.8} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={{ paddingBottom: 10 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
          keyboardShouldPersistTaps="handled"
        >
          {QUICK_FILTERS.map((f) => (
            <FilterChip key={f.key} label={f.label} active={quick === f.key} onPress={() => setQuick(f.key)} c={c} />
          ))}
        </ScrollView>

        {sectors.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 8, paddingTop: 8 }}
            keyboardShouldPersistTaps="handled"
          >
            <FilterChip label="Any sector" active={sectorFilter === null} onPress={() => setSectorFilter(null)} c={c} />
            {sectors.map((name) => (
              <FilterChip
                key={name}
                label={name}
                active={sectorFilter?.toLowerCase() === name.toLowerCase()}
                onPress={() => setSectorFilter(name)}
                c={c}
              />
            ))}
          </ScrollView>
        )}

        {quick !== "all" && activeHint && (
          <Text
            style={{
              fontFamily: "PlusJakartaSans_400Regular",
              fontSize: 12,
              lineHeight: 17,
              color: MUTED,
              paddingHorizontal: 24,
              paddingTop: 10,
            }}
          >
            {activeHint}
          </Text>
        )}
      </View>

      {/* Results */}
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!isQuerying && !isLoading && (
          <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 16, color: c.text }}>
              {filtering ? `${displayList.length} stock${displayList.length === 1 ? "" : "s"}` : "All MSE Stocks"}
            </Text>
            {filtering && (
              <TouchableOpacity onPress={clearFilters} hitSlop={10}>
                <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: c.primary }}>Clear filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {isLoading && (
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: MUTED }}>Searching…</Text>
          </View>
        )}
        {!isLoading && displayList.length === 0 && (isQuerying || filtering) && (
          <View style={{ alignItems: "center", marginTop: 60, paddingHorizontal: 20 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: MUTED, textAlign: "center" }}>
              {isQuerying && !filtering ? `No results for "${query}"` : "No stocks match these filters."}
            </Text>
            {filtering && (
              <TouchableOpacity onPress={clearFilters} style={{ marginTop: 12 }} hitSlop={10}>
                <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.primary }}>Clear filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {!isLoading && displayList.map((s, i) => (
          <TouchableOpacity
            key={s.id}
            style={[
              { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
              i < displayList.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border },
            ]}
            onPress={() => guardedPush(() => router.push(`/stock/${s.symbol}` as any))}
            activeOpacity={0.8}
          >
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.card, overflow: "hidden", borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center" }}>
              {getStockLogo(s.symbol) ? (
                <Image source={getStockLogo(s.symbol)!} style={{ width: 36, height: 36, borderRadius: 18 }} resizeMode="contain" />
              ) : (
                <View style={{ width: 48, height: 48, backgroundColor: c.primary, justifyContent: "center", alignItems: "center" }}>
                  <Text style={{ color: WHITE, fontFamily: "PlusJakartaSans_700Bold", fontSize: 10 }}>{s.symbol.slice(0, 3)}</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: c.text }}>{s.symbol}</Text>
              <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED, marginTop: 2 }} numberOfLines={1}>{s.name}</Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: c.text }}>{s.price}</Text>
              <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 12, color: s.positive ? GREEN : RED }}>{s.change}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

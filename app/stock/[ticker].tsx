import { guardedBack, guardedPush } from "@/utils/navigation";
import React, { useState, useMemo } from "react";
import {
  Alert,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  ActivityIndicator,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { useQueryClient } from "@tanstack/react-query";
import { useStockDetail } from "../../hooks/useStocks";

import { useHoldingQuantity } from "../../hooks/usePortfolio";
import { ApiStock } from "../../services/api";
import { getStockLogo } from "../../utils/stock-logos";
import { useColors } from "@/hooks/useColors";
import { PriceChart, PricePoint, CHART_H } from "@/components/PriceChart";
import { useTradeEligibility, tradeBlockTitle, tradeBlockAction } from "@/hooks/useTradeEligibility";

// ─── Static brand tokens ────────────────────────────────────────────────────────
const GREEN = "#45B369";
const RED   = "#EF4770";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";

const { width: SCREEN_W } = Dimensions.get("window");

// ─── Period tabs ─────────────────────────────────────────────────────────────────
const TIME_TABS = ["1M", "3M", "6M", "1Y", "2Y", "5Y"] as const;
type TimePeriod = typeof TIME_TABS[number];

// ─── Main screen ────────────────────────────────────────────────────────────────
export default function StockDetailScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 16;
  const bottomPad = insets.bottom || 16;
  const { ticker } = useLocalSearchParams<{ ticker: string }>();
  const c = useColors();

  const [activeTimeTab, setActiveTimeTab] = useState<TimePeriod>("1M");
  const [aboutExpanded, setAboutExpanded] = useState(false);

  const { data: stock, isLoading, error, refetch } = useStockDetail(ticker, activeTimeTab);

  const holdingQty = useHoldingQuantity(ticker);
  // Selling needs shares; BOTH sides also need a broker and verified
  // identity — the server refuses orders without them, so the button says so
  // rather than letting someone build an order that cannot be placed.
  const trade = useTradeEligibility();
  const canSell = holdingQty > 0 && trade.canTrade;
  const canBuy = trade.canTrade;

  const promptToResolve = () => {
    if (!trade.reason) return;
    Alert.alert(tradeBlockTitle(trade.reason), trade.message ?? "", [
      { text: "Not now", style: "cancel" },
      { text: tradeBlockAction(trade.reason), onPress: trade.resolve },
    ]);
  };

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

  if (error && !displayStock) {
    return (
      <View style={[{ flex: 1, backgroundColor: c.background, paddingTop: topPad, alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: RED, fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 16 }}>Could not load {ticker}</Text>
        <Text style={{ color: MUTED, fontFamily: "PlusJakartaSans_400Regular", marginTop: 4 }}>Check your connection</Text>
        <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 16, backgroundColor: c.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 }}>
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
        <View style={{ backgroundColor: c.background, paddingTop: topPad, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: c.border }}>
          {/* Nav */}
          <View style={{ paddingHorizontal: 20 }}>
            <TouchableOpacity onPress={() => guardedBack("/stock-search")} style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path d="M15 19l-7-7 7-7" stroke={c.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
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
                style={{ paddingVertical: 7, paddingHorizontal: 13, alignItems: "center", borderRadius: 8, backgroundColor: activeTimeTab === tab ? c.primary : "transparent" }}
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
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: c.primary, marginTop: 6 }}>{aboutExpanded ? "Read less" : "Read more"}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 1, backgroundColor: c.border, marginHorizontal: 24 }} />

          {/* Key Statistics */}
          <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 17, color: c.text }}>Key Statistics</Text>
              <TouchableOpacity><Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: c.primary }}>See All</Text></TouchableOpacity>
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
            <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 11, color: c.primary }}>Data sourced from Malawi Stock Exchange · MSE</Text>
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
              ? { borderColor: c.primary, backgroundColor: c.background }
              : { borderColor: MUTED, backgroundColor: c.background, opacity: 0.45 },
          ]}
          activeOpacity={canSell ? 0.85 : 1}
          onPress={() =>
            canSell
              ? guardedPush(() => router.push(`/trade/sell?ticker=${ticker}` as any))
              : trade.canTrade ? undefined : promptToResolve()
          }
          disabled={!canSell && trade.canTrade}
        >
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: canSell ? c.primary : MUTED }}>Sell</Text>
          {!canSell && (
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 9, color: MUTED, marginTop: 1 }}>
              {trade.shortLabel ?? "No shares owned"}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            { flex: 1, height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: c.primary },
            canBuy
              ? { shadowColor: c.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 }
              : { opacity: 0.45 },
          ]}
          activeOpacity={canBuy ? 0.85 : 1}
          // Tapping a blocked button explains what is missing and offers to
          // go and fix it — a dead button with no reason is worse than none.
          onPress={() =>
            canBuy
              ? guardedPush(() => router.push(`/trade/buy?ticker=${ticker}` as any))
              : promptToResolve()
          }
        >
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: WHITE }}>Buy</Text>
          {!canBuy && trade.shortLabel && (
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 9, color: WHITE, marginTop: 1 }}>
              {trade.shortLabel}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

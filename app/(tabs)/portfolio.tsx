import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Dimensions,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { portfolioApi } from "../../services/api";
import { useWalletBalance } from "../../services/wallet-queries";
import { getStockLogo } from "../../utils/stock-logos";
import { useColors } from "@/hooks/useColors";
import { StockData } from "../data/stocks";

// ─── Static brand tokens ───────────────────────────────────────────────────────
const TEAL = "#164951";
const CARD_TEAL = "#2D5B62";
const GREEN = "#45B369";
const RED = "#EF4770";
const WHITE = "#FFFFFF";

const { width: SCREEN_W } = Dimensions.get("window");

interface Holding extends StockData {
  shares: string;
  value: string;
  changePct: string;
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      {hidden ? (
        <>
          <Path d="M2 2L20 20" stroke="rgba(255,255,255,0.7)" strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M8.5 5.1C9.3 4.9 10.1 4.8 11 4.8c5 0 9 6.2 9 6.2s-.8 1.2-2.1 2.5M13 16.6c-.6.2-1.3.4-2 .4-5 0-9-6.2-9-6.2s.7-1.1 1.9-2.3" stroke="rgba(255,255,255,0.7)" strokeWidth={1.8} strokeLinecap="round" />
          <Circle cx={11} cy={11} r={3} stroke="rgba(255,255,255,0.7)" strokeWidth={1.8} />
        </>
      ) : (
        <>
          <Path d="M2 11s3.6-6.2 9-6.2S20 11 20 11s-3.6 6.2-9 6.2S2 11 2 11z" stroke="rgba(255,255,255,0.7)" strokeWidth={1.8} strokeLinecap="round" />
          <Circle cx={11} cy={11} r={3} stroke="rgba(255,255,255,0.7)" strokeWidth={1.8} />
        </>
      )}
    </Svg>
  );
}

function BuyIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
      <Circle cx={14} cy={14} r={14} fill={CARD_TEAL} />
      <Path d="M14 9v10M9 14h10" stroke={WHITE} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function SellIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
      <Circle cx={14} cy={14} r={14} fill={CARD_TEAL} />
      <Path d="M14 9v10M9.5 13l4.5-4 4.5 4" stroke={WHITE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ExchangeIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
      <Circle cx={14} cy={14} r={14} fill={CARD_TEAL} />
      <Path d="M9 12h10M9 16h10" stroke={WHITE} strokeWidth={2} strokeLinecap="round" />
      <Path d="M16 9l3 3-3 3" stroke={WHITE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 19l-3-3 3-3" stroke={WHITE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Circle cx={8} cy={8} r={5.5} stroke={color} strokeWidth={1.5} />
      <Path d="M12 12l3.5 3.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

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

export default function PortfolioScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;
  const c = useColors();
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [period, setPeriod] = useState("1D");

  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [totalValue, setTotalValue] = useState<string | null>(null);
  const [totalGain, setTotalGain] = useState<string | null>(null);
  const [gainPositive, setGainPositive] = useState(true);
  const { data: walletBalance } = useWalletBalance();

  useEffect(() => {
    portfolioApi.getSummary()
      .then((s) => {
        setTotalValue(`K ${Number(s.totalValue || 0).toLocaleString()}`);
        const gain = Number(s.totalGain || 0);
        setTotalGain(`${gain >= 0 ? '+' : ''}K ${Math.abs(gain).toLocaleString()} (${s.totalGainPercent || '0'}%)`);
        setGainPositive(gain >= 0);
      })
      .catch(() => {
        setTotalValue("K 0");
        setTotalGain("K 0 (0%)");
      });

    portfolioApi.getHoldings()
      .then((h) => {
        setHoldings(h.map((item: any) => ({
          id: item.stockId,
          ticker: item.symbol,
          name: item.name,
          logo: getStockLogo(item.symbol),
          price: `K ${Number(item.currentPrice || 0).toLocaleString()}`,
          change: `${Number(item.gainPercent || 0) >= 0 ? '+' : ''}${item.gainPercent || '0'}%`,
          positive: Number(item.gainPercent || 0) >= 0,
          shares: String(item.quantity || 0),
          value: `K ${Number(item.marketValue || 0).toLocaleString()}`,
          changePct: `${item.gainPercent || '0'}%`,
        })));
      })
      .catch(() => {});
  }, []);

  const filtered = holdings.filter(
    (a) =>
      a.ticker.toLowerCase().includes(searchText.toLowerCase()) ||
      a.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: TEAL },
    header: { backgroundColor: TEAL, paddingHorizontal: 24, paddingBottom: 48, minHeight: 210, position: "relative" },
    whiteSheet: { flex: 1, backgroundColor: c.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -24, overflow: "hidden" },
    titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
    titleLabel: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: "rgba(255,255,255,0.8)", letterSpacing: 0.3 },
    eyeBtn: { padding: 4 },
    periodPill: { position: "absolute", top: 0, right: 24, backgroundColor: CARD_TEAL, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginTop: 4, alignSelf: "flex-end" },
    periodText: { fontFamily: "PlusJakartaSans_500Medium", fontSize: 12, color: WHITE },
    balanceBlock: { alignItems: "center", marginTop: 20 },
    balanceAmount: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 40, color: WHITE, letterSpacing: -1, marginBottom: 8 },
    balanceHidden: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 40, color: "rgba(255,255,255,0.5)", marginBottom: 8 },
    changeChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
    changeText: { fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: GREEN },
    actionCard: {
      marginHorizontal: 20,
      marginTop: 20,
      marginBottom: 4,
      backgroundColor: c.card,
      borderRadius: 16,
      flexDirection: "row",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 5,
      paddingVertical: 20,
      borderWidth: 1,
      borderColor: c.border,
    },
    actionItem: { flex: 1, alignItems: "center", gap: 8 },
    actionLabel: { fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: c.text },
    listArea: { flex: 1, marginTop: 8 },
    listContent: { paddingHorizontal: 20, paddingBottom: 100 },
    sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, marginTop: 4 },
    sectionTitle: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 16, color: c.text },
    viewAll: { fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: TEAL },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 8,
      marginBottom: 16,
    },
    searchInput: { flex: 1, fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: c.text, padding: 0 },
    assetCard: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 12 },
    assetCardBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
    logoCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.card, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 1, borderColor: c.border },
    logoImage: { width: 40, height: 40, borderRadius: 20 },
    assetInfo: { flex: 1 },
    assetTicker: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: c.text, marginBottom: 3 },
    assetShares: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: c.mutedForeground },
    assetRight: { alignItems: "flex-end" },
    assetValue: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: c.text, marginBottom: 4 },
    assetChangePill: { flexDirection: "row", alignItems: "center", gap: 2 },
    assetChangePct: { fontFamily: "PlusJakartaSans_500Medium", fontSize: 12 },
    emptyState: { paddingVertical: 48, alignItems: "center" },
    emptyText: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 16, color: c.text, marginBottom: 6 },
    emptySubText: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: c.mutedForeground },
  });

  return (
    <View style={styles.root}>
      {/* Teal Header */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <View style={styles.titleRow}>
          <Text style={styles.titleLabel}>Portfolio</Text>
          <TouchableOpacity onPress={() => setBalanceHidden((v) => !v)} style={styles.eyeBtn}>
            <EyeIcon hidden={balanceHidden} />
          </TouchableOpacity>
        </View>

        <View style={styles.periodPill}>
          <Text style={styles.periodText}>Now {period} ▾</Text>
        </View>

        <View style={styles.balanceBlock}>
          {balanceHidden ? (
            <Text style={styles.balanceHidden} adjustsFontSizeToFit numberOfLines={1}>K  ••••••</Text>
          ) : (
            <Text style={styles.balanceAmount} adjustsFontSizeToFit numberOfLines={1}>
              {totalValue ?? "—"}
            </Text>
          )}
          {totalGain !== null && (
            <View style={styles.changeChip}>
              {gainPositive ? <ArrowUpIcon color={GREEN} /> : <ArrowDownIcon color={RED} />}
              <Text style={styles.changeText}>{totalGain}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Content sheet */}
      <View style={styles.whiteSheet}>
        <View style={styles.actionCard}>
          <TouchableOpacity style={styles.actionItem} onPress={() => router.push("/trade/sell" as any)}>
            <SellIcon />
            <Text style={styles.actionLabel}>Sell</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.listArea} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Your Assets</Text>
            <TouchableOpacity onPress={() => router.push("/trade/history" as any)}>
              <Text style={styles.viewAll}>View all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <SearchIcon color={c.mutedForeground} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search assets..."
              placeholderTextColor={c.mutedForeground}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No holdings yet</Text>
              <Text style={styles.emptySubText}>Buy your first stock to get started</Text>
            </View>
          )}

          {filtered.map((asset, i) => (
            <TouchableOpacity
              key={asset.ticker}
              style={[styles.assetCard, i < filtered.length - 1 && styles.assetCardBorder]}
              onPress={() => router.push(`/stock/${asset.ticker}` as any)}
              activeOpacity={0.75}
            >
              <View style={styles.logoCircle}>
                {asset.logo ? (
                  <Image source={asset.logo} style={styles.logoImage} resizeMode="contain" />
                ) : (
                  <View style={[styles.logoImage, { backgroundColor: c.card, borderRadius: 20 }]} />
                )}
              </View>
              <View style={styles.assetInfo}>
                <Text style={styles.assetTicker}>{asset.ticker}</Text>
                <Text style={styles.assetShares}>{asset.shares}</Text>
              </View>
              <View style={styles.assetRight}>
                <Text style={styles.assetValue}>{asset.value}</Text>
                <View style={styles.assetChangePill}>
                  {asset.positive ? <ArrowUpIcon color={GREEN} /> : <ArrowDownIcon color={RED} />}
                  <Text style={[styles.assetChangePct, { color: asset.positive ? GREEN : RED }]}>
                    {asset.changePct ?? asset.change}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

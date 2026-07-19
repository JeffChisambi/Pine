import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  Modal,
  Animated,
  Dimensions,
} from "react-native";

const SCREEN_H = Dimensions.get("window").height;
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path, Circle, Line, Defs, ClipPath, Rect } from "react-native-svg";
import { getStockLogo } from "../../utils/stock-logos";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/contexts/theme-context";

// ─── Static brand tokens ────────────────────────────────────────────────────────
const TEAL = "#164951";
const GREEN = "#45B369";
const RED = "#EF4770";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";
const SECTOR_ICON_BG_LIGHT = "#DFE9EB";

import { useStocks } from "../../hooks/useStocks";

type Colors = ReturnType<typeof useColors>;

function ArrowCircle({ positive }: { positive: boolean }) {
  const color = positive ? GREEN : RED;
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Circle cx={9} cy={9} r={9} fill={color} />
      {positive ? (
        <Path d="M5.5 10.5L9 7L12.5 10.5" stroke={WHITE} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <Path d="M5.5 7.5L9 11L12.5 7.5" stroke={WHITE} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      )}
    </Svg>
  );
}

function SearchIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={7.5} stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16.5 16.5L20.5 20.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StockLogo({ symbol, c }: { symbol: string; c: Colors }) {
  const logo = getStockLogo(symbol);
  if (logo) {
    return (
      <View style={[logoCircleStyle(c)]}>
        <Image source={logo} style={{ width: 40, height: 40, borderRadius: 20 }} resizeMode="contain" />
      </View>
    );
  }
  const colors = ["#164951", "#1A3A6B", "#166534", "#7C3AED", "#B45309", "#BE185D"];
  const bg = colors[symbol.charCodeAt(0) % colors.length];
  return (
    <View style={[logoCircleStyle(c), { backgroundColor: bg }]}>
      <Text style={{ color: "#fff", fontFamily: "PlusJakartaSans_700Bold", fontSize: 11 }}>
        {symbol.slice(0, 3)}
      </Text>
    </View>
  );
}

function logoCircleStyle(c: Colors) {
  return {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: c.card,
    alignItems: "center" as const, justifyContent: "center" as const,
    overflow: "hidden" as const, borderWidth: 1, borderColor: c.border,
  };
}

// Sparkline paths
const SPARKLINES_UP = [
  "M0.5 25 L5 17 L7 20 L10 13 L15 8 L17 37 L19 31 H30 L33 21 L35 23 L37 15 L40 18 L44 19 L47 28 L51 0 L52 9 L55 12 L56 21 L58 16 H63 L64 33 L66 36 L68 52 L70 44 L72 42 L73 36 L76 34 L77 28 L80 27 L82 19 L84 22 H88",
  "M0 30 L8 25 L15 28 L20 20 L28 15 L35 18 L40 10 L47 15 L54 8 L58 5 L65 12 L70 8 L76 18 L82 12 L88 8",
];
const SPARKLINES_DOWN = [
  "M0 10 L8 15 L15 12 L20 22 L28 28 L35 25 L40 35 L47 30 L54 40 L58 45 L65 38 L70 44 L76 36 L82 42 L88 48",
  "M0 5 L8 12 L15 10 L20 18 L28 25 L35 22 L40 30 L44 24 L50 35 L58 42 L65 38 L70 45 L76 40 L82 46 L88 52",
];

function MiniSparkline({ positive, idx }: { positive: boolean; idx: number }) {
  const paths = positive ? SPARKLINES_UP : SPARKLINES_DOWN;
  const path = paths[idx % paths.length];
  const topId = `clip-top-${idx}`;
  const botId = `clip-bot-${idx}`;
  return (
    <Svg width={88} height={52} viewBox="0 0 88 52" fill="none">
      <Defs>
        <ClipPath id={topId}><Rect x="0" y="0" width="88" height="26" /></ClipPath>
        <ClipPath id={botId}><Rect x="0" y="26" width="88" height="26" /></ClipPath>
      </Defs>
      <Line x1="0" y1="26" x2="88" y2="26" stroke="#D1D5DB" strokeWidth={1} strokeDasharray="3 3" strokeLinecap="round" />
      <Path d={path} stroke={GREEN} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" clipPath={`url(#${topId})`} />
      <Path d={path} stroke={RED} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" clipPath={`url(#${botId})`} />
    </Svg>
  );
}

// ─── Sector icons ────────────────────────────────────────────────────────────
const ICON_COLOR_LIGHT = "#164951";

function SectorBankIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3L22 9H2L12 3Z" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M5 9V18M9 9V18M15 9V18M19 9V18" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M2 18H22M2 21H22" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function SectorInvestmentIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M19 7H5C3.9 7 3 7.9 3 9V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V9C21 7.9 20.1 7 19 7Z" stroke={color} strokeWidth={1.5} />
      <Path d="M8 7V5C8 3.9 8.9 3 10 3H14C15.1 3 16 3.9 16 5V7" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M21 12H17C15.9 12 15 12.9 15 14C15 15.1 15.9 16 17 16H21" stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

function SectorAgricultureIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {/* Stem */}
      <Path d="M12 13V9" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      {/* Left leaf */}
      <Path d="M12 9C11 7 9 5 7.5 5.5C7.5 7.5 9.5 9 12 9Z"
            stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      {/* Right leaf */}
      <Path d="M12 9C13 7 15 5 16.5 5.5C16.5 7.5 14.5 9 12 9Z"
            stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      {/* Pot rim */}
      <Rect x="4" y="13" width="16" height="2.5" rx="1.25" stroke={color} strokeWidth={1.5} />
      {/* Pot body */}
      <Path d="M5.5 15.5L7 21Q7.5 22 8.5 22H15.5Q16.5 22 17 21L18.5 15.5"
            stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SectorRealEstateIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {/* Tall building — right */}
      <Rect x="10" y="2" width="12" height="20" rx="2" stroke={color} strokeWidth={1.5} />
      {/* Tall building windows — 2 columns × 2 rows */}
      <Rect x="12.5" y="5"    width="2.5" height="2.5" rx="0.75" stroke={color} strokeWidth={1.5} />
      <Rect x="17"   y="5"    width="2.5" height="2.5" rx="0.75" stroke={color} strokeWidth={1.5} />
      <Rect x="12.5" y="10"   width="2.5" height="2.5" rx="0.75" stroke={color} strokeWidth={1.5} />
      <Rect x="17"   y="10"   width="2.5" height="2.5" rx="0.75" stroke={color} strokeWidth={1.5} />
      {/* Short building — left, adjacent to tall */}
      <Rect x="2" y="9" width="8" height="13" rx="2" stroke={color} strokeWidth={1.5} />
      {/* Short building windows — stacked */}
      <Rect x="4.5" y="12" width="3" height="3" rx="0.75" stroke={color} strokeWidth={1.5} />
      <Rect x="4.5" y="17" width="3" height="3" rx="0.75" stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

function SectorTravelIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M21 16L13 12V5C13 4.45 12.55 4 12 4C11.45 4 11 4.45 11 5V12L3 16V17.5L11 15V19L9 20.5V22L12 21L15 22V20.5L13 19V15L21 17.5V16Z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SectorHealthIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M19 8H5C3.9 8 3 8.9 3 10V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V10C21 8.9 20.1 8 19 8Z" stroke={color} strokeWidth={1.5} />
      <Path d="M8 8V6C8 4.9 8.9 4 10 4H14C15.1 4 16 4.9 16 6V8" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M12 12V17M9.5 14.5H14.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function SectorTechIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="7" y="7" width="10" height="10" rx="1" stroke={color} strokeWidth={1.5} />
      <Path d="M9 2V4M12 2V4M15 2V4M9 20V22M12 20V22M15 20V22M2 9H4M2 12H4M2 15H4M20 9H22M20 12H22M20 15H22" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function SectorEnergyIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M13 3L4 14H12L11 21L20 10H12L13 3Z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SectorFinanceIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M20 7H4C2.9 7 2 7.9 2 9V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V9C22 7.9 21.1 7 20 7Z" stroke={color} strokeWidth={1.5} />
      <Path d="M16 3.56C15.74 3.52 15.49 3.5 15.23 3.5H6.77C4.38 3.78 2.77 5.44 2.55 7.87" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M15 14H19" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

const SECTORS: { key: string; label: string; icon: (color: string) => React.ReactElement }[] = [
  { key: "Agriculture",  label: "Agriculture", icon: (color) => <SectorAgricultureIcon color={color} /> },
  { key: "Banks",        label: "Banks",       icon: (color) => <SectorBankIcon color={color} /> },
  { key: "Real Estate",  label: "Real Estate", icon: (color) => <SectorRealEstateIcon color={color} /> },
  { key: "Investment",   label: "Investment",  icon: (color) => <SectorInvestmentIcon color={color} /> },
  { key: "Technology",   label: "Tech",        icon: (color) => <SectorTechIcon color={color} /> },
  { key: "Energy",       label: "Energy",      icon: (color) => <SectorEnergyIcon color={color} /> },
  { key: "Finance",      label: "Finance",     icon: (color) => <SectorFinanceIcon color={color} /> },
  { key: "Travel",       label: "Travel",      icon: (color) => <SectorTravelIcon color={color} /> },
  { key: "Health",       label: "Health",      icon: (color) => <SectorHealthIcon color={color} /> },
];
const PRIMARY_SECTORS = SECTORS.slice(0, 4);

function SectorsModal({ visible, onClose, getSectorChange, c, isDark }: {
  visible: boolean;
  onClose: () => void;
  getSectorChange: (key: string) => number | null;
  c: Colors;
  isDark: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const slideY  = useRef(new Animated.Value(SCREEN_H)).current;
  const fadeOvl = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0, damping: 28, stiffness: 280, mass: 0.8, useNativeDriver: true }),
        Animated.timing(fadeOvl, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY, { toValue: SCREEN_H, duration: 260, useNativeDriver: true }),
        Animated.timing(fadeOvl, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  if (!mounted) return null;

  const SECTOR_ICON_BG = c.card;
  const iconColor = isDark ? WHITE : ICON_COLOR_LIGHT;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.35)", opacity: fadeOvl }]} pointerEvents={visible ? "auto" : "none"}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        </Animated.View>
        <Animated.View style={[{ backgroundColor: c.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 14, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.10, shadowRadius: 16, elevation: 24 }, { transform: [{ translateY: slideY }] }]}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: "center", marginBottom: 20 }} />
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text }}>Stock Sectors</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.card, alignItems: "center", justifyContent: "center" }}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Line x1="18" y1="6" x2="6" y2="18" stroke={c.text} strokeWidth={2.2} strokeLinecap="round"/>
                <Line x1="6" y1="6" x2="18" y2="18" stroke={c.text} strokeWidth={2.2} strokeLinecap="round"/>
              </Svg>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {SECTORS.map((sector) => {
              const pct = getSectorChange(sector.key);
              const positive = pct !== null && pct >= 0;
              return (
                <TouchableOpacity key={sector.key} activeOpacity={0.75} style={{ width: "33.33%", alignItems: "center", paddingBottom: 28 }}>
                  <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: SECTOR_ICON_BG, alignItems: "center", justifyContent: "center", marginBottom: 10 }}>{sector.icon(iconColor)}</View>
                  <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 12, color: c.text, textAlign: "center", marginBottom: 3 }}>{sector.label}</Text>
                  <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 12, textAlign: "center", color: pct === null ? MUTED : positive ? GREEN : RED }}>
                    {pct === null ? "—" : `${positive ? "+" : ""}${pct.toFixed(2)}%`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={{ height: 32 }} />
        </Animated.View>
      </View>
    </Modal>
  );
}

function StockLogoSmall({ symbol, c }: { symbol: string; c: Colors }) {
  const logo = getStockLogo(symbol);
  if (logo) {
    return (
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.card, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 1, borderColor: c.border }}>
        <Image source={logo} style={{ width: 28, height: 28, borderRadius: 14 }} resizeMode="contain" />
      </View>
    );
  }
  const colors = ["#164951", "#1A3A6B", "#166534", "#7C3AED", "#B45309", "#BE185D"];
  const bg = colors[symbol.charCodeAt(0) % colors.length];
  return (
    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: bg, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ color: "#fff", fontFamily: "PlusJakartaSans_700Bold", fontSize: 9 }}>{symbol.slice(0, 3)}</Text>
    </View>
  );
}

export default function MarketScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 44;
  const c = useColors();
  const { isDark } = useTheme();
  const [showSectors, setShowSectors] = useState(false);

  const { data: stocks = [], isLoading, error, refetch, isRefetching } = useStocks();

  const stockFeatures = stocks.slice(0, 6);
  const allStocks = stocks;

  const sectorStats = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    stocks.forEach((s) => {
      const key = (s.sector ?? "").toLowerCase();
      if (!map[key]) map[key] = { total: 0, count: 0 };
      map[key].total += s.changePct;
      map[key].count += 1;
    });
    return map;
  }, [stocks]);

  const getSectorChange = (key: string) => {
    const entry = sectorStats[key.toLowerCase()];
    if (!entry || entry.count === 0) return null;
    return entry.total / entry.count;
  };

  const SECTOR_ICON_BG = c.card;
  const iconColor = isDark ? WHITE : ICON_COLOR_LIGHT;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.background, paddingTop: topPad }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 }}>
        <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 24, color: c.text }}>Market</Text>
      </View>

      {/* Search bar */}
      <TouchableOpacity
        style={{ marginHorizontal: 24, height: 56, backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 10 }}
        activeOpacity={0.8}
        onPress={() => router.push("/stock-search")}
      >
        <SearchIcon color={MUTED} />
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: MUTED }}>Search stocks, ETFs…</Text>
      </TouchableOpacity>

      {/* Stock Features */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, marginTop: 24, marginBottom: 14 }}>
        <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text }}>Stock Features</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 24, paddingRight: 8, gap: 12 }}>
        {isLoading ? (
          <View style={{ width: 300, paddingVertical: 24, alignItems: "center" }}>
            <Text style={{ color: MUTED, fontFamily: "PlusJakartaSans_400Regular" }}>Loading market data…</Text>
          </View>
        ) : error ? (
          <View style={{ width: 300, paddingVertical: 24, alignItems: "center" }}>
            <Text style={{ color: RED, fontFamily: "PlusJakartaSans_400Regular" }}>Could not load prices</Text>
          </View>
        ) : stockFeatures.length === 0 ? (
          <View style={{ width: 300, paddingVertical: 24, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: MUTED, fontFamily: "PlusJakartaSans_400Regular", fontSize: 13 }}>No stocks available</Text>
          </View>
        ) : (
          stockFeatures.map((s, idx) => (
            <TouchableOpacity
              key={s.id}
              style={{ width: 240, height: 134, backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, paddingHorizontal: 16, paddingVertical: 14, justifyContent: "space-between" }}
              onPress={() => router.push(`/stock/${s.symbol}` as any)}
              activeOpacity={0.85}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <StockLogoSmall symbol={s.symbol} c={c} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text }}>{s.symbol}</Text>
                  <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: MUTED, marginTop: 1 }} numberOfLines={1}>{s.name}</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 17, color: c.text, marginBottom: 5 }}>{s.price}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                    <ArrowCircle positive={s.positive} />
                    <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 12, color: s.positive ? GREEN : RED }}>
                      {s.changePct > 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                    </Text>
                  </View>
                </View>
                <MiniSparkline positive={s.positive} idx={idx} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Sector Stocks */}
      <SectorsModal visible={showSectors} onClose={() => setShowSectors(false)} getSectorChange={getSectorChange} c={c} isDark={isDark} />

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, marginTop: 24, marginBottom: 14 }}>
        <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text }}>Sector Stocks</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => setShowSectors(true)}>
          <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: MUTED }}>View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 24, paddingRight: 8, gap: 12 }}>
        {PRIMARY_SECTORS.map((sector) => {
          const pct = getSectorChange(sector.key);
          const positive = pct !== null && pct >= 0;
          return (
            <TouchableOpacity key={sector.key} style={{ alignItems: "center", width: 80 }} activeOpacity={0.75}>
              <View style={{ width: 60, height: 60, borderRadius: 14, backgroundColor: SECTOR_ICON_BG, alignItems: "center", justifyContent: "center", marginBottom: 8 }}>{sector.icon(iconColor)}</View>
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 12, color: c.text, textAlign: "center", marginBottom: 2 }}>{sector.label}</Text>
              <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 11, textAlign: "center", color: pct === null ? MUTED : positive ? GREEN : RED }}>
                {pct === null ? "—" : `${positive ? "+" : ""}${pct.toFixed(2)}%`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* All Stocks */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, marginTop: 24, marginBottom: 14 }}>
        <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text }}>All Stocks</Text>
        {isRefetching && <Text style={{ color: MUTED, fontSize: 11, fontFamily: "PlusJakartaSans_400Regular" }}>Refreshing…</Text>}
      </View>

      {isLoading ? (
        Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", marginHorizontal: 24, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border, opacity: 0.4 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.border }} />
            <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
              <View style={{ height: 14, width: 60, backgroundColor: c.border, borderRadius: 4 }} />
              <View style={{ height: 11, width: 120, backgroundColor: c.border, borderRadius: 4 }} />
            </View>
          </View>
        ))
      ) : error ? (
        <View style={{ paddingVertical: 48, alignItems: "center" }}>
          <Text style={{ color: RED, fontFamily: "PlusJakartaSans_500Medium" }}>Backend unreachable</Text>
          <Text style={{ color: MUTED, fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, marginTop: 4 }}>Make sure the server is running</Text>
          <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: TEAL, borderRadius: 8 }}>
            <Text style={{ color: WHITE, fontFamily: "PlusJakartaSans_600SemiBold" }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        allStocks.map((s, i) => (
          <TouchableOpacity
            key={s.id}
            style={{ flexDirection: "row", alignItems: "center", marginHorizontal: 24, paddingVertical: 14, borderBottomWidth: i < allStocks.length - 1 ? 1 : 0, borderBottomColor: c.border }}
            onPress={() => router.push(`/stock/${s.symbol}` as any)}
            activeOpacity={0.8}
          >
            <StockLogo symbol={s.symbol} c={c} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: c.text }}>{s.symbol}</Text>
              <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED, marginTop: 2 }} numberOfLines={1}>{s.name}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: c.text }}>{s.price}</Text>
              <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 12, marginTop: 2, color: s.positive ? GREEN : RED }}>{s.change}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

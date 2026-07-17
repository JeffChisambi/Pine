import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Circle } from "react-native-svg";

const TEAL = "#164951";
const DARK = "#111827";
const MUTED = "#9CA3AF";
const WHITE = "#FFFFFF";
const CARD_BG = "#F9FAFB";
const CARD_BORDER = "#F3F4F6";
const GREEN = "#45B369";
const RED = "#EF4770";

// ─── Mock news data ────────────────────────────────────────────────────────────

const CATEGORIES = ["All", "Markets", "Tech", "Economy", "Crypto"];

const NEWS_ITEMS = [
  {
    id: "1",
    category: "Markets",
    title: "S&P 500 Hits Record High Amid Strong Earnings Season",
    summary:
      "Major indices surged as quarterly results from tech giants beat analyst expectations, lifting broader market sentiment.",
    source: "Bloomberg",
    time: "2h ago",
    tag: "bullish",
  },
  {
    id: "2",
    category: "Tech",
    title: "Apple Unveils Next-Generation Chip Architecture",
    summary:
      "The new silicon promises a 40% performance uplift and significantly improved energy efficiency for upcoming devices.",
    source: "Reuters",
    time: "4h ago",
    tag: null,
  },
  {
    id: "3",
    category: "Economy",
    title: "Fed Holds Rates Steady, Signals Cuts Later This Year",
    summary:
      "The Federal Reserve kept its benchmark rate unchanged and hinted at two potential rate cuts in the second half of the year.",
    source: "CNBC",
    time: "6h ago",
    tag: "bullish",
  },
  {
    id: "4",
    category: "Crypto",
    title: "Bitcoin Pulls Back After Testing $75K Resistance",
    summary:
      "The leading cryptocurrency retreated 3.2% after briefly touching the $75,000 level, with traders eyeing key support zones.",
    source: "CoinDesk",
    time: "8h ago",
    tag: "bearish",
  },
  {
    id: "5",
    category: "Markets",
    title: "Oil Prices Rise on Supply Concerns from Middle East",
    summary:
      "Crude futures climbed over 2% following reports of potential disruptions to key shipping routes in the region.",
    source: "Financial Times",
    time: "10h ago",
    tag: null,
  },
  {
    id: "6",
    category: "Tech",
    title: "NVIDIA Reports Record Data Center Revenue",
    summary:
      "The chipmaker posted a 122% year-over-year increase in data center sales, driven by surging AI infrastructure demand.",
    source: "WSJ",
    time: "12h ago",
    tag: "bullish",
  },
  {
    id: "7",
    category: "Economy",
    title: "US Jobless Claims Fall to Three-Month Low",
    summary:
      "Weekly initial unemployment filings dropped more than expected, pointing to continued resilience in the labour market.",
    source: "AP",
    time: "1d ago",
    tag: null,
  },
];

// ─── Bell icon ─────────────────────────────────────────────────────────────────

function BellIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12.02 2.91C8.71 2.91 6.02 5.6 6.02 8.91V11.8C6.02 12.41 5.76 13.34 5.45 13.86L4.3 15.77C3.59 16.95 4.08 18.26 5.38 18.7C9.69 20.14 14.34 20.14 18.65 18.7C19.86 18.3 20.39 16.87 19.73 15.77L18.58 13.86C18.28 13.34 18.02 12.41 18.02 11.8V8.91C18.02 5.61 15.32 2.91 12.02 2.91Z"
        stroke={DARK}
        strokeWidth={1.5}
        strokeMiterlimit={10}
        strokeLinecap="round"
      />
      <Path
        d="M13.87 3.2C13.56 3.11 13.24 3.04 12.91 3C11.95 2.88 11.03 2.95 10.17 3.2C10.46 2.46 11.18 1.94 12.02 1.94C12.86 1.94 13.58 2.46 13.87 3.2Z"
        stroke={DARK}
        strokeWidth={1.5}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15.02 19.06C15.02 20.71 13.67 22.06 12.02 22.06C11.2 22.06 10.44 21.72 9.9 21.18C9.36 20.64 9.02 19.88 9.02 19.06"
        stroke={DARK}
        strokeWidth={1.5}
        strokeMiterlimit={10}
      />
    </Svg>
  );
}

// ─── News card ─────────────────────────────────────────────────────────────────

function NewsCard({ item }: { item: (typeof NEWS_ITEMS)[0] }) {
  return (
    <TouchableOpacity activeOpacity={0.75} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardCategory}>{item.category}</Text>
        {item.tag && (
          <View
            style={[
              styles.tag,
              { backgroundColor: item.tag === "bullish" ? "#ECFDF5" : "#FEF2F2" },
            ]}
          >
            <Text
              style={[
                styles.tagText,
                { color: item.tag === "bullish" ? GREEN : RED },
              ]}
            >
              {item.tag === "bullish" ? "▲ Bullish" : "▼ Bearish"}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.cardSummary} numberOfLines={2}>
        {item.summary}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardSource}>{item.source}</Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.cardTime}>{item.time}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function NewsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 44;
  const [activeCategory, setActiveCategory] = React.useState("All");

  const filtered =
    activeCategory === "All"
      ? NEWS_ITEMS
      : NEWS_ITEMS.filter((n) => n.category === activeCategory);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>News</Text>
        <TouchableOpacity activeOpacity={0.7} style={styles.bellBtn}>
          <BellIcon />
        </TouchableOpacity>
      </View>

      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsContainer}
        style={styles.pillsScroll}
      >
        {CATEGORIES.map((cat) => {
          const active = cat === activeCategory;
          return (
            <TouchableOpacity
              key={cat}
              activeOpacity={0.75}
              onPress={() => setActiveCategory(cat)}
              style={[styles.pill, active && styles.pillActive]}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* News list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {filtered.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: DARK,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CARD_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  pillsScroll: {
    flexGrow: 0,
    marginBottom: 8,
  },
  pillsContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  pillActive: {
    backgroundColor: TEAL,
    borderColor: TEAL,
  },
  pillText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: MUTED,
  },
  pillTextActive: {
    color: WHITE,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 16,
    gap: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardCategory: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: TEAL,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  cardTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: DARK,
    lineHeight: 20,
  },
  cardSummary: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: MUTED,
    lineHeight: 19,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  cardSource: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: DARK,
  },
  dot: {
    color: MUTED,
    fontSize: 12,
  },
  cardTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: MUTED,
  },
});

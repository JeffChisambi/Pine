import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const TEAL = "#164951";
const DARK = "#111827";
const MUTED = "#9CA3AF";
const WHITE = "#FFFFFF";
const CARD_BG = "#FFFFFF";
const CARD_BORDER = "#F0F1F3";
const GREEN = "#45B369";

// ─── Category colours ──────────────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  Markets:     TEAL,
  Banking:     TEAL,
  Economy:     TEAL,
  Energy:      GREEN,
  Agriculture: GREEN,
};
const catColor = (cat: string) => CAT_COLORS[cat] ?? TEAL;

// ─── News data ─────────────────────────────────────────────────────────────────
const CATEGORIES = ["All", "Markets", "Banking", "Economy", "Energy", "Agriculture"];

type NewsItem = {
  id: string;
  category: string;
  title: string;
  summary: string;
  time: string;
  image: string;
  featured?: boolean;
};

const NEWS_ITEMS: NewsItem[] = [
  {
    id: "1",
    category: "Markets",
    title: "TNM Plc Posts Record Annual Profit Driven by Mobile Money Surge",
    summary:
      "Telecom Networks Malawi reported a 38% year-on-year jump in net profit, with Mpamba mobile money transactions crossing the MWK 2 trillion mark for the first time.",
    time: "20 min ago",
    image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=900&q=80",
    featured: true,
  },
  {
    id: "2",
    category: "Banking",
    title: "Standard Bank Malawi Reports 34% Growth in Net Interest Income",
    summary:
      "The lender posted strong first-half results, citing higher lending volumes and improved asset quality across its retail and corporate books.",
    time: "2h ago",
    image: "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=400&q=80",
  },
  {
    id: "3",
    category: "Energy",
    title: "EGENCO Expansion Plan Backed by $120M AfDB Facility",
    summary:
      "The Electricity Generation Company of Malawi secured African Development Bank funding to add 300 MW of hydro capacity along the Shire River corridor.",
    time: "4h ago",
    image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400&q=80",
  },
  {
    id: "4",
    category: "Markets",
    title: "Malawi Stock Exchange All-Share Index Climbs 4.2% on Strong Q2 Reports",
    summary:
      "The MSE benchmark reached a two-year high as listed companies delivered results well ahead of analyst forecasts, lifting investor confidence.",
    time: "6h ago",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80",
  },
  {
    id: "5",
    category: "Banking",
    title: "National Bank of Malawi Declares MWK 12.50 Dividend Per Share",
    summary:
      "NBM plc announced a final dividend 18% above last year's payout, rewarding shareholders after a record year of loan book expansion.",
    time: "8h ago",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80",
  },
  {
    id: "6",
    category: "Agriculture",
    title: "Press Agriculture Holdings Eyes Regional Expansion into Zambia and Mozambique",
    summary:
      "The agribusiness conglomerate outlined a five-year strategy to diversify revenue streams and reduce reliance on domestic tobacco markets.",
    time: "10h ago",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80",
  },
  {
    id: "7",
    category: "Economy",
    title: "RBM Holds Policy Rate at 26% as Inflation Shows Signs of Easing",
    summary:
      "The Reserve Bank of Malawi kept its benchmark lending rate unchanged, signalling caution ahead of the next consumer price index release.",
    time: "12h ago",
    image: "https://images.unsplash.com/photo-1559526324-593bc073d938?w=400&q=80",
  },
  {
    id: "8",
    category: "Agriculture",
    title: "Illovo Sugar Malawi Export Revenue Surges on Rising Global Prices",
    summary:
      "The sugar producer saw export earnings climb 27% as tight global supply pushed international raw-sugar prices to multi-year highs.",
    time: "1d ago",
    image: "https://images.unsplash.com/photo-1505471768190-275e2ad7b3f9?w=400&q=80",
  },
  {
    id: "9",
    category: "Economy",
    title: "Old Mutual Malawi Launches Affordable Retail Investment Fund",
    summary:
      "The insurer opened access to a diversified equity fund with a minimum entry of MWK 5,000, targeting first-time retail investors.",
    time: "1d ago",
    image: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&q=80",
  },
];

// ─── Icons ─────────────────────────────────────────────────────────────────────
function BellIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12.02 2.91C8.71 2.91 6.02 5.6 6.02 8.91V11.8C6.02 12.41 5.76 13.34 5.45 13.86L4.3 15.77C3.59 16.95 4.08 18.26 5.38 18.7C9.69 20.14 14.34 20.14 18.65 18.7C19.86 18.3 20.39 16.87 19.73 15.77L18.58 13.86C18.28 13.34 18.02 12.41 18.02 11.8V8.91C18.02 5.61 15.32 2.91 12.02 2.91Z"
        stroke={DARK} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round"
      />
      <Path
        d="M13.87 3.2C13.56 3.11 13.24 3.04 12.91 3C11.95 2.88 11.03 2.95 10.17 3.2C10.46 2.46 11.18 1.94 12.02 1.94C12.86 1.94 13.58 2.46 13.87 3.2Z"
        stroke={DARK} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        d="M15.02 19.06C15.02 20.71 13.67 22.06 12.02 22.06C11.2 22.06 10.44 21.72 9.9 21.18C9.36 20.64 9.02 19.88 9.02 19.06"
        stroke={DARK} strokeWidth={1.5} strokeMiterlimit={10}
      />
    </Svg>
  );
}

// ─── Hero card ─────────────────────────────────────────────────────────────────
function HeroCard({ item }: { item: NewsItem }) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.heroCard}>
      <Image
        source={{ uri: item.image }}
        style={styles.heroImage}
        resizeMode="cover"
      />
      <View style={styles.heroBody}>
        <Text style={styles.heroTitle} numberOfLines={3}>{item.title}</Text>
        <View style={styles.heraMeta}>
          <Text style={styles.metaTime}>{item.time}</Text>
          <View style={styles.metaDivider} />
          <Text style={[styles.metaCategory, { color: catColor(item.category) }]}>
            {item.category}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Thumbnail card ────────────────────────────────────────────────────────────
function ThumbCard({ item }: { item: NewsItem }) {
  return (
    <TouchableOpacity activeOpacity={0.82} style={styles.thumbCard}>
      <Image
        source={{ uri: item.image }}
        style={styles.thumbImage}
        resizeMode="cover"
      />
      <View style={styles.thumbBody}>
        <Text style={styles.thumbTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.thumbSummary} numberOfLines={2}>{item.summary}</Text>
        <View style={styles.heraMeta}>
          <Text style={styles.metaTime}>{item.time}</Text>
          <View style={styles.metaDivider} />
          <Text style={[styles.metaCategory, { color: catColor(item.category) }]}>
            {item.category}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────
export default function NewsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 44;
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered =
    activeCategory === "All"
      ? NEWS_ITEMS
      : NEWS_ITEMS.filter((n) => n.category === activeCategory);

  const hero = filtered[0];
  const rest  = filtered.slice(1);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Market News</Text>
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
        {/* Hero */}
        {hero && <HeroCard item={hero} />}

        {/* Divider */}
        {rest.length > 0 && <View style={styles.divider} />}

        {/* Thumbnail list */}
        {rest.map((item, i) => (
          <React.Fragment key={item.id}>
            <ThumbCard item={item} />
            {i < rest.length - 1 && <View style={styles.thumbDivider} />}
          </React.Fragment>
        ))}

        <View style={{ height: 24 }} />
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

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
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
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Pills */
  pillsScroll: { flexGrow: 0, marginBottom: 10 },
  pillsContainer: { paddingHorizontal: 20, gap: 8 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  pillActive: { backgroundColor: TEAL },
  pillText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: MUTED,
  },
  pillTextActive: { color: WHITE },

  /* List */
  listContent: {
    paddingBottom: 24,
  },

  /* Dividers */
  divider: {
    height: 1,
    backgroundColor: CARD_BORDER,
    marginVertical: 20,
    marginHorizontal: 20,
  },
  thumbDivider: {
    height: 1,
    backgroundColor: CARD_BORDER,
    marginVertical: 16,
    marginHorizontal: 20,
  },

  /* ── Hero card ── */
  heroCard: {
    paddingHorizontal: 20,
  },
  heroImage: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
  },
  heroBody: {
    marginTop: 14,
    gap: 8,
  },
  heroTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: DARK,
    lineHeight: 29,
  },

  /* ── Shared meta row ── */
  heraMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaTime: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: MUTED,
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: CARD_BORDER,
  },
  metaCategory: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },

  /* ── Thumbnail card ── */
  thumbCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    gap: 14,
  },
  thumbImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    flexShrink: 0,
  },
  thumbBody: {
    flex: 1,
    gap: 5,
  },
  thumbTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: DARK,
    lineHeight: 21,
  },
  thumbSummary: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: MUTED,
    lineHeight: 18,
  },
});

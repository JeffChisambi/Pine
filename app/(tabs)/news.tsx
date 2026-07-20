import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  Modal,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Line } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

// ─── Static tokens ─────────────────────────────────────────────────────────────
const TEAL  = "#164951";
const GREEN = "#45B369";
const MUTED = "#9CA3AF";

type Metric = { label: string; value: string; up?: boolean };
type NewsItem = {
  id: string;
  category: string;
  title: string;
  summary: string;
  body: string[];
  metrics?: Metric[];
  time: string;
  source: string;
  image: any;
  featured?: boolean;
};

const CATEGORIES = ["All", "Banking", "Markets", "Insurance"];

const NEWS_ITEMS: NewsItem[] = [
  {
    id: "1",
    category: "Banking",
    title: "FDH Bank Doubles Profit After Tax to MWK 148 Billion in FY2025",
    summary: "Net interest income surged 82% and total assets crossed MWK 1.6 trillion as FDH Bank reports its strongest annual performance on record.",
    body: [
      "FDH Bank Plc has delivered an exceptional set of results for the year ended 31 December 2025, with Profit After Tax reaching MWK 147.795 billion — a 100% increase on the MWK 74.063 billion recorded in the prior year.",
      "Net Interest Income, the bank's primary revenue driver, rose 82% to MWK 256.6 billion, underpinned by a 65% expansion in the loan book and a 49% increase in Government Securities. Total income for the year grew 71% to MWK 333.4 billion.",
      "Customer deposits surpassed MWK 1 trillion, closing the year at MWK 1.125 trillion — up 27% — while Total Assets grew 31% to MWK 1.635 trillion. Non-interest income, including fees, commissions and international trade revenue, climbed 43%.",
      "Operating expenses grew at a modest 21%, well below the 71% income growth rate, reflecting disciplined cost management. Expected Credit Loss (ECL) charges increased by MWK 8.4 billion due to challenging macroeconomic conditions, partially offset by MWK 1.8 billion in recoveries.",
      "The Board declared and paid total dividends of MWK 11.6 billion (MWK 1.68 per share) during the year, comprising a final 2024 dividend and a first 2025 interim dividend. A second interim dividend of MWK 50.03 billion (MWK 7.25 per share) was subsequently declared in January 2026.",
      "Looking to 2026, the Bank projects domestic economic growth of 3.8% with inflation averaging 24%. Management remains committed to its 2024–2026 strategic objectives, leveraging digital capabilities and an extensive distribution network to deliver sustained stakeholder value.",
    ],
    metrics: [
      { label: "Profit After Tax", value: "MWK 148bn", up: true },
      { label: "PAT Growth",       value: "+100%",     up: true },
      { label: "Total Revenue",    value: "MWK 333bn", up: true },
      { label: "Revenue Growth",   value: "+71%",      up: true },
      { label: "Total Assets",     value: "MWK 1.6tn", up: true },
      { label: "Customer Deposits",value: "MWK 1.1tn", up: true },
    ],
    time: "30 Mar 2026",
    source: "FDH Bank Plc",
    image: require("../../attached_assets/fdh_1784363470714.png"),
    featured: true,
  },
  {
    id: "2",
    category: "Banking",
    title: "FDH Bank Acquires Ecobank Mozambique, Establishing First Regional Foothold",
    summary: "FDH completed the acquisition of a 98.87% controlling stake in Ecobank Mozambique SA on 5 September 2025, marking its entry into the Southern African market.",
    body: [
      "On 5 September 2025, FDH Bank Plc successfully completed the acquisition of a 98.87% controlling stake in Ecobank Mozambique SA (EMZ) from Ecobank Transnational Incorporated (ETI). The remaining 1.13% minority shareholding is held by Fundo Para O Fomento De Habitação (FFH), a Housing Development Fund of the Republic of Mozambique.",
      "This acquisition represents a significant milestone in FDH Bank's regional expansion strategy and firmly establishes the institution's presence in the high-growth Southern African financial services market.",
      "Management expects the transaction to deliver multiple strategic benefits: market expansion through entry into a new geography; revenue diversification across jurisdictions; operational synergies through integration of systems, processes and group capabilities; and long-term value creation for shareholders and stakeholders.",
      "In accordance with IFRS 3 Business Combinations, the 2025 consolidated financial statements incorporate the assets, liabilities and post-acquisition results of EMZ from the acquisition date through to 31 December 2025.",
      "FDH Bank's total assets at Group level stand at MWK 1.635 trillion following the consolidation of EMZ, up from MWK 1.241 trillion at the end of 2024. Goodwill of MWK 6.178 billion has been recognised on the balance sheet arising from the transaction.",
    ],
    metrics: [
      { label: "Stake Acquired",      value: "98.87%",    up: true },
      { label: "Completion Date",     value: "5 Sep 2025" },
      { label: "Group Assets",        value: "MWK 1.6tn", up: true },
      { label: "Goodwill Recognised", value: "MWK 6.2bn" },
    ],
    time: "30 Mar 2026",
    source: "FDH Bank Plc",
    image: require("../../attached_assets/fdh_1784363470714.png"),
  },
  {
    id: "3",
    category: "Markets",
    title: "NITL Posts MWK 202 Billion Profit as Malawi Stock Exchange Returns 247%",
    summary: "National Investment Trust Ltd recorded a 579% jump in net profit, driven by MWK 201.9 billion in fair value gains as the MSE delivered its strongest year on record.",
    body: [
      "National Investment Trust Limited (NITL) has reported exceptional results for the year ended 31 December 2025, recording a Profit After Tax of MWK 202.128 billion — a staggering increase from the MWK 29.759 billion achieved in 2024.",
      "The standout driver of performance was MWK 201.872 billion in fair value gains on equity investments, compared with MWK 28.529 billion the prior year. These gains were fuelled by the Malawi Stock Exchange's extraordinary return of 247.63% in 2025 — a record annual performance for the exchange.",
      "Total assets surged 272.32% from MWK 74.32 billion in 2024 to MWK 276.71 billion in 2025. Equity investments at fair value closed the year at MWK 273.808 billion, reflecting both market appreciation and new investment activity.",
      "Dividend income grew 64.71% to MWK 3.076 billion as investee companies declared higher dividends on the back of their own strong performances. Interest income climbed 197% to MWK 730.3 million, reflecting elevated interest rates in the Malawian market.",
      "The Company's total expenses rose to MWK 1.677 billion (2024: MWK 584.4 million), primarily reflecting fund management fees and operating costs in line with the growth in assets under management. Basic and diluted earnings per share reached 1,497.25 tambala (2024: 220.44 tambala).",
    ],
    metrics: [
      { label: "Profit After Tax", value: "MWK 202bn",  up: true },
      { label: "PAT Growth",       value: "+579%",       up: true },
      { label: "Total Assets",     value: "MWK 276.7bn", up: true },
      { label: "MSE Return",       value: "247.63%",     up: true },
      { label: "Fair Value Gains", value: "MWK 201.9bn", up: true },
      { label: "EPS",              value: "K14.97",       up: true },
    ],
    time: "31 Mar 2026",
    source: "National Investment Trust Plc",
    image: require("../../attached_assets/NTL_1784364351667.png"),
  },
  {
    id: "4",
    category: "Markets",
    title: "NITL Declares MWK 11.00 Per Share Dividend After Landmark Investment Returns",
    summary: "The Board approved a second interim dividend of MWK 6.00 per share, with a first interim of MWK 5.00 paid in October 2025, bringing the FY2025 total to MWK 11.00.",
    body: [
      "National Investment Trust Limited (NITL) has announced a second interim dividend of MWK 6.00 per share (MWK 810 million in aggregate), approved at the Board meeting held on 24 March 2026. This follows the first interim dividend of MWK 5.00 per share (MWK 675 million) that was paid on 24 October 2025.",
      "Together, the two interim dividends bring NITL's FY2025 distributions to MWK 11.00 per share to date, a 57% increase on the MWK 7.00 per share that was paid during the equivalent period in 2024 (MWK 2.50 first interim and MWK 4.30 second interim).",
      "The second interim dividend will be paid on 17 April 2026 to shareholders on the register at the close of business on 10 April 2026. The register will be closed from 11 to 13 April 2026, with the ex-dividend date set as 8 April 2026.",
      "A final dividend for the year ended 31 December 2025 will be communicated to shareholders ahead of the Company's Annual General Meeting.",
      "The enhanced dividend reflects the company's exceptional FY2025 profitability of MWK 202.128 billion, underpinned by a 247.63% return from the Malawi Stock Exchange and MWK 201.9 billion in fair value gains on its equity portfolio.",
    ],
    metrics: [
      { label: "1st Interim Div",       value: "MWK 5.00/sh",  up: true },
      { label: "2nd Interim Div",       value: "MWK 6.00/sh",  up: true },
      { label: "FY2025 Total (so far)", value: "MWK 11.00/sh", up: true },
      { label: "Payment Date",          value: "17 Apr 2026" },
      { label: "Ex-Div Date",           value: "8 Apr 2026"  },
    ],
    time: "31 Mar 2026",
    source: "National Investment Trust Plc",
    image: require("../../attached_assets/NTL_1784364351667.png"),
  },
  {
    id: "5",
    category: "Insurance",
    title: "NICO Holdings Profit Surges 141% to MWK 323.5 Billion on Banking and Insurance Strength",
    summary: "Gross revenue climbed 74% to MWK 919.3 billion as NBS Bank and NICO Life drove record results across the Group's diversified financial services portfolio.",
    body: [
      "NICO Holdings Plc has posted a landmark set of consolidated results for the year ended 31 December 2025. Group Profit After Tax rose 141% to MWK 323.5 billion, up from a restated MWK 134.4 billion in 2024. Profit attributable to owners of the parent increased 133% to MWK 167.8 billion.",
      "Gross revenue for the Group grew 74% to MWK 919.3 billion (2024: MWK 529.2 billion), primarily driven by the banking and life insurance businesses. Total comprehensive income climbed 149% to MWK 346.2 billion.",
      "NBS Bank Plc — the Group's banking subsidiary — delivered a 106% increase in Profit After Tax to MWK 150.4 billion. Net interest income at the bank grew 92% to MWK 307.7 billion. The bank's balance sheet expanded 29% to MWK 1.54 trillion, with customer deposits up 43% to MWK 1.04 trillion and loans and advances up 49% to MWK 349.9 billion.",
      "NICO Life Insurance Company Limited recorded a 246% surge in Profit After Tax to MWK 155.6 billion, driven by organic growth, new business wins and strong investment returns from both fixed-income instruments and listed equities.",
      "NICO Asset Managers Limited grew assets under management 144% to MWK 4.4 trillion. NICO Pension Services registered a 208% profit increase to MWK 4.6 billion, while NICO Technologies grew profit 58% to MWK 1.5 billion.",
    ],
    metrics: [
      { label: "Group PAT",     value: "MWK 323.5bn", up: true },
      { label: "PAT Growth",    value: "+141%",        up: true },
      { label: "Gross Revenue", value: "MWK 919.3bn",  up: true },
      { label: "NBS Bank PAT",  value: "MWK 150.4bn",  up: true },
      { label: "NICO Life PAT", value: "MWK 155.6bn",  up: true },
      { label: "AUM (NAML)",    value: "MWK 4.4tn",    up: true },
    ],
    time: "2 Apr 2026",
    source: "NICO Holdings Plc",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80",
  },
  {
    id: "6",
    category: "Insurance",
    title: "NICO Life Posts 246% Profit Growth as Insurance Revenue Rises 61% to MWK 88 Billion",
    summary: "Strong investment returns from fixed-income instruments and listed equities, combined with new business wins, drove NICO Life's standout FY2025 performance.",
    body: [
      "NICO Life Insurance Company Limited, the life insurance subsidiary of NICO Holdings Plc, reported Profit After Tax of MWK 155.6 billion for the year ended 31 December 2025 — a 246% increase on the MWK 44.9 billion recorded in 2024.",
      "Total insurance revenue rose 61% to MWK 88.1 billion (2024: MWK 54.7 billion), reflecting a combination of organic business growth, new policy sales and strong retention across the business lines.",
      "The exceptional profitability growth was primarily driven by superior investment returns from the company's fixed-income portfolio and its holdings in listed equities on the Malawi Stock Exchange, which delivered a record 247.63% return during the year.",
      "NICO Life is positioned as the largest life insurer in Malawi by assets and premium income. The company continues to expand its product range, including group life, credit life, and individual life products catering to both retail and corporate clients.",
    ],
    metrics: [
      { label: "Profit After Tax",  value: "MWK 155.6bn", up: true },
      { label: "PAT Growth",        value: "+246%",        up: true },
      { label: "Insurance Revenue", value: "MWK 88.1bn",  up: true },
      { label: "Revenue Growth",    value: "+61%",         up: true },
    ],
    time: "2 Apr 2026",
    source: "NICO Holdings Plc",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80",
  },
  {
    id: "7",
    category: "Insurance",
    title: "NICO Holdings Announces MWK 40.05 Per Share Total Dividend — Up 100% Year-on-Year",
    summary: "The Board has proposed a final dividend of MWK 8.05 per share, bringing total FY2025 distributions to MWK 40.05 per share — double the MWK 20.00 paid in 2024.",
    body: [
      "NICO Holdings Plc has announced a proposed final dividend of MWK 8.05 per share (MWK 8.396 billion in aggregate) for the financial year ended 31 December 2025, subject to shareholder approval at the forthcoming Annual General Meeting.",
      "Including the three interim dividends already paid, total distributions in respect of FY2025 amount to MWK 40.05 per share — comprising a first interim of MWK 6.00, a second interim of MWK 6.00, a third interim of MWK 20.00, and the proposed final dividend of MWK 8.05.",
      "This represents a 100% increase on the MWK 20.00 per share total dividend paid in respect of FY2024, reflecting the extraordinary 141% profit growth achieved by the Group during the year.",
    ],
    metrics: [
      { label: "Total FY2025 Dividend", value: "MWK 40.05/sh", up: true },
      { label: "Dividend Growth",       value: "+100%",          up: true },
      { label: "Proposed Final Div",    value: "MWK 8.05/sh",   up: true },
      { label: "Total Payout",          value: "MWK 41.8bn",     up: true },
      { label: "Ex-Div Date",           value: "8 Apr 2026"  },
      { label: "Payment Date",          value: "20 Apr 2026" },
    ],
    time: "2 Apr 2026",
    source: "NICO Holdings Plc",
    image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&q=80",
  },
];

function imgSrc(image: any) {
  return typeof image === "string" ? { uri: image } : image;
}

function ArrowIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M13 6l6 6-6 6" stroke={TEAL} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function DetailModal({ item, onClose }: { item: NewsItem; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const RED_ERR = "#EF4770";

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[{ flex: 1, backgroundColor: c.background }, { paddingTop: Platform.OS === "ios" ? insets.top : 0 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingTop: 12, paddingHorizontal: 20, paddingBottom: 8, position: "relative" }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border }} />
          <TouchableOpacity onPress={onClose} style={{ position: "absolute", right: 20, top: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: c.card, alignItems: "center", justifyContent: "center" }} activeOpacity={0.7}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Line x1="18" y1="6" x2="6" y2="18" stroke={c.text} strokeWidth={2} strokeLinecap="round"/>
              <Line x1="6" y1="6" x2="18" y2="18" stroke={c.text} strokeWidth={2} strokeLinecap="round"/>
            </Svg>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <Image source={imgSrc(item.image)} style={{ width: "100%", height: 240, backgroundColor: c.card }} resizeMode="cover" />

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, marginTop: 18 }}>
            <View style={[{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 }, { backgroundColor: TEAL + "18" }]}>
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 11, color: TEAL }}>{item.category}</Text>
            </View>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}>{item.time}</Text>
            <Text style={{ color: MUTED, fontSize: 12 }}>·</Text>
            <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 12, color: c.text }}>{item.source}</Text>
          </View>

          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 20, color: c.text, lineHeight: 30, paddingHorizontal: 20, marginTop: 12 }}>{item.title}</Text>
          <View style={{ height: 1, backgroundColor: c.border, marginHorizontal: 20, marginVertical: 20 }} />

          {item.metrics && item.metrics.length > 0 && (
            <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: c.text, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Key Metrics</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {item.metrics.map((m, i) => (
                  <View key={i} style={{ backgroundColor: c.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, minWidth: "45%", flex: 1 }}>
                    <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: MUTED, marginBottom: 4 }}>{m.label}</Text>
                    <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: m.up !== undefined ? (m.up ? GREEN : RED_ERR) : c.text }}>{m.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ paddingHorizontal: 20, gap: 14 }}>
            {item.body.map((para, i) => (
              <Text key={i} style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: c.text, lineHeight: 23 }}>{para}</Text>
            ))}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

function HeroCard({ item, onPress, c }: { item: NewsItem; onPress: () => void; c: ReturnType<typeof useColors> }) {
  return (
    <TouchableOpacity activeOpacity={0.88} style={{ paddingHorizontal: 20 }} onPress={onPress}>
      <Image source={imgSrc(item.image)} style={{ width: "100%", height: 220, borderRadius: 16, backgroundColor: c.card }} resizeMode="cover" />
      <View style={{ marginTop: 14, gap: 6 }}>
        <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 20, color: c.text, lineHeight: 29 }} numberOfLines={3}>{item.title}</Text>
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED, lineHeight: 19 }} numberOfLines={2}>{item.summary}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}>{item.time}</Text>
          <View style={{ width: 1, height: 11, backgroundColor: c.border }} />
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 12, color: TEAL }}>{item.category}</Text>
          <View style={{ flex: 1 }} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 12, color: TEAL }}>Read more</Text>
            <ArrowIcon />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ThumbCard({ item, onPress, c }: { item: NewsItem; onPress: () => void; c: ReturnType<typeof useColors> }) {
  return (
    <TouchableOpacity activeOpacity={0.82} style={{ flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 20, gap: 14 }} onPress={onPress}>
      <Image source={imgSrc(item.image)} style={{ width: 90, height: 90, borderRadius: 12, backgroundColor: c.card, flexShrink: 0 }} resizeMode="cover" />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 14, color: c.text, lineHeight: 21 }} numberOfLines={2}>{item.title}</Text>
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED, lineHeight: 18 }} numberOfLines={2}>{item.summary}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}>{item.time}</Text>
          <View style={{ width: 1, height: 11, backgroundColor: c.border }} />
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 12, color: TEAL }}>{item.category}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function NewsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 44;
  const c = useColors();
  const [activeCategory, setActiveCategory] = useState("All");
  const [selected, setSelected] = useState<NewsItem | null>(null);

  const filtered = activeCategory === "All" ? NEWS_ITEMS : NEWS_ITEMS.filter((n) => n.category === activeCategory);
  const hero = filtered[0];
  const rest = filtered.slice(1);

  return (
    <View style={[{ flex: 1, backgroundColor: c.background }, { paddingTop: topPad }]}>
      {selected && <DetailModal item={selected} onClose={() => setSelected(null)} />}

      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14 }}>
        <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 24, color: c.text }}>Market News</Text>
        <TouchableOpacity activeOpacity={0.7} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.card, alignItems: "center", justifyContent: "center" }}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M12.02 2.91C8.71 2.91 6.02 5.6 6.02 8.91V11.8C6.02 12.41 5.76 13.34 5.45 13.86L4.3 15.77C3.59 16.95 4.08 18.26 5.38 18.7C9.69 20.14 14.34 20.14 18.65 18.7C19.86 18.3 20.39 16.87 19.73 15.77L18.58 13.86C18.28 13.34 18.02 12.41 18.02 11.8V8.91C18.02 5.61 15.32 2.91 12.02 2.91Z" stroke={c.text} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" />
            <Path d="M13.87 3.2C13.56 3.11 13.24 3.04 12.91 3C11.95 2.88 11.03 2.95 10.17 3.2C10.46 2.46 11.18 1.94 12.02 1.94C12.86 1.94 13.58 2.46 13.87 3.2Z" stroke={c.text} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M15.02 19.06C15.02 20.71 13.67 22.06 12.02 22.06C11.2 22.06 10.44 21.72 9.9 21.18C9.36 20.64 9.02 19.88 9.02 19.06" stroke={c.text} strokeWidth={1.5} strokeMiterlimit={10} />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Category pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }} style={{ flexGrow: 0, marginBottom: 10 }}>
        {CATEGORIES.map((cat) => {
          const active = cat === activeCategory;
          return (
            <TouchableOpacity
              key={cat} activeOpacity={0.75}
              onPress={() => setActiveCategory(cat)}
              style={[
                { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
                active
                  ? { backgroundColor: TEAL, borderColor: TEAL }
                  : { backgroundColor: c.card, borderColor: c.border },
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  { fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, textAlign: "center" },
                  active ? { color: "#FFFFFF" } : { color: c.text },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* News list */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {hero && <HeroCard item={hero} onPress={() => setSelected(hero)} c={c} />}
        {rest.length > 0 && <View style={{ height: 1, backgroundColor: c.border, marginVertical: 20, marginHorizontal: 20 }} />}
        {rest.map((item, i) => (
          <React.Fragment key={item.id}>
            <ThumbCard item={item} onPress={() => setSelected(item)} c={c} />
            {i < rest.length - 1 && <View style={{ height: 1, backgroundColor: c.border, marginVertical: 16, marginHorizontal: 20 }} />}
          </React.Fragment>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

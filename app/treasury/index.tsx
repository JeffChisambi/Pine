import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { guardedBack } from "@/utils/navigation";
import { ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/useColors";
import { type TBillOption } from "@/data/treasury";
import { useTreasuryProducts } from "@/hooks/useTreasury";

const GREEN  = "#45B369";
const WHITE  = "#FFFFFF";
const MUTED  = "#9CA3AF";

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19l-7-7 7-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M9 5l7 7-7 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const STATUS_CONFIG = {
  open:         { bg: `${GREEN}22`,    text: GREEN,     label: "Open"         },
  closing_soon: { bg: "#F59E0B22",     text: "#F59E0B", label: "Closing"      },
  closed:       { bg: "#EF444422",     text: "#EF4444", label: "Closed"       },
};

function BillCard({ bill, c }: { bill: TBillOption; c: ReturnType<typeof useColors> }) {
  const s = STATUS_CONFIG[bill.status];
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: "/treasury/details" as any, params: { id: bill.id } })}
      style={{
        backgroundColor: c.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: c.border,
        paddingHorizontal: 18,
        paddingVertical: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      {/* Left: duration */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 20, color: c.text, lineHeight: 26 }}>
          {bill.duration} Days
        </Text>
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED, marginTop: 2 }}>
          Min MWK {bill.minInvestment.toLocaleString()}
        </Text>
      </View>

      {/* Centre: yield */}
      <View style={{ alignItems: "flex-end", marginRight: 14 }}>
        <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 22, color: GREEN, lineHeight: 28 }}>
          {bill.yieldPct}%
        </Text>
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: MUTED, marginTop: 2 }}>
          Annual yield
        </Text>
      </View>

      {/* Right: status + chevron */}
      <View style={{ alignItems: "flex-end", gap: 8 }}>
        <View style={{ backgroundColor: s.bg, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 11, color: s.text }}>{s.label}</Text>
        </View>
        <ChevronIcon color={MUTED} />
      </View>
    </TouchableOpacity>
  );
}

export default function TreasuryLanding() {
  const { data: products = [], isLoading } = useTreasuryProducts();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 44;
  const c = useColors();

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>

      {/* ── Nav header ── */}
      <View style={{
        paddingTop: topPad + 8,
        paddingHorizontal: 20,
        paddingBottom: 10,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: c.background,
      }}>
        <TouchableOpacity
          onPress={() => guardedBack("/(tabs)")}
          activeOpacity={0.7}
          style={{ width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" }}
        >
          <BackIcon color={c.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center", paddingRight: 40 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text }}>
            Treasury Bills
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
      >

        {/* ── Hero card ── */}
        <View style={{
          backgroundColor: "#0D3540",
          borderRadius: 20,
          padding: 24,
          marginBottom: 28,
        }}>
          {/* Badge */}
          <View style={{
            alignSelf: "flex-start",
            backgroundColor: "rgba(69,179,105,0.18)",
            borderRadius: 6,
            paddingHorizontal: 9,
            paddingVertical: 4,
            marginBottom: 14,
          }}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 10, color: GREEN, letterSpacing: 1.4 }}>
              GOVERNMENT SECURITIES
            </Text>
          </View>

          {/* Title */}
          <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 26, color: WHITE, lineHeight: 33, marginBottom: 8 }}>
            Treasury Bills
          </Text>

          {/* Subtitle */}
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: "rgba(255,255,255,0.52)", lineHeight: 19, marginBottom: 22 }}>
            Short-term, government-backed investments with guaranteed returns.
          </Text>

          {/* Stats row */}
          <View style={{ flexDirection: "row", gap: 24 }}>
            {[
              { label: "Yield",    value: "Up to 28.5%" },
              { label: "Terms",    value: "91–364 days"  },
              { label: "Risk",     value: "Very Low"     },
            ].map((stat) => (
              <View key={stat.label}>
                <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 14, color: WHITE }}>{stat.value}</Text>
                <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: "rgba(255,255,255,0.42)", marginTop: 2 }}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Section heading ── */}
        <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text, marginBottom: 4 }}>
          Current Offerings
        </Text>
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED, marginBottom: 16 }}>
          Select a term to view details and invest
        </Text>

        {/* ── Bill cards (DB-driven) ── */}
        {isLoading ? (
          <View style={{ paddingTop: 40, alignItems: "center" }}>
            <ActivityIndicator color={c.text} />
          </View>
        ) : products.length === 0 ? (
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED, textAlign: "center", paddingTop: 24 }}>
            No treasury bills available right now.
          </Text>
        ) : (
          products.map((bill) => (
            <BillCard key={bill.id} bill={bill as TBillOption} c={c} />
          ))
        )}

      </ScrollView>
    </View>
  );
}

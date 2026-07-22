import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path, Rect } from "react-native-svg";
import { guardedBack, guardedPush } from "@/utils/navigation";
import { useColors } from "@/hooks/useColors";
import { TBILL_OPTIONS, type TBillOption } from "./data";

const TEAL = "#164951";
const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19l-7-7 7-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ShieldIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TrendIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M22 7l-8.5 8.5-5-5L2 17" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15 7h7v7" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={4} width={18} height={18} rx={2} stroke={color} strokeWidth={1.8} />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}


function StatusBadge({ status }: { status: TBillOption["status"] }) {
  const configs = {
    open: { bg: GREEN + "22", text: GREEN, label: "Open" },
    closing_soon: { bg: "#F59E0B22", text: "#F59E0B", label: "Closing Soon" },
    closed: { bg: "#EF444422", text: "#EF4444", label: "Closed" },
  };
  const cfg = configs[status];
  return (
    <View style={{ backgroundColor: cfg.bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 }}>
      <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 11, color: cfg.text }}>{cfg.label}</Text>
    </View>
  );
}

function BillCard({ bill, c }: { bill: TBillOption; c: ReturnType<typeof useColors> }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: "/treasury/details" as any, params: { id: bill.id } })}
      style={{
        backgroundColor: c.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: c.border,
        padding: 18,
        marginBottom: 14,
      }}
    >
      {/* Top row */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text }}>{bill.duration} Days</Text>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED, marginTop: 3 }}>Treasury Bill</Text>
        </View>
        <StatusBadge status={bill.status} />
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
        <View style={{ flex: 1, borderRadius: 10, padding: 12 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: MUTED, marginBottom: 4 }}>Annual Yield</Text>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 17, color: GREEN }}>{bill.yieldPct}%</Text>
        </View>
        <View style={{ flex: 1, borderRadius: 10, padding: 12 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: MUTED, marginBottom: 4 }}>Min Investment</Text>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: c.text }}>MWK {bill.minInvestment.toLocaleString()}</Text>
        </View>
      </View>

    </TouchableOpacity>
  );
}

export default function TreasuryLanding() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 44;
  const c = useColors();

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <View style={{ backgroundColor: c.background, paddingTop: topPad + 8, paddingBottom: 0, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
          <TouchableOpacity
            onPress={() => guardedBack("/(tabs)")}
            activeOpacity={0.7}
            style={{ width: 40, height: 40, justifyContent: "center" }}
          >
            <BackIcon color={c.text} />
          </TouchableOpacity>
          <Text style={{ flex: 1, textAlign: "center", fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text }}>Treasury Bills</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Hero section */}
        <View style={{ paddingHorizontal: 8, paddingBottom: 32 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 26, color: c.text, lineHeight: 34, marginBottom: 8 }}>
            Grow your money{"\n"}with government securities
          </Text>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: MUTED, lineHeight: 21 }}>
            Treasury bills are short-term, low-risk investments backed by the Government of Malawi. Earn guaranteed returns on your savings.
          </Text>
        </View>

        {/* Benefits strip */}
        <View style={{
          flexDirection: "row",
          backgroundColor: c.card,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 14,
          padding: 16,
          marginBottom: 16,
          gap: 12,
        }}>
          {[
            { icon: <ShieldIcon color={c.text} />, label: "Gov't Backed" },
            { icon: <TrendIcon color={c.text} />, label: "Fixed Returns" },
            { icon: <CalendarIcon color={c.text} />, label: "Short-Term" },
          ].map((item) => (
            <View key={item.label} style={{ flex: 1, alignItems: "center", gap: 6 }}>
              {item.icon}
              <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 11, color: c.text, textAlign: "center" }}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Body */}
      <View style={{ flex: 1, backgroundColor: c.background, paddingTop: 12 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text, marginBottom: 4 }}>Current Opportunities</Text>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED, marginBottom: 20 }}>Select a bill to view details and invest</Text>

          {TBILL_OPTIONS.map((bill) => (
            <BillCard key={bill.id} bill={bill} c={c} />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

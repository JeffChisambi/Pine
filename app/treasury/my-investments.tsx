import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { guardedBack, guardedPush } from "@/utils/navigation";
import { useColors } from "@/hooks/useColors";
import { MOCK_INVESTMENTS, TBILL_OPTIONS, type TBillInvestment } from "@/data/treasury";

const TEAL = "#164951";
const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";
const AMBER = "#F59E0B";

const TABS = ["Active", "Pending", "Matured"] as const;
type TabType = (typeof TABS)[number];

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19l-7-7 7-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StatusPill({ status }: { status: TBillInvestment["status"] }) {
  const configs = {
    active: { bg: GREEN + "22", text: GREEN, label: "Active" },
    pending: { bg: AMBER + "22", text: AMBER, label: "Pending" },
    matured: { bg: "#6366F122", text: "#6366F1", label: "Matured" },
    closed: { bg: MUTED + "22", text: MUTED, label: "Closed" },
  };
  const cfg = configs[status];
  return (
    <View style={{ backgroundColor: cfg.bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 }}>
      <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 11, color: cfg.text }}>{cfg.label}</Text>
    </View>
  );
}

function InvestmentCard({ inv, c }: { inv: TBillInvestment; c: ReturnType<typeof useColors> }) {
  const bill = TBILL_OPTIONS.find((b) => b.id === inv.billId);
  const daysRemaining = (() => {
    const maturity = new Date(inv.maturityDate.replace(" ", " "));
    const today = new Date();
    const diff = Math.max(0, Math.ceil((maturity.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    return diff;
  })();
  const progressPct = Math.max(0, Math.min(1, 1 - daysRemaining / inv.duration));

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => guardedPush(() => router.push({ pathname: "/treasury/investment-detail" as any, params: { id: inv.id } }))}
      style={{
        backgroundColor: c.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: c.border,
        padding: 18,
        marginBottom: 14,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <View>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 17, color: c.text }}>{inv.duration}-Day T-Bill</Text>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED, marginTop: 3 }}>
            Ref: {inv.referenceNumber}
          </Text>
        </View>
        <StatusPill status={inv.status} />
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
        <View style={{ flex: 1, backgroundColor: c.background, borderRadius: 10, padding: 12 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: MUTED, marginBottom: 4 }}>Invested</Text>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: c.text }}>
            MWK {inv.amountInvested.toLocaleString()}
          </Text>
        </View>
        <View style={{ flex: 1, backgroundColor: c.background, borderRadius: 10, padding: 12 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: MUTED, marginBottom: 4 }}>Est. Maturity</Text>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: GREEN }}>
            MWK {inv.estimatedMaturityValue.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      {inv.status !== "matured" && (
        <View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}>
              {inv.status === "pending" ? "Awaiting auction" : `${daysRemaining} days remaining`}
            </Text>
            <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 12, color: c.text }}>
              {inv.maturityDate}
            </Text>
          </View>
          <View style={{ height: 5, backgroundColor: c.border, borderRadius: 3 }}>
            <View style={{ height: 5, width: `${progressPct * 100}%`, backgroundColor: inv.status === "pending" ? AMBER : GREEN, borderRadius: 3 }} />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

function EmptyState({ tab, c }: { tab: TabType; c: ReturnType<typeof useColors> }) {
  return (
    <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 40 }}>
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: c.card, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
          <Path d="M3 3h18v4H3zM3 9h18v12H3z" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M9 13h6M9 17h4" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
      </View>
      <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: c.text, marginBottom: 8, textAlign: "center" }}>
        No {tab} Investments
      </Text>
      <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: MUTED, textAlign: "center", lineHeight: 21 }}>
        You don't have any {tab.toLowerCase()} Treasury Bill investments yet.
      </Text>
    </View>
  );
}

export default function MyInvestments() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 44;
  const c = useColors();
  const [activeTab, setActiveTab] = useState<TabType>("Active");

  const filteredInvestments = MOCK_INVESTMENTS.filter((inv) => inv.status === activeTab.toLowerCase());

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <View style={{ backgroundColor: c.background, paddingTop: topPad + 8, paddingBottom: 0, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
          <TouchableOpacity onPress={() => guardedBack("/(tabs)")} activeOpacity={0.7} style={{ width: 40, height: 40, justifyContent: "center" }}>
            <BackIcon color={c.text} />
          </TouchableOpacity>
          <Text style={{ flex: 1, textAlign: "center", fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text }}>
            My T-Bill Investments
          </Text>
          <TouchableOpacity
            onPress={() => guardedPush(() => router.push("/treasury" as any))}
            style={{ width: 40, height: 40, justifyContent: "center", alignItems: "center" }}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={12} r={10} stroke={c.text} strokeWidth={1.8} />
              <Path d="M12 8v8M8 12h8" stroke={c.text} strokeWidth={1.8} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: "row", gap: 4, paddingBottom: 0 }}>
          {TABS.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.75}
                style={{
                  flex: 1,
                  height: 40,
                  alignItems: "center",
                  justifyContent: "center",
                  borderBottomWidth: 2.5,
                  borderBottomColor: isActive ? TEAL : "transparent",
                }}
              >
                <Text style={{ fontFamily: isActive ? "PlusJakartaSans_600SemiBold" : "PlusJakartaSans_400Regular", fontSize: 14, color: isActive ? c.text : MUTED }}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Body */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        style={{ flex: 1, backgroundColor: c.background }}
      >
        {filteredInvestments.length === 0 ? (
          <EmptyState tab={activeTab} c={c} />
        ) : (
          filteredInvestments.map((inv) => (
            <InvestmentCard key={inv.id} inv={inv} c={c} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

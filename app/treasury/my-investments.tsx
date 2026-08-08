import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { guardedBack, guardedPush } from "@/utils/navigation";
import { useColors } from "@/hooks/useColors";
import { type TBillInvestment } from "@/data/treasury";
import { useMyInvestments } from "@/hooks/useTreasury";
import { mapInvestment, investmentYield } from "@/utils/treasury-map";
import type { ApiTBillInvestment } from "@/services/api";

const TEAL = "#164951";
const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";
const AMBER = "#F59E0B";
const INDIGO = "#6366F1";

const TABS = ["Active", "Pending", "Matured"] as const;
type TabType = (typeof TABS)[number];

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19l-7-7 7-7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function fmt(n: number): string {
  const [w, d] = n.toFixed(2).split(".");
  return `${Number(w).toLocaleString()}.${d}`;
}

function StatusBadge({
  status,
  daysRemaining,
}: {
  status: TBillInvestment["status"];
  daysRemaining: number;
}) {
  const isMaturingSoon = status === "active" && daysRemaining <= 7 && daysRemaining > 0;
  const configs: Record<string, { bg: string; text: string; label: string }> = {
    maturing_soon: { bg: AMBER + "18", text: AMBER, label: "MATURING SOON" },
    active: { bg: GREEN + "18", text: GREEN, label: "ACTIVE" },
    pending: { bg: AMBER + "18", text: AMBER, label: "PENDING" },
    matured: { bg: INDIGO + "18", text: INDIGO, label: "MATURED" },
    closed: { bg: MUTED + "22", text: MUTED, label: "CLOSED" },
  };
  const key = isMaturingSoon ? "maturing_soon" : status;
  const cfg = configs[key] || configs.closed;
  return (
    <View style={{ backgroundColor: cfg.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
      <Text
        style={{
          fontFamily: "PlusJakartaSans_700Bold",
          fontSize: 10,
          color: cfg.text,
          letterSpacing: 0.5,
        }}
      >
        {cfg.label}
      </Text>
    </View>
  );
}

function BillCard({
  inv,
  yieldPct,
  c,
}: {
  inv: TBillInvestment;
  yieldPct: number;
  c: ReturnType<typeof useColors>;
}) {
  const daysRemaining = (() => {
    const maturity = new Date(inv.maturityDate);
    if (isNaN(maturity.getTime())) return 0;
    const today = new Date();
    return Math.max(0, Math.ceil((maturity.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  })();
  const progressPct =
    inv.duration > 0 ? Math.max(0, Math.min(1, 1 - daysRemaining / inv.duration)) : 0;
  const isPending = inv.status === "pending";
  const isMatured = inv.status === "matured";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() =>
        guardedPush(() =>
          router.push({
            pathname: "/treasury/investment-detail" as any,
            params: { id: inv.id },
          }),
        )
      }
      style={{
        backgroundColor: c.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: c.border,
        padding: 18,
        marginBottom: 14,
      }}
    >
      {/* Title + badge */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 4,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 17, color: c.text }}>
            {inv.duration}-day bill
          </Text>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_400Regular",
              fontSize: 12,
              color: MUTED,
              marginTop: 2,
            }}
          >
            {inv.referenceNumber} · {yieldPct}%
          </Text>
        </View>
        <StatusBadge status={inv.status} daysRemaining={daysRemaining} />
      </View>

      {/* Amount row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginTop: 12,
          marginBottom: 12,
        }}
      >
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED }}>
          {isPending ? "Bid amount" : "Invested"}
        </Text>
        <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 17, color: c.text }}>
          K{fmt(inv.amountInvested)}
        </Text>
      </View>

      {/* Progress bar */}
      {!isMatured && (
        <View style={{ marginBottom: 8 }}>
          <View style={{ height: 4, backgroundColor: c.border, borderRadius: 2, marginBottom: 8 }}>
            <View
              style={{
                height: 4,
                width: `${Math.max(progressPct * 100, isPending ? 0 : 2)}%` as any,
                backgroundColor: isPending ? AMBER : GREEN,
                borderRadius: 2,
              }}
            />
          </View>
        </View>
      )}

      {/* Bottom info row */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        {isPending ? (
          <>
            <Text
              style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}
            >
              Settles {inv.investmentDate}
            </Text>
            <Text
              style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}
            >
              Awaiting allotment
            </Text>
          </>
        ) : isMatured ? (
          <>
            <Text
              style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}
            >
              Paid out {inv.maturityDate}
            </Text>
            <Text
              style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text }}
            >
              K{fmt(inv.estimatedMaturityValue)}
            </Text>
          </>
        ) : (
          <>
            <Text
              style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}
            >
              {inv.maturityDate} · {daysRemaining} days left
            </Text>
            <Text
              style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text }}
            >
              K{fmt(inv.estimatedMaturityValue)}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ tab, c }: { tab: TabType; c: ReturnType<typeof useColors> }) {
  return (
    <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 40 }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: c.card,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 3h18v4H3zM3 9h18v12H3z"
            stroke={MUTED}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="M9 13h6M9 17h4" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
      </View>
      <Text
        style={{
          fontFamily: "PlusJakartaSans_600SemiBold",
          fontSize: 17,
          color: c.text,
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        No {tab} Bills
      </Text>
      <Text
        style={{
          fontFamily: "PlusJakartaSans_400Regular",
          fontSize: 14,
          color: MUTED,
          textAlign: "center",
          lineHeight: 21,
        }}
      >
        You don't have any {tab.toLowerCase()} Treasury Bill investments yet.
      </Text>
    </View>
  );
}

export default function MyBills() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 16;
  const c = useColors();
  const [activeTab, setActiveTab] = useState<TabType>("Active");

  const { data: apiInvestments = [] } = useMyInvestments();

  const filteredInvestments = apiInvestments.filter((inv: ApiTBillInvestment) => {
    const s = (inv.status || "").toLowerCase();
    if (activeTab === "Active") return s === "active";
    if (activeTab === "Pending") return s === "pending" || s === "submitted";
    if (activeTab === "Matured") return s === "matured";
    return false;
  });

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <View style={{ paddingTop: topPad, paddingBottom: 0, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => guardedBack("/treasury")}
            activeOpacity={0.7}
            style={{ width: 40, height: 40, justifyContent: "center" }}
          >
            <BackIcon color={c.text} />
          </TouchableOpacity>
          <Text
            style={{
              flex: 1,
              textAlign: "center",
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 18,
              color: c.text,
            }}
          >
            My Bills
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: "row", gap: 4 }}>
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
                <Text
                  style={{
                    fontFamily: isActive
                      ? "PlusJakartaSans_600SemiBold"
                      : "PlusJakartaSans_400Regular",
                    fontSize: 14,
                    color: isActive ? c.text : MUTED,
                  }}
                >
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
        style={{ flex: 1 }}
      >
        {filteredInvestments.length === 0 ? (
          <EmptyState tab={activeTab} c={c} />
        ) : (
          filteredInvestments.map((apiInv: ApiTBillInvestment) => {
            const inv = mapInvestment(apiInv);
            const yp = investmentYield(apiInv);
            return <BillCard key={inv.id} inv={inv} yieldPct={yp} c={c} />;
          })
        )}
      </ScrollView>
    </View>
  );
}

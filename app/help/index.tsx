import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Linking,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { guardedBack } from "@/utils/navigation";
import { useSupportTickets } from "@/hooks/useSupport";
import type { SupportTicketSummary } from "@/services/api";

const TEAL = "#164951";
const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";

const CONTACT = {
  phone: "+265 1 820 400",
  phoneHours: "Mon–Fri, 8am–5pm",
  email: "help@pine.mw",
};

const FAQ: { q: string; a: string }[] = [
  { q: "How long do deposits take to reflect?", a: "Card and mobile-money deposits usually reflect within a few minutes. If it has been longer than an hour, open a report and we'll investigate." },
  { q: "When are treasury bill returns paid?", a: "T-bill principal and interest are paid at maturity, based on the tenor you selected when you invested." },
  { q: "Why is my account not verified yet?", a: "KYC review can take up to 24 hours. You'll get a notification once your identity is approved." },
  { q: "How do I withdraw to my bank?", a: "Go to Wallet → Withdraw, choose a linked bank, and confirm with your PIN. Withdrawals are processed on business days." },
];

function statusStyle(status: SupportTicketSummary["status"]) {
  switch (status) {
    case "OPEN": return { bg: "rgba(245,158,11,0.14)", fg: "#B45309", label: "Open" };
    case "IN_REVIEW": return { bg: "rgba(59,130,246,0.14)", fg: "#2563EB", label: "In review" };
    case "RESOLVED": return { bg: "rgba(69,179,105,0.16)", fg: "#2F8F52", label: "Resolved" };
    case "CLOSED": return { bg: "rgba(156,163,175,0.18)", fg: "#6B7280", label: "Closed" };
    default: return { bg: "rgba(156,163,175,0.18)", fg: "#6B7280", label: status };
  }
}

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 16;
  const c = useColors();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: tickets, isLoading, refetch } = useSupportTickets();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refetch(); } finally { setRefreshing(false); }
  }, [refetch]);

  const faq = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQ;
    return FAQ.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [query]);

  const myReports = (tickets ?? []).slice(0, 3);

  return (
    <View style={{ flex: 1, backgroundColor: c.background, paddingTop: topPad }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 8, gap: 6 }}>
        <TouchableOpacity onPress={() => guardedBack("/(tabs)/profile")} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <Feather name="chevron-left" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 20, color: c.text }}>Help & Support</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TEAL} colors={[TEAL]} />}
      >
        {/* Search */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 14, paddingHorizontal: 14, height: 48, marginTop: 6 }}>
          <Feather name="search" size={18} color={MUTED} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search help articles"
            placeholderTextColor={MUTED}
            style={{ flex: 1, fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: c.text, padding: 0 }}
          />
        </View>

        {/* Report a problem card */}
        <View style={{ backgroundColor: TEAL, borderRadius: 18, padding: 20, marginTop: 16 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 17, color: WHITE }}>Report a problem</Text>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: "rgba(255,255,255,0.82)", lineHeight: 20, marginTop: 6 }}>
            Something broken, a wrong balance, a stuck trade — tell us and we'll investigate.
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/help/report" as any)}
            style={{ flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 8, backgroundColor: GREEN, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 16, marginTop: 16 }}
          >
            <Feather name="message-square" size={16} color={WHITE} />
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: WHITE }}>Send a report</Text>
          </TouchableOpacity>
        </View>

        {/* Get in touch */}
        <SectionLabel c={c}>GET IN TOUCH</SectionLabel>
        <View style={{ backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 16, overflow: "hidden" }}>
          <ContactRow
            c={c} icon="message-circle" title="Live chat" sub="Typical reply under 5 minutes"
            right={<View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: GREEN }} />
              <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 12, color: GREEN }}>Online</Text>
            </View>}
            onPress={() => router.push("/help/report" as any)}
          />
          <Divider c={c} />
          <ContactRow c={c} icon="phone" title="Call us" sub={`${CONTACT.phone} · ${CONTACT.phoneHours}`} onPress={() => Linking.openURL(`tel:${CONTACT.phone.replace(/\s/g, "")}`)} chevron />
          <Divider c={c} />
          <ContactRow c={c} icon="mail" title="Email support" sub={`${CONTACT.email} · replies within 24h`} onPress={() => Linking.openURL(`mailto:${CONTACT.email}`)} chevron />
        </View>

        {/* My reports */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 24, marginBottom: 10 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 12, letterSpacing: 0.5, color: MUTED }}>MY REPORTS</Text>
          {(tickets?.length ?? 0) > 3 && (
            <TouchableOpacity onPress={() => router.push("/help/report" as any)}>
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: GREEN }}>View All</Text>
            </TouchableOpacity>
          )}
        </View>
        {isLoading ? (
          <View style={{ paddingVertical: 24, alignItems: "center" }}><ActivityIndicator color={TEAL} /></View>
        ) : myReports.length === 0 ? (
          <View style={{ backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 16, padding: 20, alignItems: "center" }}>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED, textAlign: "center" }}>
              You have no reports yet. Tap “Send a report” if something needs attention.
            </Text>
          </View>
        ) : (
          <View style={{ backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 16, overflow: "hidden" }}>
            {myReports.map((t, i) => {
              const s = statusStyle(t.status);
              return (
                <View key={t.ticketId}>
                  {i > 0 && <Divider c={c} />}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.push({ pathname: "/help/ticket" as any, params: { id: t.ticketId } })}
                    style={{ paddingHorizontal: 16, paddingVertical: 14 }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <Text numberOfLines={1} style={{ flex: 1, fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text }}>{t.subject}</Text>
                      <View style={{ backgroundColor: s.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
                        <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 11, color: s.fg }}>{s.label}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
                      <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}>
                        #{t.reference} · opened {fmtDay(t.createdAt)}
                      </Text>
                      {t.unread && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN }} />}
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Common questions */}
        <SectionLabel c={c}>COMMON QUESTIONS</SectionLabel>
        <View style={{ backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 16, overflow: "hidden" }}>
          {faq.length === 0 ? (
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED, padding: 16 }}>No articles match “{query}”.</Text>
          ) : faq.map((f, i) => {
            const open = expanded === i;
            return (
              <View key={f.q}>
                {i > 0 && <Divider c={c} />}
                <TouchableOpacity activeOpacity={0.7} onPress={() => setExpanded(open ? null : i)} style={{ paddingHorizontal: 16, paddingVertical: 15, flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Text style={{ flex: 1, fontFamily: "PlusJakartaSans_500Medium", fontSize: 14, color: c.text }}>{f.q}</Text>
                  <Feather name={open ? "chevron-up" : "chevron-down"} size={18} color={MUTED} />
                </TouchableOpacity>
                {open && (
                  <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: c.mutedForeground, lineHeight: 21, paddingHorizontal: 16, paddingBottom: 15 }}>{f.a}</Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function SectionLabel({ children, c }: { children: React.ReactNode; c: ReturnType<typeof useColors> }) {
  return <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 12, letterSpacing: 0.5, color: MUTED, marginTop: 24, marginBottom: 10 }}>{children}</Text>;
}

function Divider({ c }: { c: ReturnType<typeof useColors> }) {
  return <View style={{ height: 1, backgroundColor: c.border, marginLeft: 16 }} />;
}

function ContactRow({ c, icon, title, sub, right, chevron, onPress }: {
  c: ReturnType<typeof useColors>; icon: any; title: string; sub: string;
  right?: React.ReactNode; chevron?: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14 }}>
      <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: c.muted, alignItems: "center", justifyContent: "center" }}>
        <Feather name={icon} size={18} color={c.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text }}>{title}</Text>
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED, marginTop: 2 }}>{sub}</Text>
      </View>
      {right ?? (chevron ? <Feather name="chevron-right" size={18} color={MUTED} /> : null)}
    </TouchableOpacity>
  );
}

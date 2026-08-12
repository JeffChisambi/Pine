/**
 * broker-select.tsx
 *
 * Choose Your Broker — the investor's core account relationship.
 * A broker must be selected before deposits or trading are possible
 * (the backend rejects both with BROKER_REQUIRED otherwise).
 *
 * Selecting with no current broker → confirm alert → PUT /brokers/me.
 * Changing an existing broker → warning alert → PUT with confirmChange: true.
 * A blocked change (funds / holdings / open orders / pending transactions)
 * returns 409 — the server's message is shown verbatim.
 */
import { guardedBack } from "@/utils/navigation";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Circle, Path } from "react-native-svg";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "../services/auth-context";
import {
  brokersApi,
  ApiError,
  getErrorMessage,
  logHandledError,
  type Broker,
} from "../services/api";

const WHITE = "#FFFFFF";
const GREEN = "#45B369";

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19l-7-7 7-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Circle cx={10} cy={10} r={10} fill={GREEN} />
      <Path d="M6 10l2.75 2.75L14 7.5" stroke={WHITE} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BriefcaseIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8h16a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a1 1 0 0 1 1-1Z" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12.5h18" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function BrokerSelectScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top;
  const c = useColors();
  const qc = useQueryClient();
  const { user, refreshProfile } = useAuth();

  // brokerId currently being submitted (drives the per-card spinner)
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const brokersQuery = useQuery({
    queryKey: ["brokers", "list"],
    queryFn: () => brokersApi.list(),
  });

  const myBrokerQuery = useQuery({
    queryKey: ["brokers", "me"],
    queryFn: () => brokersApi.me(),
  });

  // Prefer the live /brokers/me answer; fall back to the cached profile.
  const currentBrokerId =
    myBrokerQuery.data !== undefined
      ? myBrokerQuery.data.broker?.id ?? null
      : user?.broker?.id ?? null;

  const doSelect = async (broker: Broker, confirmChange: boolean) => {
    setSubmittingId(broker.id);
    try {
      await brokersApi.select(broker.id, confirmChange);
      await qc.invalidateQueries({ queryKey: ["brokers"] });
      await refreshProfile();
      guardedBack("/(tabs)");
    } catch (err) {
      logHandledError("Broker select", err);
      if (err instanceof ApiError && err.status === 409) {
        // Change blocked (funds / holdings / open orders / pending
        // transactions) or confirmation required — show the server's
        // message verbatim.
        Alert.alert("Broker Change Not Allowed", getErrorMessage(err));
      } else {
        Alert.alert("Broker Not Selected", getErrorMessage(err));
      }
    } finally {
      setSubmittingId(null);
    }
  };

  const handleTapBroker = (broker: Broker) => {
    if (submittingId) return;
    if (broker.id === currentBrokerId) return; // already selected

    if (!currentBrokerId) {
      // First-time selection — simple confirmation.
      Alert.alert(
        `Trade with ${broker.name}?`,
        "Your deposits, orders and portfolio will be held with this broker.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Confirm", onPress: () => doSelect(broker, false) },
        ],
      );
    } else {
      // Changing an existing broker — explicit warning, then confirmChange.
      Alert.alert(
        "Switch Broker?",
        "Switching brokers is only possible when you have no funds, holdings or open orders.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Continue", onPress: () => doSelect(broker, true) },
        ],
      );
    }
  };

  const styles = StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background,
    },

    /* Header */
    header: {
      backgroundColor: c.background,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 0,
    },
    backBtn: {
      width: 40,
      height: 40,
      justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontFamily: "PlusJakartaSans_700Bold",
      fontSize: 18,
      color: c.text,
    },

    /* Body */
    bodyContent: {
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 32,
    },
    introText: {
      fontFamily: "PlusJakartaSans_400Regular",
      fontSize: 13,
      color: c.mutedForeground,
      lineHeight: 19,
      marginBottom: 20,
    },

    /* Broker card */
    brokerCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: c.border,
      padding: 14,
      gap: 14,
      marginBottom: 14,
    },
    brokerCardActive: {
      borderColor: c.primary,
    },
    logoWrap: {
      width: 44,
      height: 44,
      borderRadius: 10,
      overflow: "hidden",
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    logo: {
      width: 44,
      height: 44,
    },
    brokerInfo: {
      flex: 1,
    },
    brokerNameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 3,
    },
    brokerName: {
      fontFamily: "PlusJakartaSans_600SemiBold",
      fontSize: 15,
      color: c.text,
      flexShrink: 1,
    },
    codeBadge: {
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    codeBadgeText: {
      fontFamily: "PlusJakartaSans_600SemiBold",
      fontSize: 10,
      color: c.mutedForeground,
      letterSpacing: 0.5,
    },
    brokerDesc: {
      fontFamily: "PlusJakartaSans_400Regular",
      fontSize: 12,
      color: c.mutedForeground,
      lineHeight: 17,
    },
    uncheckCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: c.mutedForeground,
    },

    /* Load / empty / error states */
    stateWrap: {
      alignItems: "center",
      paddingVertical: 48,
      gap: 14,
    },
    stateText: {
      fontFamily: "PlusJakartaSans_400Regular",
      fontSize: 13,
      color: c.mutedForeground,
      textAlign: "center",
      lineHeight: 19,
      paddingHorizontal: 12,
    },
    retryBtn: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      paddingHorizontal: 18,
      paddingVertical: 9,
      backgroundColor: c.card,
    },
    retryBtnText: {
      fontFamily: "PlusJakartaSans_600SemiBold",
      fontSize: 13,
      color: c.text,
    },
  });

  const brokers = brokersQuery.data ?? [];

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => guardedBack("/(tabs)")}>
          <BackIcon color={c.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Broker</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.introText}>
          Your broker holds your account, funds and shares, and executes your
          orders on the Malawi Stock Exchange. You need one before you can
          deposit or trade.
        </Text>

        {brokersQuery.isPending ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator color={c.primary} />
            <Text style={styles.stateText}>Loading brokers…</Text>
          </View>
        ) : brokersQuery.isError ? (
          <View style={styles.stateWrap}>
            <Text style={styles.stateText}>{getErrorMessage(brokersQuery.error)}</Text>
            <TouchableOpacity style={styles.retryBtn} activeOpacity={0.7} onPress={() => brokersQuery.refetch()}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : brokers.length === 0 ? (
          <View style={styles.stateWrap}>
            <BriefcaseIcon color={c.mutedForeground} />
            <Text style={styles.stateText}>
              No brokers are available right now. Please check back later.
            </Text>
          </View>
        ) : (
          brokers.map((broker) => {
            const isCurrent = broker.id === currentBrokerId;
            const isSubmitting = submittingId === broker.id;
            return (
              <TouchableOpacity
                key={broker.id}
                style={[styles.brokerCard, isCurrent && styles.brokerCardActive]}
                activeOpacity={0.7}
                onPress={() => handleTapBroker(broker)}
                disabled={!!submittingId}
              >
                <View style={styles.logoWrap}>
                  {broker.logoUrl ? (
                    <Image source={{ uri: broker.logoUrl }} style={styles.logo} resizeMode="contain" />
                  ) : (
                    <BriefcaseIcon color={c.primary} />
                  )}
                </View>
                <View style={styles.brokerInfo}>
                  <View style={styles.brokerNameRow}>
                    <Text style={styles.brokerName} numberOfLines={1}>{broker.name}</Text>
                    <View style={styles.codeBadge}>
                      <Text style={styles.codeBadgeText}>{broker.code}</Text>
                    </View>
                  </View>
                  {!!broker.description && (
                    <Text style={styles.brokerDesc} numberOfLines={2}>{broker.description}</Text>
                  )}
                </View>
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={c.primary} />
                ) : isCurrent ? (
                  <CheckIcon />
                ) : (
                  <View style={styles.uncheckCircle} />
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

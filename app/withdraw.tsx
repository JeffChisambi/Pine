import { guardedBack } from "@/utils/navigation";
import React, { useRef, useState } from "react";
import { useColors } from "@/hooks/useColors";
import {
  Alert,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Circle } from "react-native-svg";
import { useQueryClient } from "@tanstack/react-query";
import PinVerifyModal from "@/components/PinVerifyModal";
import { walletApi } from "../services/api";
import { invalidateWalletBalance, useWalletBalance } from "../services/wallet-queries";

const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";
const GREEN = "#45B369";

const QUICK_AMOUNTS = ["10,000", "25,000", "50,000", "100,000"];

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19l-7-7 7-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Circle cx={9} cy={9} r={9} fill={GREEN} />
      <Path d="M5.5 9l2.5 2.5L12.5 6" stroke={WHITE} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InfoIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Circle cx={7} cy={7} r={6.25} stroke={MUTED} strokeWidth={1.2} />
      <Path d="M7 6.5v3.5" stroke={MUTED} strokeWidth={1.2} strokeLinecap="round" />
      <Circle cx={7} cy={4.5} r={0.75} fill={MUTED} />
    </Svg>
  );
}

function ClockIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke={MUTED} strokeWidth={1.8} />
      <Path d="M12 7v5l3 3" stroke={MUTED} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function WithdrawScreen() {
  const insets = useSafeAreaInsets();
  const topPad    = Platform.OS === "web" ? 44 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 12);
  const c = useColors();

  const [rawAmount, setRawAmount] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const qc = useQueryClient();
  // One idempotency key per screen visit so a retried submit can't double-debit.
  const idemKeyRef = useRef(`withdraw-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);

  const { data: balanceData } = useWalletBalance();
  const walletBalance = Number(balanceData?.availableBalance ?? balanceData?.balance ?? 0);
  const walletBalanceDisplay = walletBalance.toLocaleString("en-MW", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const numericValue = parseFloat(rawAmount.replace(/,/g, "")) || 0;
  const exceeds      = numericValue > walletBalance;
  const canWithdraw  = numericValue >= 10000 && !exceeds && !submitting;

  const submitWithdrawal = async (pinToken: string) => {
    setShowPin(false);
    setSubmitting(true);
    try {
      await walletApi.withdraw({
        amount: numericValue,
        pinToken,
        idempotencyKey: idemKeyRef.current,
      });
      await invalidateWalletBalance(qc).catch(() => {});
      Alert.alert(
        "Withdrawal requested",
        `MK ${numericValue.toLocaleString()} has been requested and is held from your available balance. ` +
        `Your broker will review it, and the funds reach your registered bank account within 1–2 business days of approval.`,
        [{ text: "OK", onPress: () => guardedBack("/(tabs)") }],
      );
    } catch (e: any) {
      const code = e?.code ?? e?.error?.code;
      if (code === "AUTH_PIN_INVALID" || code === "AUTH_PIN_NOT_SET") {
        setShowPin(true);
      } else {
        const { getErrorMessage } = require("../services/api");
        Alert.alert("Withdrawal Unsuccessful", getErrorMessage(e));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },

    header: {
      backgroundColor: c.background,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 0,
    },
    backBtn: { width: 40, height: 40, justifyContent: "center" },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontFamily: "PlusJakartaSans_700Bold",
      fontSize: 18,
      color: c.text,
    },

    amountBand: {
      backgroundColor: c.background,
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 32,
      alignItems: "center",
    },
    balanceLabel: {
      fontFamily: "PlusJakartaSans_400Regular",
      fontSize: 12,
      color: c.mutedForeground,
      marginBottom: 2,
    },
    balanceValue: {
      fontFamily: "PlusJakartaSans_700Bold",
      fontSize: 15,
      color: c.text,
      marginBottom: 18,
    },
    amountLabel: {
      fontFamily: "PlusJakartaSans_400Regular",
      fontSize: 13,
      color: c.mutedForeground,
      marginBottom: 12,
      letterSpacing: 0.4,
    },
    amountRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
    currencySymbol: {
      fontFamily: "PlusJakartaSans_600SemiBold",
      fontSize: 22,
      color: c.mutedForeground,
    },
    amountInput: {
      fontFamily: "PlusJakartaSans_700Bold",
      fontSize: 48,
      color: c.text,
      minWidth: 120,
      textAlign: "center",
      padding: 0,
    },
    amountDivider: {
      width: 200,
      height: 1.5,
      backgroundColor: c.border,
      marginTop: 12,
      marginBottom: 10,
    },
    amountHint: {
      fontFamily: "PlusJakartaSans_400Regular",
      fontSize: 12,
      color: c.mutedForeground,
    },
    amountError: {
      fontFamily: "PlusJakartaSans_500Medium",
      fontSize: 12,
      color: "#FF6B6B",
    },

    body: {
      flex: 1,
      backgroundColor: c.background,
      paddingTop: 0,
      paddingHorizontal: 24,
    },

    quickRow: { flexDirection: "row", gap: 10, marginBottom: 28 },
    quickBtn: {
      flex: 1,
      height: 40,
      borderRadius: 10,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    quickBtnActive: { backgroundColor: c.primary, borderColor: c.primary },
    quickBtnText: {
      fontFamily: "PlusJakartaSans_600SemiBold",
      fontSize: 13,
      color: c.text,
    },
    quickBtnTextActive: { color: WHITE },

    sectionLabel: {
      fontFamily: "PlusJakartaSans_600SemiBold",
      fontSize: 14,
      color: c.text,
      marginBottom: 12,
    },

    methodCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: c.border,
      padding: 14,
      gap: 14,
    },
    methodCardActive: { borderColor: c.primary },
    methodLogoWrap: {
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
    methodInfo: { flex: 1 },
    methodName: {
      fontFamily: "PlusJakartaSans_600SemiBold",
      fontSize: 15,
      color: c.text,
    },
    methodMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
    methodMetaText: {
      fontFamily: "PlusJakartaSans_400Regular",
      fontSize: 12,
      color: c.mutedForeground,
    },

    noteRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 20 },
    noteText: {
      flex: 1,
      fontFamily: "PlusJakartaSans_400Regular",
      fontSize: 12,
      color: c.mutedForeground,
      lineHeight: 18,
    },

    summaryCard: {
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
    },
    summaryLabel: {
      fontFamily: "PlusJakartaSans_400Regular",
      fontSize: 13,
      color: c.mutedForeground,
      flex: 1,
    },
    summaryValue: {
      fontFamily: "PlusJakartaSans_600SemiBold",
      fontSize: 13,
      color: c.text,
      flexShrink: 0,
    },
    summaryDivider: { height: 1, backgroundColor: c.border, marginVertical: 12 },

    ctaWrap: {
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 24,
      backgroundColor: c.background,
    },
    ctaBtn: {
      height: 56,
      backgroundColor: c.primary,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    ctaBtnDisabled: { opacity: 0.45 },
    ctaBtnText: {
      fontFamily: "PlusJakartaSans_600SemiBold",
      fontSize: 17,
      color: WHITE,
    },
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[styles.root, { paddingBottom: bottomPad }]}>

        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: topPad }]}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => guardedBack("/(tabs)")}>
            <BackIcon color={c.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Withdraw</Text>
          <View style={styles.backBtn} />
        </View>

        {/* ── Amount band ── */}
        <View style={styles.amountBand}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceValue}>MK {walletBalanceDisplay}</Text>

          <Text style={styles.amountLabel}>Enter Amount</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencySymbol}>MK</Text>
            <TextInput
              style={[styles.amountInput, exceeds && { color: "#FF6B6B" }]}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={MUTED}
              value={rawAmount}
              onChangeText={setRawAmount}
              returnKeyType="done"
            />
          </View>
          <View style={styles.amountDivider} />
          {exceeds ? (
            <Text style={styles.amountError}>Amount exceeds available balance</Text>
          ) : (
            <Text style={styles.amountHint}>Minimum withdrawal: MK 10,000</Text>
          )}
        </View>

        {/* ── Body ── */}
        <View style={styles.body}>

          {/* Quick amounts */}
          <View style={styles.quickRow}>
            {QUICK_AMOUNTS.map((a) => {
              const isActive = rawAmount === a;
              return (
                <TouchableOpacity
                  key={a}
                  style={[styles.quickBtn, isActive && styles.quickBtnActive]}
                  activeOpacity={0.7}
                  onPress={() => setRawAmount(a)}
                >
                  <Text style={[styles.quickBtnText, isActive && styles.quickBtnTextActive]}>
                    K{a}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Withdrawal method */}
          <Text style={styles.sectionLabel}>Withdrawal Method</Text>
          <View style={[styles.methodCard, styles.methodCardActive]}>
            <View style={styles.methodLogoWrap}>
              <View style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: c.primary + "18", alignItems: "center", justifyContent: "center" }}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path d="M3 8V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2M3 8v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8M3 8h18" stroke={c.primary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                  <Path d="M7 15h4" stroke={c.primary} strokeWidth={1.8} strokeLinecap="round" />
                </Svg>
              </View>
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>Bank Transfer</Text>
              <View style={styles.methodMeta}>
                <ClockIcon />
                <Text style={styles.methodMetaText}>1–2 business days</Text>
              </View>
            </View>
            <CheckIcon />
          </View>

          {/* Info note */}
          <View style={[styles.noteRow, { marginTop: 20 }]}>
            <InfoIcon />
            <Text style={styles.noteText}>
              Withdrawals are sent directly to your registered bank account. Please ensure your bank details are up to date in your profile.
            </Text>
          </View>

          {/* Summary */}
          {canWithdraw && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Withdraw amount</Text>
                <Text style={styles.summaryValue} numberOfLines={1}>MK {rawAmount}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: c.text, fontFamily: "PlusJakartaSans_600SemiBold" }]}>
                  You receive
                </Text>
                <Text style={[styles.summaryValue, { color: c.primary, fontFamily: "PlusJakartaSans_700Bold" }]} numberOfLines={1}>
                  MK {numericValue.toLocaleString()}
                </Text>
              </View>
            </View>
          )}

        </View>

        {/* ── CTA ── */}
        <View style={[styles.ctaWrap, { paddingBottom: bottomPad > 0 ? 0 : 24 }]}>
          <TouchableOpacity
            style={[styles.ctaBtn, !canWithdraw && styles.ctaBtnDisabled]}
            activeOpacity={0.85}
            disabled={!canWithdraw}
            onPress={() => setShowPin(true)}
          >
            <Text style={styles.ctaBtnText}>
              {submitting ? "Processing…" : canWithdraw ? `Withdraw MK ${rawAmount}` : "Withdraw"}
            </Text>
          </TouchableOpacity>
        </View>

        <PinVerifyModal
          visible={showPin}
          title="Confirm withdrawal"
          subtitle={`Enter your 4-digit PIN to withdraw MK ${numericValue.toLocaleString()}`}
          onVerified={submitWithdrawal}
          onCancel={() => setShowPin(false)}
        />

      </View>
    </TouchableWithoutFeedback>
  );
}

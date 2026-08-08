import { guardedBack, guardedPush } from "@/utils/navigation";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { useColors } from "@/hooks/useColors";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Circle } from "react-native-svg";
import { savedCardsApi } from "../services/api";

type SavedCard = {
  id: string;
  last4: string;
  cardBrand: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
};

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

function BankCardIcon({ color = "#6366F1" }: { color?: string }) {
  return (
    <View style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: color + "18", alignItems: "center", justifyContent: "center" }}>
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path d="M3 8V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2M3 8v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8M3 8h18" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M7 15h4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

export default function DepositScreen() {
  const insets = useSafeAreaInsets();
  const topPad    = Platform.OS === "web" ? 44 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 12);
  const c = useColors();

  const [rawAmount, setRawAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("bankcard");
  const [loading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  useEffect(() => {
    savedCardsApi.list().then((cards) => {
      setSavedCards(cards);
      const def = cards.find((c) => c.isDefault);
      if (def) setSelectedCardId(def.id);
    }).catch(() => {});
  }, []);

  const numericValue = parseFloat(rawAmount.replace(/,/g, "")) || 0;
  const canDeposit   = numericValue >= 10000 && !loading;

  const handleQuick = (label: string) => {
    setRawAmount(label);
    setErrorMsg("");
  };

  const handleDeposit = () => {
    if (!canDeposit) return;
    const card = savedCards.find((c) => c.id === selectedCardId);
    guardedPush(() => router.push({
      pathname: "/payment-card" as any,
      params: {
        amount: String(numericValue),
        currency: "MWK",
        purpose: "wallet_deposit",
        ...(card ? {
          savedCardId: card.id,
          last4: card.last4,
          cardBrand: card.cardBrand,
          cardholderName: card.cardholderName,
          expiryMonth: card.expiryMonth,
          expiryYear: card.expiryYear,
        } : {}),
      },
    }));
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

    /* Amount band */
    amountBand: {
      backgroundColor: c.background,
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 32,
      alignItems: "center",
    },
    amountLabel: {
      fontFamily: "PlusJakartaSans_400Regular",
      fontSize: 13,
      color: c.mutedForeground,
      marginBottom: 12,
      letterSpacing: 0.4,
    },
    amountRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 8,
    },
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

    /* Body */
    body: {
      flex: 1,
      backgroundColor: c.background,
    },
    bodyContent: {
      paddingHorizontal: 24,
      paddingBottom: 24,
    },

    /* Quick amounts */
    quickRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 28,
    },
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
    quickBtnActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    quickBtnText: {
      fontFamily: "PlusJakartaSans_600SemiBold",
      fontSize: 13,
      color: c.text,
    },
    quickBtnTextActive: {
      color: WHITE,
    },

    /* Section label */
    sectionLabel: {
      fontFamily: "PlusJakartaSans_600SemiBold",
      fontSize: 14,
      color: c.text,
      marginBottom: 12,
    },

    /* Payment method card */
    methodCard: {
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
    methodCardActive: {
      borderColor: c.primary,
    },
    uncheckCircle: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1.5,
      borderColor: c.mutedForeground,
    },
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
    methodLogo: {
      width: 44,
      height: 44,
    },
    methodInfo: {
      flex: 1,
    },
    methodName: {
      fontFamily: "PlusJakartaSans_600SemiBold",
      fontSize: 15,
      color: c.text,
    },
    methodSub: {
      fontFamily: "PlusJakartaSans_400Regular",
      fontSize: 12,
      color: c.mutedForeground,
      marginTop: 2,
    },

    /* Info note */
    noteRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      marginBottom: 20,
    },
    noteText: {
      flex: 1,
      fontFamily: "PlusJakartaSans_400Regular",
      fontSize: 12,
      color: c.mutedForeground,
      lineHeight: 18,
    },

    /* Summary */
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
    summaryDivider: {
      height: 1,
      backgroundColor: c.border,
      marginVertical: 12,
    },

    /* CTA */
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
    ctaBtnDisabled: {
      opacity: 0.45,
    },
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
          <Text style={styles.headerTitle}>Deposit</Text>
          <View style={styles.backBtn} />
        </View>

        {/* ── Amount entry ── */}
        <View style={styles.amountBand}>
          <Text style={styles.amountLabel}>Enter Amount</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencySymbol}>MK</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={MUTED}
              value={rawAmount}
              onChangeText={(val) => setRawAmount(val.replace(/[^0-9,]/g, ""))}
              returnKeyType="done"
            />
          </View>
          <View style={styles.amountDivider} />
          <Text style={styles.amountHint}>Minimum deposit: MK 10,000</Text>
        </View>

        {/* ── Body ── */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Quick amounts */}
          <View style={styles.quickRow}>
            {QUICK_AMOUNTS.map((a) => {
              const isActive = rawAmount === a;
              return (
                <TouchableOpacity
                  key={a}
                  style={[styles.quickBtn, isActive && styles.quickBtnActive]}
                  activeOpacity={0.7}
                  onPress={() => handleQuick(a)}
                >
                  <Text style={[styles.quickBtnText, isActive && styles.quickBtnTextActive]}>
                    K{a}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Section label */}
          <Text style={styles.sectionLabel}>Payment Method</Text>

          {/* Saved cards */}
          {savedCards.map((card) => {
            const isActive = selectedCardId === card.id;
            return (
              <TouchableOpacity
                key={card.id}
                style={[styles.methodCard, isActive && styles.methodCardActive]}
                activeOpacity={0.7}
                onPress={() => { setSelectedCardId(card.id); setSelectedMethod("saved"); }}
              >
                <View style={styles.methodLogoWrap}>
                  <BankCardIcon color={c.primary} />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodName}>
                    {card.cardBrand} ••••{card.last4}
                  </Text>
                  <Text style={styles.methodSub}>
                    {card.cardholderName} · {card.expiryMonth}/{card.expiryYear}
                  </Text>
                </View>
                {isActive && selectedMethod === "saved" ? <CheckIcon /> : <View style={styles.uncheckCircle} />}
              </TouchableOpacity>
            );
          })}

          {/* Use different card */}
          <TouchableOpacity
            style={[styles.methodCard, selectedMethod === "bankcard" && styles.methodCardActive]}
            activeOpacity={0.7}
            onPress={() => { setSelectedCardId(null); setSelectedMethod("bankcard"); }}
          >
            <View style={styles.methodLogoWrap}>
              <BankCardIcon color={c.primary} />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>{savedCards.length > 0 ? "Use Different Card" : "Bank Card"}</Text>
              <Text style={styles.methodSub}>Visa &amp; Mastercard</Text>
            </View>
            {selectedMethod === "bankcard" ? <CheckIcon /> : <View style={styles.uncheckCircle} />}
          </TouchableOpacity>

          {/* Info note */}
          <View style={styles.noteRow}>
            <InfoIcon />
            <Text style={styles.noteText}>
              {selectedMethod === "saved"
                ? "You'll only need to enter your CVV to complete the deposit."
                : "You'll be able to securely enter your card details to process the deposit."}
            </Text>
          </View>

          {/* Summary */}
          {canDeposit && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Deposit amount</Text>
                <Text style={styles.summaryValue} numberOfLines={1}>MK {rawAmount}</Text>
              </View>
              <View style={[styles.summaryRow, { marginTop: 8 }]}>
                <Text style={styles.summaryLabel}>Processing fee</Text>
                <Text style={[styles.summaryValue, { color: GREEN }]}>Free</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: c.text, fontFamily: "PlusJakartaSans_600SemiBold" }]}>
                  You receive
                </Text>
                <Text style={[styles.summaryValue, { color: c.primary, fontFamily: "PlusJakartaSans_700Bold" }]} numberOfLines={1}>
                  MK {rawAmount}
                </Text>
              </View>
            </View>
          )}

        </ScrollView>

        {/* ── Error ── */}
        {errorMsg ? (
          <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
            <Text style={{ color: "#EF4444", fontSize: 13, fontFamily: "PlusJakartaSans_400Regular" }}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* ── CTA ── */}
        <View style={[styles.ctaWrap, { paddingBottom: bottomPad > 0 ? 0 : 24 }]}>
          <TouchableOpacity
            style={[styles.ctaBtn, !canDeposit && styles.ctaBtnDisabled]}
            activeOpacity={0.85}
            disabled={!canDeposit}
            onPress={handleDeposit}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.ctaBtnText}>
                {canDeposit ? `Deposit MK ${rawAmount}` : "Deposit"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

      </View>
    </TouchableWithoutFeedback>
  );
}

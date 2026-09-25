/**
 * Practice deposit.
 *
 * Play money, credited the moment the investor confirms — there is no card
 * or bank step. Each account may deposit at most MWK 500,000 in any rolling
 * year; the allowance meter shows how much of that is used and when the
 * oldest deposit rolls off. The server enforces the cap, so a request over
 * it comes back with the reason and nothing is credited.
 */
import { guardedBack } from "@/utils/navigation";
import { router } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { useColors } from "@/hooks/useColors";
import {
  ActivityIndicator,
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
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useQueryClient } from "@tanstack/react-query";
import { walletApi, getErrorMessage, type VirtualAllowance } from "../services/api";
import { WALLET_BALANCE_QUERY_KEY, WALLET_HISTORY_QUERY_KEY } from "../services/wallet-queries";
import { PRACTICE_DEPOSIT_CAP } from "@/constants/practice";

const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";
const GREEN = "#45B369";
const AMBER = "#D97706";

const QUICK_AMOUNTS = [10_000, 50_000, 100_000, 250_000];
/** Smallest deposit the server accepts. */
const MIN_DEPOSIT = 1000;

const fmtMK = (n: number) => `MK ${Math.round(n).toLocaleString("en-MW")}`;

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19l-7-7 7-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function newKey() {
  return `practice-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function PracticeDepositScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top;
  const bottomPad = Math.max(insets.bottom, 16);
  const qc = useQueryClient();

  const [raw, setRaw] = useState("");
  const [allowance, setAllowance] = useState<VirtualAllowance | null>(null);
  const [loadingAllowance, setLoadingAllowance] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<number | null>(null);
  // One key per attempt: a retried tap after a timeout must not credit twice.
  const keyRef = useRef(newKey());

  const loadAllowance = useCallback(async () => {
    setLoadingAllowance(true);
    try {
      setAllowance(await walletApi.getVirtualAllowance());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingAllowance(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { loadAllowance(); }, [loadAllowance]));

  const amount = Number(raw.replace(/[^0-9]/g, "")) || 0;
  const cap = allowance?.cap ?? PRACTICE_DEPOSIT_CAP;
  const used = allowance?.used ?? 0;
  const remaining = allowance?.remaining ?? cap;
  const overAllowance = amount > remaining;
  const underMinimum = amount > 0 && amount < MIN_DEPOSIT;
  const canSubmit = amount >= MIN_DEPOSIT && !overAllowance && !submitting && !loadingAllowance;

  const usedPct = Math.min(1, used / cap);
  const pendingPct = Math.min(1 - usedPct, Math.min(amount, remaining) / cap);

  const releaseDate = useMemo(() => {
    if (!allowance?.nextReleaseAt) return null;
    return new Date(allowance.nextReleaseAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }, [allowance?.nextReleaseAt]);

  const onChange = (t: string) => {
    const digits = t.replace(/[^0-9]/g, "").slice(0, 9);
    setRaw(digits ? Number(digits).toLocaleString("en-MW") : "");
    setError("");
  };

  const submit = async () => {
    if (!canSubmit) return;
    Keyboard.dismiss();
    setSubmitting(true);
    setError("");
    try {
      const res = await walletApi.depositPractice(amount, keyRef.current);
      setAllowance(res.allowance);
      setDone(amount);
      setRaw("");
      keyRef.current = newKey();
      qc.invalidateQueries({ queryKey: WALLET_BALANCE_QUERY_KEY });
      qc.invalidateQueries({ queryKey: WALLET_HISTORY_QUERY_KEY });
    } catch (err) {
      setError(getErrorMessage(err));
      // The server said no; the next attempt is a new request.
      keyRef.current = newKey();
      loadAllowance();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1, backgroundColor: c.background }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <TouchableOpacity onPress={() => guardedBack("/(tabs)")} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
            <BackIcon color={c.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: c.text }]}>Add practice money</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomPad + 24 }} keyboardShouldPersistTaps="handled">
          {/* Allowance */}
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.rowBetween}>
              <Text style={[styles.cardLabel, { color: c.mutedForeground }]}>YOUR YEARLY ALLOWANCE</Text>
              {loadingAllowance && <ActivityIndicator size="small" color={GREEN} />}
            </View>
            <Text style={[styles.allowanceBig, { color: c.text }]}>
              {fmtMK(remaining)} <Text style={[styles.allowanceOf, { color: c.mutedForeground }]}>left of {fmtMK(cap)}</Text>
            </Text>
            <View style={[styles.meter, { backgroundColor: c.secondary }]}>
              <View style={{ width: `${usedPct * 100}%`, backgroundColor: GREEN }} />
              <View style={{ width: `${pendingPct * 100}%`, backgroundColor: `${GREEN}66` }} />
            </View>
            <Text style={[styles.meterNote, { color: c.mutedForeground }]}>
              {used > 0 ? `${fmtMK(used)} deposited in the last ${allowance?.windowDays ?? 365} days.` : "You haven't deposited yet."}
              {releaseDate && remaining < cap ? ` Your earliest deposit frees up on ${releaseDate}.` : ""}
            </Text>
          </View>

          {/* Amount */}
          <Text style={[styles.sectionLabel, { color: c.text }]}>Amount</Text>
          <View style={[styles.amountBox, { borderColor: overAllowance || underMinimum ? "#EF4444" : c.border, backgroundColor: c.card }]}>
            <Text style={[styles.currency, { color: c.mutedForeground }]}>MK</Text>
            <TextInput
              value={raw}
              onChangeText={onChange}
              placeholder="0"
              placeholderTextColor={MUTED}
              keyboardType="number-pad"
              style={[styles.amountInput, { color: c.text }]}
              returnKeyType="done"
              onSubmitEditing={submit}
            />
          </View>
          {overAllowance ? (
            <Text style={styles.warn}>That's more than your remaining allowance of {fmtMK(remaining)}.</Text>
          ) : underMinimum ? (
            <Text style={styles.warn}>The smallest deposit is {fmtMK(MIN_DEPOSIT)}.</Text>
          ) : null}

          <View style={styles.quickRow}>
            {QUICK_AMOUNTS.map((q) => {
              const disabled = q > remaining;
              return (
                <TouchableOpacity
                  key={q}
                  disabled={disabled}
                  onPress={() => onChange(String(q))}
                  style={[styles.quick, { borderColor: c.border, backgroundColor: c.card, opacity: disabled ? 0.4 : 1 }]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.quickText, { color: c.text }]}>{q >= 1000 ? `${q / 1000}K` : q}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              disabled={remaining < MIN_DEPOSIT}
              onPress={() => onChange(String(remaining))}
              style={[styles.quick, { borderColor: GREEN, backgroundColor: `${GREEN}14`, opacity: remaining < MIN_DEPOSIT ? 0.4 : 1 }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.quickText, { color: GREEN }]}>Max</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.note, { backgroundColor: `${AMBER}12` }]}>
            <Text style={[styles.noteText, { color: c.text }]}>
              This is practice money. It is added instantly, cannot be withdrawn, and is only for learning how trading works.
            </Text>
          </View>

          {error ? <Text style={[styles.warn, { marginTop: 12 }]}>{error}</Text> : null}
          {done != null && !error ? (
            <View style={[styles.success, { backgroundColor: `${GREEN}14` }]}>
              <Text style={[styles.successText, { color: c.text }]}>{fmtMK(done)} added to your practice balance.</Text>
              <TouchableOpacity onPress={() => router.replace("/(tabs)" as any)}>
                <Text style={{ color: GREEN, fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14 }}>Start trading</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>

        <View style={{ paddingHorizontal: 20, paddingBottom: bottomPad, paddingTop: 8 }}>
          <TouchableOpacity
            onPress={submit}
            disabled={!canSubmit}
            activeOpacity={0.85}
            style={[styles.cta, { backgroundColor: c.primary, opacity: canSubmit ? 1 : 0.45 }]}
            accessibilityRole="button"
          >
            {submitting ? (
              <ActivityIndicator color={WHITE} />
            ) : (
              <Text style={styles.ctaText}>{amount >= MIN_DEPOSIT ? `Add ${fmtMK(amount)}` : "Add money"}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 17 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10, marginTop: 4 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardLabel: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 11, letterSpacing: 0.8 },
  allowanceBig: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 24 },
  allowanceOf: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 14 },
  meter: { height: 8, borderRadius: 4, overflow: "hidden", flexDirection: "row" },
  meterNote: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, lineHeight: 18 },
  sectionLabel: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, marginTop: 24, marginBottom: 8 },
  amountBox: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, height: 64 },
  currency: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 18, marginRight: 8 },
  amountInput: { flex: 1, fontFamily: "PlusJakartaSans_700Bold", fontSize: 26 },
  warn: { color: "#EF4444", fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, marginTop: 8 },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  quick: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 },
  quickText: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13 },
  note: { borderRadius: 12, padding: 14, marginTop: 20 },
  noteText: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, lineHeight: 19 },
  success: { borderRadius: 12, padding: 14, marginTop: 16, gap: 8 },
  successText: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14 },
  cta: { height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  ctaText: { color: WHITE, fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 16 },
});

import { router } from "expo-router";
import React, { useState } from "react";
import {
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
import Svg, { Path, Circle, Rect } from "react-native-svg";

const TEAL      = "#164951";
const WHITE     = "#FFFFFF";
const DARK      = "#111827";
const MUTED     = "#9CA3AF";
const BG        = "#F9FAFB";
const DIVIDER   = "#EBECEF";
const GREEN     = "#45B369";
const RED       = "#EF4770";

const QUICK_AMOUNTS = ["500", "1,000", "2,500", "5,000"];

const METHODS = [
  {
    id: "bank",
    name: "Bank Transfer",
    sub: "Direct bank account transfer",
    fee: "MK 200",
    time: "1–2 business days",
    color: TEAL,
    letter: "B",
  },
];

function BackIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M5 12l7-7M5 12l7 7" stroke={WHITE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
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

function BankCardIcon() {
  return (
    <Svg width={42} height={42} viewBox="0 0 24 24" fill="none">
      <Rect x={2} y={5} width={20} height={14} rx={3} fill={TEAL} />
      <Path d="M2 10h20" stroke={WHITE} strokeWidth={1.5} strokeOpacity={0.2} />
      <Rect x={5} y={13.5} width={4} height={2.5} rx={1} fill={GREEN} />
      <Circle cx={17} cy={14.5} r={2.5} fill={WHITE} fillOpacity={0.5} />
      <Circle cx={15} cy={14.5} r={2.5} fill={WHITE} fillOpacity={0.8} />
    </Svg>
  );
}

function MethodLogo({ color, letter }: { color: string; letter: string }) {
  return (
    <View style={[styles.methodLogoWrap, { backgroundColor: "#EFF6F8" }]}>
      <BankCardIcon />
    </View>
  );
}

export default function WithdrawScreen() {
  const insets = useSafeAreaInsets();
  const topPad    = Platform.OS === "web" ? 44 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 12);

  const [rawAmount, setRawAmount] = useState("");
  const selectedMethod = "bank";
  const activeMethod = METHODS[0];

  // API state — from GET /wallet/balance
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const walletBalanceDisplay = walletBalance.toLocaleString("en-MW", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const numericValue = parseFloat(rawAmount.replace(/,/g, "")) || 0;
  const exceeds      = numericValue > walletBalance;
  const canWithdraw  = numericValue >= 100 && !exceeds;


  const fee = activeMethod.fee === "Free" ? 0 : 200;
  const youReceive = numericValue > fee ? numericValue - fee : 0;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[styles.root, { paddingBottom: bottomPad }]}>

        {/* ── Teal header ── */}
        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => router.back()}>
            <BackIcon />
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
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={rawAmount}
              onChangeText={setRawAmount}
              returnKeyType="done"
            />
          </View>
          <View style={styles.amountDivider} />
          {exceeds ? (
            <Text style={styles.amountError}>Amount exceeds available balance</Text>
          ) : (
            <Text style={styles.amountHint}>Minimum withdrawal: MK 100</Text>
          )}
        </View>

        {/* ── White body ── */}
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
            <MethodLogo color={TEAL} letter="B" />
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>Bank Transfer</Text>
              <View style={styles.methodMeta}>
                <ClockIcon />
                <Text style={styles.methodMetaText}>1–2 business days</Text>
                <Text style={styles.methodFee}>· Fee: MK 200</Text>
              </View>
            </View>
            <CheckIcon />
          </View>

          {/* Info note */}
          <View style={styles.noteRow}>
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
                <Text style={styles.summaryValue}>MK {rawAmount}</Text>
              </View>
              <View style={[styles.summaryRow, { marginTop: 8 }]}>
                <Text style={styles.summaryLabel}>Processing fee</Text>
                <Text style={[styles.summaryValue, { color: fee === 0 ? GREEN : DARK }]}>
                  {activeMethod.fee}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: DARK, fontFamily: "Poppins_600SemiBold" }]}>You receive</Text>
                <Text style={[styles.summaryValue, { color: TEAL, fontFamily: "Poppins_700Bold" }]}>
                  MK {youReceive.toLocaleString()}
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
            onPress={() => router.back()}
          >
            <Text style={styles.ctaBtnText}>
              {canWithdraw ? `Withdraw MK ${rawAmount}` : "Withdraw"}
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },

  header: {
    backgroundColor: TEAL,
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
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: WHITE,
  },

  amountBand: {
    backgroundColor: TEAL,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: "center",
  },
  balanceLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    marginBottom: 2,
  },
  balanceValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 18,
  },
  amountLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    marginBottom: 12,
    letterSpacing: 0.4,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  currencySymbol: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 22,
    color: "rgba(255,255,255,0.7)",
  },
  amountInput: {
    fontFamily: "Poppins_700Bold",
    fontSize: 48,
    color: WHITE,
    minWidth: 120,
    textAlign: "center",
    padding: 0,
  },
  amountDivider: {
    width: 200,
    height: 1.5,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginTop: 12,
    marginBottom: 10,
  },
  amountHint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },
  amountError: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "#FF6B6B",
  },

  body: {
    flex: 1,
    backgroundColor: WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingTop: 24,
    paddingHorizontal: 24,
  },

  quickRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
  },
  quickBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: DIVIDER,
    alignItems: "center",
    justifyContent: "center",
  },
  quickBtnActive: {
    backgroundColor: TEAL,
    borderColor: TEAL,
  },
  quickBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: DARK,
  },
  quickBtnTextActive: {
    color: WHITE,
  },

  sectionLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: DARK,
    marginBottom: 12,
  },

  methodList: {
    gap: 10,
    marginBottom: 16,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BG,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: DIVIDER,
    padding: 14,
    gap: 14,
  },
  methodCardActive: {
    borderColor: TEAL,
  },
  methodLogoWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  methodLogoLetter: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: WHITE,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: DARK,
  },
  methodMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  methodMetaText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: MUTED,
  },
  methodFee: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: RED,
  },
  methodFeeFree: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: GREEN,
  },

  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 20,
  },
  noteText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: MUTED,
    lineHeight: 18,
  },

  summaryCard: {
    backgroundColor: BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: DIVIDER,
    padding: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: MUTED,
  },
  summaryValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: DARK,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: DIVIDER,
    marginVertical: 12,
  },

  ctaWrap: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: WHITE,
  },
  ctaBtn: {
    height: 56,
    backgroundColor: TEAL,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaBtnDisabled: {
    opacity: 0.45,
  },
  ctaBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 17,
    color: WHITE,
  },
});

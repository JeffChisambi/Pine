/**
 * payment-card.tsx
 *
 * Bank Card payment entry screen.
 * Displays a live animated card preview that flips when the user focuses CVV.
 * On submit → calls POST /payments/card/initiate (skeleton — 501 until wired up).
 *
 * Route params:
 *   amount   — numeric amount (string)
 *   currency — 'MWK' | 'USD'
 *   purpose  — optional payment purpose tag
 */
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Circle, Path, Rect, G, Defs, LinearGradient, Stop } from "react-native-svg";
import { guardedBack } from "@/utils/navigation";
import { useColors } from "@/hooks/useColors";
import { cardPaymentsApi } from "../services/api";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const TEAL    = "#164951";
const TEAL_LT = "#1D5C68";
const WHITE   = "#FFFFFF";
const DARK    = "#111827";
const MUTED   = "#9CA3AF";
const BG      = "#F9FAFB";
const DIVIDER = "#EBECEF";
const ERROR   = "#EF4444";
const GREEN   = "#45B369";

// ─── SVG Icons ─────────────────────────────────────────────────────────────────

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19l-7-7 7-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={11} width={18} height={11} rx={2} stroke={GREEN} strokeWidth={2} />
      <Path d="M7 11V7a5 5 0 0110 0v4" stroke={GREEN} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function VisaIcon() {
  return (
    <Svg width={44} height={28} viewBox="0 0 44 28">
      <Rect width={44} height={28} rx={4} fill="white" fillOpacity={0.15} />
      <Path d="M18.5 19H15.7l1.74-10.7H20.2L18.5 19zm-5.63-10.7l-2.69 7.36-.32-1.6L8.9 10a1.2 1.2 0 00-1.33-.7H3.06l-.06.3c.93.2 1.97.56 2.6.93L8.3 19h3.1l4.72-10.7h-3.25zm20.7 0h-2.66c-.73 0-1.28.2-1.6.96L24.7 19h3.1l.62-1.7h3.79L32.6 19h2.74L33.57 8.3zm-3.5 6.56l1.57-4.28.9 4.28h-2.47zm-7.47-4.27c0-1.4 3.15-1.22 4.53-.46l.44-2.57C26.5 7.32 25.17 7 23.77 7c-3.27 0-5.56 1.74-5.58 4.22-.02 1.84 1.64 2.87 2.89 3.47 1.28.62 1.71 1.02 1.7 1.58-.01.85-1.02 1.24-1.96 1.24-1.32 0-2.02-.2-3.1-.68l-.43 2.66c.7.32 2 .6 3.34.61 3.49 0 5.77-1.72 5.79-4.38.01-1.65-1.24-2.79-3.48-3.7l.04.04z" fill="white" />
    </Svg>
  );
}

function MastercardIcon() {
  return (
    <Svg width={44} height={28} viewBox="0 0 44 28">
      <Rect width={44} height={28} rx={4} fill="white" fillOpacity={0.15} />
      <Circle cx={17} cy={14} r={7} fill="#EB001B" />
      <Circle cx={27} cy={14} r={7} fill="#F79E1B" />
      <Path d="M22 8.8a7 7 0 010 10.4A7 7 0 0122 8.8z" fill="#FF5F00" />
    </Svg>
  );
}

function UnknownCardIcon() {
  return (
    <Svg width={44} height={28} viewBox="0 0 44 28">
      <Rect width={44} height={28} rx={4} fill="white" fillOpacity={0.15} />
      <Rect x={6} y={10} width={32} height={4} rx={2} fill="white" fillOpacity={0.5} />
    </Svg>
  );
}

// ─── Card type detection ────────────────────────────────────────────────────────

type CardType = "visa" | "mastercard" | "unknown";

function detectCardType(num: string): CardType {
  const clean = num.replace(/\s/g, "");
  if (/^4/.test(clean)) return "visa";
  if (/^5[1-5]|^2(2[2-9]|[3-6]\d|7[01])/.test(clean)) return "mastercard";
  return "unknown";
}

function CardBrandIcon({ type }: { type: CardType }) {
  if (type === "visa") return <VisaIcon />;
  if (type === "mastercard") return <MastercardIcon />;
  return <UnknownCardIcon />;
}

// ─── Card preview ──────────────────────────────────────────────────────────────

function formatDisplayNumber(raw: string): string {
  return raw.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
}

interface CardPreviewProps {
  cardNumber: string;
  cardHolder: string;
  expiry: string;
  cvv: string;
  isCvvFocused: boolean;
  flipAnim: Animated.Value;
  cardType: CardType;
}

function CardPreview({ cardNumber, cardHolder, expiry, cvv, isCvvFocused, flipAnim, cardType }: CardPreviewProps) {
  const frontOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 0] });
  const backOpacity  = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });
  const frontRotate  = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });
  const backRotate   = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ["180deg", "360deg"] });

  const displayNum = formatDisplayNumber(cardNumber || "");
  const maskedNum  = displayNum.replace(/\d(?=.{5})/g, "•");
  const displayNum4Chars = displayNum.padEnd(19, "•").substring(0, 19);

  return (
    <View style={styles.cardPreviewWrapper}>
      {/* Front */}
      <Animated.View style={[styles.cardFace, { opacity: frontOpacity, transform: [{ rotateY: frontRotate }] }]}>
        <View style={styles.cardGradient}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardChip}>
              <Svg width={32} height={24} viewBox="0 0 32 24">
                <Rect width={32} height={24} rx={4} fill="#D4AF37" fillOpacity={0.9} />
                <Rect x={10} y={0} width={1.5} height={24} fill="#B8962E" fillOpacity={0.5} />
                <Rect x={20.5} y={0} width={1.5} height={24} fill="#B8962E" fillOpacity={0.5} />
                <Rect x={0} y={8} width={32} height={1.5} fill="#B8962E" fillOpacity={0.5} />
                <Rect x={0} y={14.5} width={32} height={1.5} fill="#B8962E" fillOpacity={0.5} />
              </Svg>
            </View>
            <CardBrandIcon type={cardType} />
          </View>

          <Text style={styles.cardNumberDisplay}>
            {displayNum4Chars || "•••• •••• •••• ••••"}
          </Text>

          <View style={styles.cardBottomRow}>
            <View>
              <Text style={styles.cardLabel}>CARD HOLDER</Text>
              <Text style={styles.cardValue} numberOfLines={1}>
                {cardHolder.toUpperCase() || "YOUR NAME"}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.cardLabel}>EXPIRES</Text>
              <Text style={styles.cardValue}>{expiry || "MM/YY"}</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Back */}
      <Animated.View style={[styles.cardFace, styles.cardBack, { opacity: backOpacity, transform: [{ rotateY: backRotate }] }]}>
        <View style={styles.cardGradient}>
          <View style={styles.magneticStripe} />
          <View style={styles.cvvStripe}>
            <View style={styles.cvvWhiteBar}>
              <Text style={styles.cvvText}>{cvv || "•••"}</Text>
            </View>
            <Text style={styles.cvvLabel}>CVV</Text>
          </View>
          <View style={styles.cardBackBottom}>
            <CardBrandIcon type={cardType} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Input field ───────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric";
  maxLength?: number;
  onFocus?: () => void;
  onBlur?: () => void;
  autoCapitalize?: "none" | "words" | "sentences" | "characters";
  secureTextEntry?: boolean;
  error?: string;
}

function Field({ label, value, onChangeText, placeholder, keyboardType = "default", maxLength, onFocus, onBlur, autoCapitalize, secureTextEntry, error }: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.fieldBox, focused && styles.fieldBoxFocused, !!error && styles.fieldBoxError]}>
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={MUTED}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize ?? "none"}
          secureTextEntry={secureTextEntry}
          onFocus={() => { setFocused(true); onFocus?.(); }}
          onBlur={() => { setFocused(false); onBlur?.(); }}
        />
      </View>
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function PaymentCardScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ amount: string; currency: string; purpose: string }>();
  const c      = useColors();

  const amount   = parseFloat(params.amount ?? "0");
  const currency = (params.currency ?? "MWK") as "MWK" | "USD";
  const purpose  = params.purpose ?? "wallet_deposit";

  // Form state
  const [cardNumber, setCardNumber]   = useState("");
  const [cardHolder, setCardHolder]   = useState("");
  const [expiry, setExpiry]           = useState("");
  const [cvv, setCvv]                 = useState("");
  const [isCvvFocused, setIsCvvFocused] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [errors, setErrors]           = useState<Record<string, string>>({});

  // Card flip animation
  const flipAnim  = useRef(new Animated.Value(0)).current;
  const cardType  = detectCardType(cardNumber);

  const flipToBack = () => {
    Animated.spring(flipAnim, { toValue: 1, useNativeDriver: true, tension: 40, friction: 8 }).start();
  };
  const flipToFront = () => {
    Animated.spring(flipAnim, { toValue: 0, useNativeDriver: true, tension: 40, friction: 8 }).start();
  };

  // Card number formatting (groups of 4)
  const handleCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    const formatted = digits.replace(/(.{4})/g, "$1 ").trim();
    setCardNumber(formatted);
    setErrors((e) => ({ ...e, cardNumber: "" }));
  };

  // Expiry formatting (MM/YY)
  const handleExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    let formatted = digits;
    if (digits.length >= 2) {
      formatted = digits.slice(0, 2) + "/" + digits.slice(2);
    }
    setExpiry(formatted);
    setErrors((e) => ({ ...e, expiry: "" }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const rawNum = cardNumber.replace(/\s/g, "");
    if (rawNum.length < 13) errs.cardNumber = "Enter a valid card number";
    if (!cardHolder.trim()) errs.cardHolder = "Enter the cardholder name";
    const [mm, yy] = expiry.split("/");
    const month = parseInt(mm, 10);
    const year  = parseInt("20" + yy, 10);
    const now   = new Date();
    if (!mm || !yy || month < 1 || month > 12 || year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
      errs.expiry = "Enter a valid expiry date";
    }
    if (cvv.length < 3) errs.cvv = "Enter a valid CVV";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePay = async () => {
    if (!validate() || loading) return;
    setLoading(true);
    try {
      const [mm, yy] = expiry.split("/");
      await cardPaymentsApi.initiateCardPayment({
        amount,
        currency,
        cardholderName: cardHolder.trim(),
        cardNumber: cardNumber.replace(/\s/g, ""),
        expiryMonth: mm,
        expiryYear: yy,
        cvv,
        purpose,
      });
      // Navigate to success screen (same as PayChangu success path)
      router.replace({
        pathname: "/trade/success" as any,
        params: { amount: String(amount), purpose },
      });
    } catch (err: any) {
      const msg = err?.message ?? "Payment failed. Please try again.";
      Alert.alert("Payment Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const topPad    = Platform.OS === "web" ? 44 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 16);
  const canPay    = cardNumber.replace(/\s/g, "").length >= 13 && cardHolder.trim().length > 0 && expiry.length === 5 && cvv.length >= 3;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: c.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => guardedBack("/deposit")}>
          <BackIcon color={WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bank Card</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomPad + 90 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Card preview */}
        <View style={styles.cardContainer}>
          <CardPreview
            cardNumber={cardNumber}
            cardHolder={cardHolder}
            expiry={expiry}
            cvv={cvv}
            isCvvFocused={isCvvFocused}
            flipAnim={flipAnim}
            cardType={cardType}
          />
        </View>

        {/* Amount banner */}
        <View style={styles.amountBanner}>
          <Text style={styles.amountBannerLabel}>Depositing</Text>
          <Text style={styles.amountBannerValue}>
            {currency === "MWK" ? "MK" : "$"} {amount.toLocaleString()}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formWrap}>
          <Field
            label="Card Number"
            value={cardNumber}
            onChangeText={handleCardNumber}
            placeholder="0000 0000 0000 0000"
            keyboardType="numeric"
            maxLength={19}
            error={errors.cardNumber}
          />

          <Field
            label="Cardholder Name"
            value={cardHolder}
            onChangeText={(v) => { setCardHolder(v); setErrors((e) => ({ ...e, cardHolder: "" })); }}
            placeholder="Name as on card"
            autoCapitalize="words"
            error={errors.cardHolder}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field
                label="Expiry Date"
                value={expiry}
                onChangeText={handleExpiry}
                placeholder="MM/YY"
                keyboardType="numeric"
                maxLength={5}
                error={errors.expiry}
              />
            </View>
            <View style={{ width: 16 }} />
            <View style={{ flex: 1 }}>
              <Field
                label="CVV"
                value={cvv}
                onChangeText={(v) => { setCvv(v.replace(/\D/g, "").slice(0, 4)); setErrors((e) => ({ ...e, cvv: "" })); }}
                placeholder="•••"
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                onFocus={() => { setIsCvvFocused(true); flipToBack(); }}
                onBlur={() => { setIsCvvFocused(false); flipToFront(); }}
                error={errors.cvv}
              />
            </View>
          </View>

          {/* Secure badge */}
          <View style={styles.secureBadge}>
            <LockIcon />
            <Text style={styles.secureBadgeText}>
              Your card details are encrypted and transmitted securely.
            </Text>
          </View>

          {/* Accepted cards note */}
          <View style={styles.acceptedRow}>
            <Text style={styles.acceptedLabel}>Accepted:</Text>
            <VisaIcon />
            <MastercardIcon />
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={[styles.ctaWrap, { paddingBottom: bottomPad > 0 ? bottomPad : 24 }]}>
        <TouchableOpacity
          style={[styles.ctaBtn, (!canPay || loading) && styles.ctaBtnDisabled]}
          activeOpacity={0.85}
          disabled={!canPay || loading}
          onPress={handlePay}
        >
          {loading ? (
            <ActivityIndicator color={WHITE} size="small" />
          ) : (
            <Text style={styles.ctaBtnText}>
              {canPay
                ? `Pay ${currency === "MWK" ? "MK" : "$"} ${amount.toLocaleString()}`
                : "Enter Card Details"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  header: {
    backgroundColor: TEAL,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 18,
    color: WHITE,
  },

  // ── Card preview ────────────────────────────────────────────────────────────
  cardContainer: {
    backgroundColor: TEAL,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  cardPreviewWrapper: {
    width: "100%",
    maxWidth: 340,
    height: 196,
  },
  cardFace: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 18,
    overflow: "hidden",
    backfaceVisibility: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  cardBack: {},
  cardGradient: {
    flex: 1,
    backgroundColor: TEAL_LT,
    borderRadius: 18,
    padding: 20,
    // subtle pattern via border
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardChip: {},
  cardNumberDisplay: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 20,
    color: WHITE,
    letterSpacing: 3,
    marginBottom: 20,
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  cardLabel: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 9,
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  cardValue: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    color: WHITE,
    maxWidth: 160,
  },

  // Back of card
  magneticStripe: {
    height: 40,
    backgroundColor: "rgba(0,0,0,0.5)",
    marginHorizontal: -20,
    marginTop: 10,
    marginBottom: 16,
  },
  cvvStripe: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 4,
  },
  cvvWhiteBar: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "flex-end",
  },
  cvvText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 16,
    color: DARK,
    letterSpacing: 4,
  },
  cvvLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  cardBackBottom: {
    position: "absolute",
    bottom: 20,
    right: 20,
  },

  // ── Amount banner ────────────────────────────────────────────────────────────
  amountBanner: {
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  amountBannerLabel: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    color: MUTED,
  },
  amountBannerValue: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 20,
    color: TEAL,
  },

  // ── Form ─────────────────────────────────────────────────────────────────────
  formWrap: {
    backgroundColor: WHITE,
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 4,
  },
  fieldWrap: { marginBottom: 18 },
  fieldLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: DARK,
    marginBottom: 8,
  },
  fieldBox: {
    borderWidth: 1.5,
    borderColor: DIVIDER,
    borderRadius: 12,
    backgroundColor: BG,
    paddingHorizontal: 14,
    height: 52,
    justifyContent: "center",
  },
  fieldBoxFocused: { borderColor: TEAL },
  fieldBoxError: { borderColor: ERROR },
  fieldInput: {
    fontFamily: "PlusJakartaSans_500Medium" as any,
    fontSize: 16,
    color: DARK,
    padding: 0,
  },
  fieldError: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: ERROR,
    marginTop: 4,
  },
  row: { flexDirection: "row" },

  // ── Secure badge ─────────────────────────────────────────────────────────────
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F0FDF4",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    padding: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  secureBadgeText: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "#166534",
    lineHeight: 18,
  },

  // ── Accepted cards ────────────────────────────────────────────────────────────
  acceptedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  acceptedLabel: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: MUTED,
  },

  // ── CTA ───────────────────────────────────────────────────────────────────────
  ctaWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: DIVIDER,
  },
  ctaBtn: {
    height: 56,
    backgroundColor: TEAL,
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

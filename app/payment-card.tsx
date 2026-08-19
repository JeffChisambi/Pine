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
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Studio-rendered card faces (Blender: designs/pine_card_faces.blend)
const CARD_FACE_FRONT = require("../assets/images/card-face-front.png");
const CARD_FACE_BACK  = require("../assets/images/card-face-back.png");
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import Svg, { Circle, Path, Rect, G, Defs, LinearGradient, Stop } from "react-native-svg";
import { guardedBack } from "@/utils/navigation";
import { useColors } from "@/hooks/useColors";
import { cardPaymentsApi, getErrorMessage } from "../services/api";
import {
  invalidateWalletBalance,
} from "../services/wallet-queries";

function makeAttemptKey(): string {
  return `app-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

// Test Transactions: always in dev builds; in release builds only while the
// pre-launch flag is baked in at build time. The backend independently blocks
// test charges unless ALLOW_TEST_TRANSACTIONS=true is set server-side.
const TEST_TX_ENABLED = __DEV__ || process.env.EXPO_PUBLIC_ENABLE_TEST_TX === "1";

// ─── Design tokens ─────────────────────────────────────────────────────────────
// WHITE/DARK below are used ONLY on the card artwork overlay (white text on
// the teal card face, dark CVV in its white window) — theme-independent by
// design. Every page surface/text color comes from useColors() so the screen
// follows light/dark mode like the rest of the app.
const WHITE   = "#FFFFFF";
const DARK    = "#111827";
const MUTED   = "#9CA3AF";
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
  const displayNum4Chars = displayNum.padEnd(19, "•").substring(0, 19);

  return (
    <View style={styles.cardPreviewWrapper}>
      {/* Front — studio-rendered face with live details overlaid */}
      <Animated.View style={[styles.cardFace, { opacity: frontOpacity, transform: [{ rotateY: frontRotate }] }]}>
        <ImageBackground source={CARD_FACE_FRONT} style={styles.cardArt} imageStyle={styles.cardArtImg} resizeMode="cover">
          <View style={styles.cardTopRow}>
            <View />
            <CardBrandIcon type={cardType} />
          </View>

          <Text style={styles.cardNumberDisplay}>
            {displayNum4Chars || "•••• •••• •••• ••••"}
          </Text>

          <View style={styles.cardBottomRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
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
        </ImageBackground>
      </Animated.View>

      {/* Back — rendered face; CVV sits in the artwork's window */}
      <Animated.View style={[styles.cardFace, styles.cardBack, { opacity: backOpacity, transform: [{ rotateY: backRotate }] }]}>
        <ImageBackground source={CARD_FACE_BACK} style={styles.cardArt} imageStyle={styles.cardArtImg} resizeMode="cover">
          <View style={styles.cvvOverlayRow}>
            <Text style={[styles.cvvText, isCvvFocused && { color: "#0F172A" }]}>{cvv || "•••"}</Text>
          </View>
          <Text style={styles.cvvLabel}>CVV</Text>
        </ImageBackground>
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
  const c = useColors();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: c.text }]}>{label}</Text>
      <View style={[styles.fieldBox, { backgroundColor: c.card, borderColor: c.border }, focused && [styles.fieldBoxFocused, { borderColor: c.primary }], !!error && styles.fieldBoxError]}>
        <TextInput
          style={[styles.fieldInput, { color: c.text }]}
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
  const params = useLocalSearchParams<{
    amount: string; currency: string; purpose: string;
    savedCardId?: string; last4?: string; cardBrand?: string;
    cardholderName?: string; expiryMonth?: string; expiryYear?: string;
  }>();
  const c      = useColors();
  const qc     = useQueryClient();

  const amount   = parseFloat(params.amount ?? "0");
  const currency = (params.currency ?? "MWK") as "MWK" | "USD";
  const purpose  = params.purpose ?? "wallet_deposit";

  const isSavedCard = !!params.savedCardId;
  const savedExpiry = params.expiryMonth && params.expiryYear
    ? `${params.expiryMonth}/${params.expiryYear.slice(-2)}`
    : "";

  // Form state
  const [cardNumber, setCardNumber]   = useState(isSavedCard ? `•••• •••• •••• ${params.last4}` : "");
  const [cardHolder, setCardHolder]   = useState(isSavedCard ? (params.cardholderName ?? "") : "");
  const [expiry, setExpiry]           = useState(isSavedCard ? savedExpiry : "");
  const [cvv, setCvv]                 = useState("");
  const [isCvvFocused, setIsCvvFocused] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [saveCard, setSaveCard]       = useState(false);

  // Card flip animation
  const flipAnim  = useRef(new Animated.Value(0)).current;
  const cardType  = isSavedCard
    ? (params.cardBrand?.toLowerCase() === "visa" ? "visa" : params.cardBrand?.toLowerCase() === "mastercard" ? "mastercard" : "unknown") as CardType
    : detectCardType(cardNumber);

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
    if (!isSavedCard) {
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
    }
    if (cvv.length < 3) errs.cvv = "Enter a valid CVV";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // One idempotency key per payment attempt: accidental double-taps replay the
  // SAME payment (never charged twice); a new attempt gets a fresh key.
  const attemptKeyRef = useRef(makeAttemptKey());

  /**
   * Runs the full payment workflow. `test` carries a simulated outcome and
   * routes through the mock gateway server-side — every state (loading,
   * receipt, decline, timeout…) uses the exact production code path.
   */
  const runPayment = async (card: {
    cardholderName: string; cardNumber: string; expiryMonth: string; expiryYear: string; cvv: string;
  }, testScenario?: string, savedCardId?: string, shouldSaveCard?: boolean) => {
    if (loading) return;
    setLoading(true);

    try {
      const result = await cardPaymentsApi.initiateCardPayment({
        amount,
        currency,
        ...card,
        purpose,
        idempotencyKey: attemptKeyRef.current,
        ...(testScenario ? { testScenario } : {}),
        ...(savedCardId ? { savedCardId } : {}),
        ...(shouldSaveCard ? { saveCard: true } : {}),
      });

      // Terminal outcome — the next attempt is a new payment.
      attemptKeyRef.current = makeAttemptKey();

      if (result.status === "FAILED") {
        Alert.alert("Payment Failed", result.message || "Your card could not be charged.");
        return;
      }

      // Success: the server credited the wallet atomically before responding.
      invalidateWalletBalance(qc).catch(() => {});

      router.replace({
        pathname: "/trade/card-success" as any,
        params: {
          amount: String(amount),
          currency,
          last4: result.last4 ?? "••••",
          cardBrand: result.cardBrand ?? "Card",
          txRef: result.txRef,
        },
      });
    } catch (err: any) {
      // Transport / gateway-unavailable errors (payment did not complete)
      attemptKeyRef.current = makeAttemptKey();
      const message = getErrorMessage(err);
      // No broker selected — the server rejects deposits with BROKER_REQUIRED.
      if (/BROKER_REQUIRED/i.test(message) || /BROKER_REQUIRED/i.test(String(err?.message ?? ""))) {
        Alert.alert(
          "Select a Broker",
          "Select a broker first — deposits go directly to your broker's account.",
          [
            { text: "Cancel", style: "cancel", onPress: () => guardedBack("/(tabs)") },
            { text: "Select Broker", onPress: () => router.push("/broker-select" as any) },
          ],
        );
        return;
      }
      Alert.alert("Payment Unsuccessful", message);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!validate() || loading) return;
    if (isSavedCard) {
      await runPayment({
        cardholderName: params.cardholderName ?? "",
        cardNumber: "",
        expiryMonth: params.expiryMonth ?? "",
        expiryYear: params.expiryYear ?? "",
        cvv,
      }, undefined, params.savedCardId);
    } else {
      const [mm, yy] = expiry.split("/");
      await runPayment({
        cardholderName: cardHolder.trim(),
        cardNumber: cardNumber.replace(/\s/g, ""),
        expiryMonth: mm,
        expiryYear: yy,
        cvv,
      }, undefined, undefined, saveCard);
    }
  };

  // ── Test Transaction mode ──
  const [showTestSheet, setShowTestSheet] = useState(false);
  const runTestTransaction = async (scenario: string) => {
    // The mock gateway credits the wallet with no real charge, so this must
    // never run in a real release. Available in dev builds, and in release
    // builds ONLY while the pre-launch EXPO_PUBLIC_ENABLE_TEST_TX flag is
    // baked in (remove it from eas.json/.env at launch — the backend also
    // enforces its own ALLOW_TEST_TRANSACTIONS guard server-side).
    if (!TEST_TX_ENABLED) return;
    setShowTestSheet(false);

    // Saved-card mode: exercise the full saved-card charge path (decrypt on
    // the server, CVV supplied by the user) through the mock gateway.
    if (isSavedCard) {
      await runPayment(
        {
          cardholderName: params.cardholderName ?? "",
          cardNumber: "",
          expiryMonth: params.expiryMonth ?? "",
          expiryYear: params.expiryYear ?? "",
          cvv: cvv.length >= 3 ? cvv : "123",
        },
        scenario,
        params.savedCardId,
      );
      return;
    }

    // New-card mode: if the form holds a complete card, use IT — so "Save
    // this card" works exactly like a real payment. Fall back to the
    // standard test card when the form is empty/incomplete.
    const formComplete =
      cardNumber.replace(/\s/g, "").length >= 13 && cardHolder.trim().length > 0 && expiry.length === 5 && cvv.length >= 3;
    const [mm, yy] = expiry.split("/");
    const card = formComplete
      ? { cardholderName: cardHolder.trim(), cardNumber: cardNumber.replace(/\s/g, ""), expiryMonth: mm, expiryYear: yy, cvv }
      : { cardholderName: "TEST USER", cardNumber: "4111111111111111", expiryMonth: "12", expiryYear: "30", cvv: "123" };
    await runPayment(card, scenario, undefined, saveCard);
  };

  const topPad    = Platform.OS === "web" ? 44 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 16);
  const canPay    = isSavedCard
    ? cvv.length >= 3
    : cardNumber.replace(/\s/g, "").length >= 13 && cardHolder.trim().length > 0 && expiry.length === 5 && cvv.length >= 3;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: c.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* Header — clean white, dark text */}
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: c.background }]}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => guardedBack("/deposit")}>
          <BackIcon color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>Card Payment</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomPad + 90 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Card preview */}
        <View style={[styles.cardContainer, { backgroundColor: c.background }]}>
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
        <View style={[styles.amountBanner, { backgroundColor: c.background, borderBottomColor: c.border }]}>
          <Text style={styles.amountBannerLabel}>Depositing</Text>
          <Text style={[styles.amountBannerValue, { color: c.primary }]}>
            {currency === "MWK" ? "MK" : "$"} {amount.toLocaleString()}
          </Text>
        </View>

        {/* Form */}
        <View style={[styles.formWrap, { backgroundColor: c.background }]}>
          {isSavedCard ? (
            <>
              {/* Saved card — read-only preview */}
              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: c.text }]}>Card Number</Text>
                <View style={[styles.fieldBox, { backgroundColor: c.muted, borderColor: c.border }]}>
                  <Text style={[styles.fieldInput, { color: c.mutedForeground, paddingTop: 16 }]}>•••• •••• •••• {params.last4}</Text>
                </View>
              </View>
              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: c.text }]}>Cardholder Name</Text>
                <View style={[styles.fieldBox, { backgroundColor: c.muted, borderColor: c.border }]}>
                  <Text style={[styles.fieldInput, { color: c.mutedForeground, paddingTop: 16 }]}>{params.cardholderName}</Text>
                </View>
              </View>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <View style={styles.fieldWrap}>
                    <Text style={[styles.fieldLabel, { color: c.text }]}>Expiry Date</Text>
                    <View style={[styles.fieldBox, { backgroundColor: c.muted, borderColor: c.border }]}>
                      <Text style={[styles.fieldInput, { color: c.mutedForeground, paddingTop: 16 }]}>{savedExpiry}</Text>
                    </View>
                  </View>
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
            </>
          ) : (
            <>
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

              {/* Save this card toggle */}
              <TouchableOpacity
                style={styles.saveCardRow}
                activeOpacity={0.7}
                onPress={() => setSaveCard((v) => !v)}
              >
                <View style={[styles.saveCardCheck, { borderColor: c.border }, saveCard && { backgroundColor: c.primary, borderColor: c.primary }]}>
                  {saveCard && (
                    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                      <Path d="M5 13l4 4L19 7" stroke={WHITE} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  )}
                </View>
                <Text style={[styles.saveCardText, { color: c.text }]}>Save this card for future deposits</Text>
              </TouchableOpacity>
            </>
          )}

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
      <View style={[styles.ctaWrap, { paddingBottom: bottomPad > 0 ? bottomPad : 24, backgroundColor: c.background, borderTopColor: c.border }]}>
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: c.primary }, (!canPay || loading) && styles.ctaBtnDisabled]}
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

        {/* Test Transaction — full workflow through the mock gateway.
            Development builds only: stripped from production so the mock
            gateway can never be reached by end users. */}
        {TEST_TX_ENABLED && (
          <TouchableOpacity
            style={[styles.testBtn, { backgroundColor: c.card, borderColor: c.border }]}
            activeOpacity={0.7}
            disabled={loading}
            onPress={() => setShowTestSheet(true)}
          >
            <Text style={[styles.testBtnText, { color: c.primary }]}>Test Transaction</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Scenario picker (development builds only) */}
      <Modal transparent visible={TEST_TX_ENABLED && showTestSheet} animationType="fade" onRequestClose={() => setShowTestSheet(false)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setShowTestSheet(false)}>
          <View style={[styles.sheet, { backgroundColor: c.card }]} onStartShouldSetResponder={() => true}>
            <View style={[styles.sheetHandle, { backgroundColor: c.border }]} />
            <Text style={[styles.sheetTitle, { color: c.text }]}>Test Transaction</Text>
            <Text style={styles.sheetSubtitle}>
              Simulates the complete payment workflow — no real charge is made.
            </Text>
            {([
              ["success", "Successful payment"],
              ["declined", "Card declined"],
              ["insufficient_funds", "Insufficient funds"],
              ["expired_card", "Expired card"],
              ["network_failure", "Network failure"],
              ["timeout", "Gateway timeout"],
              ["duplicate", "Duplicate submission"],
            ] as const).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[styles.sheetItem, { borderBottomColor: c.border }]}
                activeOpacity={0.7}
                onPress={() => runTestTransaction(key)}
              >
                <Text style={[styles.sheetItemText, { color: c.text }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WHITE },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 18,
  },

  // ── Card preview — floats on the white page ────────────────────────────────
  cardContainer: {
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  cardPreviewWrapper: {
    width: "100%",
    maxWidth: 340,
    // Matches the rendered artwork's credit-card proportions (85.6 : 54 mm)
    aspectRatio: 8.56 / 5.4,
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

  // Studio-rendered face artwork; live details are absolutely positioned to
  // the artwork's reserved zones.
  cardArt: {
    flex: 1,
    padding: 20,
    justifyContent: "flex-end",
  },
  cardArtImg: {
    borderRadius: 18,
  },
  cardTopRow: {
    position: "absolute",
    top: 16,
    right: 16,
    left: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardNumberDisplay: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 20,
    color: WHITE,
    letterSpacing: 3,
    marginBottom: 16,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  cardLabel: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 9,
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  cardValue: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    color: WHITE,
    maxWidth: 170,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Back of card — the CVV sits inside the artwork's white window
  // (window geometry from the render: centre 64.9–79.5% x, 47–58.5% y).
  cvvOverlayRow: {
    position: "absolute",
    left: "64.9%",
    top: "47%",
    width: "14.6%",
    height: "11.5%",
    alignItems: "center",
    justifyContent: "center",
  },
  cvvText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 15,
    color: DARK,
    letterSpacing: 3,
  },
  cvvLabel: {
    position: "absolute",
    left: "65.3%",
    top: "60%",
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 9,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.75)",
  },

  // ── Amount banner ────────────────────────────────────────────────────────────
  amountBanner: {
    borderBottomWidth: 1,
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
  },

  // ── Form ─────────────────────────────────────────────────────────────────────
  formWrap: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 4,
  },
  fieldWrap: { marginBottom: 18 },
  fieldLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    marginBottom: 8,
  },
  fieldBox: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    justifyContent: "center",
  },
  fieldBoxFocused: {},
  fieldBoxError: { borderColor: ERROR },
  fieldInput: {
    fontFamily: "PlusJakartaSans_500Medium" as any,
    fontSize: 16,
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

  // ── Save card ──────────────────────────────────────────────────────────────────
  saveCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    marginTop: 4,
  },
  saveCardCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  saveCardText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
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
    borderTopWidth: 1,
  },
  ctaBtn: {
    height: 56,
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

  // ── Test Transaction ────────────────────────────────────────────────────────
  testBtn: {
    marginTop: 10,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  testBtnText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 18,
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: MUTED,
    marginBottom: 12,
  },
  sheetItem: {
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  sheetItemText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 15,
  },
});

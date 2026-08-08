import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
import { useColors } from "@/hooks/useColors";
import { authApi, getErrorMessage, logHandledError } from "../services/api";
import { useAuth } from "../services/auth-context";

const WHITE = "#FFFFFF";
const DARK = "#111827";
const MUTED = "#9CA3AF";
const BG_INPUT = "#F9FAFB";

const CODE_LENGTH = 6; // matches backend OTP_LENGTH
const RESEND_COOLDOWN = 60; // matches backend OTP_RESEND_COOLDOWN_SECONDS

/**
 * Email verification step — runs right after phone verification during
 * account creation. A 6-digit code is emailed to the address given at
 * signup; verifying it stamps emailVerifiedAt server-side (which the
 * broker KYC checklist requires).
 */
export default function VerifyEmailScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 12);

  const { user } = useAuth();
  const email = user?.email ?? "";

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const inputRefs = useRef<(TextInput | null)[]>(Array(CODE_LENGTH).fill(null));
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const sentRef = useRef(false);

  // Send the code automatically when the screen opens.
  useEffect(() => {
    if (!email || sentRef.current) return;
    sentRef.current = true;
    (async () => {
      try {
        await authApi.sendOtp(email, "email_verification");
        setCooldown(RESEND_COOLDOWN);
      } catch (err) {
        logHandledError("Email OTP send", err);
        // Cooldown error just means a code is already in flight — fine.
      }
    })();
  }, [email]);

  // Resend countdown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown > 0]);

  // No email on the account → nothing to verify; go straight to the app.
  useEffect(() => {
    if (user && !user.email) router.replace("/(tabs)");
  }, [user]);

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace") {
      if (code[index]) {
        const newCode = [...code];
        newCode[index] = "";
        setCode(newCode);
      } else if (index > 0) {
        const newCode = [...code];
        newCode[index - 1] = "";
        setCode(newCode);
        inputRefs.current[index - 1]?.focus();
        setFocusedIndex(index - 1);
      }
    }
  };

  const isComplete = code.every((ch) => ch !== "");

  const handleVerify = async () => {
    if (!isComplete || loading) return;
    setLoading(true);
    setErrorMsg("");
    try {
      await authApi.verifyOtp(email, "email_verification", code.join(""));
      router.replace("/(tabs)");
    } catch (err) {
      logHandledError("Email OTP verify", err);
      setErrorMsg(getErrorMessage(err));
      setCode(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      setFocusedIndex(0);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setErrorMsg("");
    try {
      await authApi.sendOtp(email, "email_verification");
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      logHandledError("Email OTP resend", err);
      setErrorMsg(getErrorMessage(err));
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}>
        <View style={styles.centeredContent}>
          {/* ── Header ── */}
          <View style={styles.headerSection}>
            <Text style={styles.headline}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              Enter the {CODE_LENGTH}-digit code we sent to{"\n"}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
          </View>

          {/* ── OTP Boxes ── */}
          <View style={styles.otpRow}>
            {Array(CODE_LENGTH).fill(null).map((_, i) => {
              const isActive = focusedIndex === i;
              const hasValue = code[i] !== "";
              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={1}
                  style={[styles.otpBox, isActive && [styles.otpBoxActive, { borderColor: c.primary }]]}
                  onPress={() => {
                    inputRefs.current[i]?.focus();
                    setFocusedIndex(i);
                  }}
                >
                  <TextInput
                    ref={(ref) => { inputRefs.current[i] = ref; }}
                    style={styles.hiddenInput}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={code[i]}
                    onChangeText={(t) => handleChange(t, i)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                    onFocus={() => setFocusedIndex(i)}
                    caretHidden
                  />
                  {hasValue
                    ? <Text style={styles.otpDigit}>{code[i]}</Text>
                    : isActive && <View style={styles.cursor} />
                  }
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Resend row ── */}
          <View style={styles.resendRow}>
            <Text style={styles.resendText}>Didn't receive the email? </Text>
            <TouchableOpacity activeOpacity={0.7} onPress={handleResend} disabled={cooldown > 0}>
              <Text style={[styles.resendLink, { color: c.primary }, cooldown > 0 && { color: MUTED }]}>
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend"}
              </Text>
            </TouchableOpacity>
          </View>

          {errorMsg ? (
            <View style={{ paddingHorizontal: 24, marginBottom: 8, alignItems: "center" }}>
              <Text style={{ color: "#EF4444", fontSize: 13, textAlign: "center" }}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* ── Continue button ── */}
          <View style={styles.ctaWrap}>
            <TouchableOpacity
              style={[styles.continueBtn, { backgroundColor: c.primary }, (!isComplete || loading) && styles.continueBtnDisabled]}
              activeOpacity={0.85}
              onPress={handleVerify}
              disabled={!isComplete || loading}
            >
              <Text style={styles.continueBtnText}>{loading ? "Verifying..." : "Continue"}</Text>
            </TouchableOpacity>

            {/* Email delivery can lag — allow entering the app and verifying
                later from the profile. (The PIN is already set by this point.) */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.replace("/(tabs)")}
              style={{ paddingVertical: 14, alignItems: "center" }}
            >
              <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 14, color: MUTED }}>
                Skip for now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WHITE },
  centeredContent: { flex: 1, justifyContent: "center" },
  headerSection: { paddingHorizontal: 24, paddingBottom: 32, alignItems: "center" },
  headline: {
    fontSize: 24, fontFamily: "PlusJakartaSans_700Bold", color: DARK,
    lineHeight: 32, marginBottom: 10, textAlign: "center",
  },
  subtitle: {
    fontSize: 14, fontFamily: "PlusJakartaSans_400Regular", color: MUTED,
    lineHeight: 22, textAlign: "center",
  },
  emailText: { fontFamily: "PlusJakartaSans_600SemiBold", color: DARK },
  otpRow: { flexDirection: "row", paddingHorizontal: 24, gap: 10, marginBottom: 24 },
  otpBox: {
    flex: 1, height: 56, borderRadius: 12, backgroundColor: BG_INPUT,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "transparent",
  },
  otpBoxActive: { },
  hiddenInput: { position: "absolute", width: "100%", height: "100%", opacity: 0, color: "transparent" },
  otpDigit: { fontSize: 22, fontFamily: "PlusJakartaSans_600SemiBold", color: DARK },
  cursor: { width: 1.5, height: 24, backgroundColor: DARK },
  resendRow: {
    flexDirection: "row", justifyContent: "center", alignItems: "center",
    paddingHorizontal: 24, marginBottom: 32,
  },
  resendText: { fontSize: 13, fontFamily: "PlusJakartaSans_400Regular", color: MUTED },
  resendLink: { fontSize: 13, fontFamily: "PlusJakartaSans_600SemiBold" },
  ctaWrap: { paddingHorizontal: 24 },
  continueBtn: {
    height: 56, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  continueBtnDisabled: { opacity: 0.5 },
  continueBtnText: { fontSize: 17, fontFamily: "PlusJakartaSans_600SemiBold", color: WHITE },
});

import { guardedPush } from "@/utils/navigation";
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { authApi, ApiError, getErrorMessage, logHandledError } from "../services/api";
import {
  authenticate,
  cachePinIfBiometricsEnabled,
  clearCachedPin,
  getBiometricInfo,
  getCachedPin,
  isBiometricEnabled,
} from "../services/biometrics";
import { useColors } from "@/hooks/useColors";

const WHITE = "#FFFFFF";
const RED = "#EF4444";
const PIN_LENGTH = 4;

/**
 * Transaction-PIN verification modal.
 *
 * Financial actions (buy, sell, withdraw) are protected server-side by
 * PinGuard: the client must first exchange the user's PIN for a short-lived
 * pinToken via POST /auth/pin/verify, then send it as the `x-pin-token`
 * header. This modal collects the PIN, performs the exchange, and hands the
 * token to the caller. It auto-submits when the 4th digit is entered and
 * shows wrong-PIN / locked errors inline so the user can retry immediately.
 */
export default function PinVerifyModal({
  visible,
  title = "Enter your PIN",
  subtitle = "Confirm this transaction with your 4-digit PIN",
  onVerified,
  onCancel,
}: {
  visible: boolean;
  title?: string;
  subtitle?: string;
  /** Called with the short-lived pinToken after successful verification. */
  onVerified: (pinToken: string) => void;
  onCancel: () => void;
}) {
  const c = useColors();
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  // User skipped PIN creation during onboarding ("Maybe later") — offer the
  // set-up path instead of a dead end.
  const [needsSetup, setNeedsSetup] = useState(false);
  // True while the OS biometric sheet may be up — keeps the keyboard away
  // until the biometric path has resolved one way or the other.
  const [bioPending, setBioPending] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>(Array(PIN_LENGTH).fill(null));
  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  const focusManualEntry = () => {
    setBioPending(false);
    setTimeout(() => inputRefs.current[0]?.focus(), 250);
  };

  // Reset state each time the modal opens. If the user has biometrics
  // enabled (and a cached PIN is seeded), lead with the OS biometric prompt;
  // manual PIN entry is always the fallback — on failure, cancel, missing
  // hardware/enrolment, or an unseeded cache.
  useEffect(() => {
    if (!visible) return;
    setDigits(Array(PIN_LENGTH).fill(""));
    setError(null);
    setVerifying(false);
    setNeedsSetup(false);
    setBioPending(true);

    let cancelled = false;
    (async () => {
      try {
        const enabled = await isBiometricEnabled();
        if (!enabled) return focusManualEntry();

        const [cachedPin, info] = await Promise.all([getCachedPin(), getBiometricInfo()]);
        if (!cachedPin || !info.available || !info.enrolled) return focusManualEntry();
        if (cancelled || !visibleRef.current) return;

        const ok = await authenticate(title);
        if (cancelled || !visibleRef.current) return;
        if (!ok) return focusManualEntry();

        setBioPending(false);
        await verify(cachedPin, { fromBiometric: true });
      } catch {
        if (!cancelled && visibleRef.current) focusManualEntry();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible]);

  const verify = async (pin: string, opts?: { fromBiometric?: boolean }) => {
    setVerifying(true);
    setError(null);
    try {
      const { pinToken } = await authApi.verifyPin(pin);
      if (!opts?.fromBiometric) {
        // Keep the biometric PIN cache seeded/current — a no-op when the
        // user hasn't enabled biometrics.
        cachePinIfBiometricsEnabled(pin).catch(() => {});
      }
      onVerified(pinToken);
    } catch (err) {
      logHandledError("PIN verify", err);
      const code = err instanceof ApiError ? (err.body?.error?.code as string) : null;
      if (code === "AUTH_PIN_INVALID") {
        if (opts?.fromBiometric) {
          // The cached PIN is stale (changed on another device / server
          // side). Drop it and fall back to manual entry.
          clearCachedPin().catch(() => {});
          setError("Your PIN has changed — please enter it manually.");
        } else {
          setError("Incorrect PIN. Please try again.");
        }
      }
      else if (code === "AUTH_PIN_LOCKED") setError("Too many attempts — PIN is temporarily locked. Try again later.");
      else if (code === "AUTH_PIN_NOT_SET") {
        setError("You haven't set a transaction PIN yet.");
        setNeedsSetup(true);
      }
      else setError(getErrorMessage(err));
      setDigits(Array(PIN_LENGTH).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setVerifying(false);
    }
  };

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (digit && index === PIN_LENGTH - 1 && next.every((d) => d !== "")) {
      verify(next.join(""));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "rgba(9,14,18,0.6)", alignItems: "center", justifyContent: "center", paddingHorizontal: 28 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={{ width: "100%", maxWidth: 360, borderRadius: 20, backgroundColor: c.background, padding: 24 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text, textAlign: "center" }}>
            {title}
          </Text>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: c.mutedForeground, textAlign: "center", marginTop: 6, lineHeight: 19 }}>
            {subtitle}
          </Text>

          {/* PIN boxes */}
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 14, marginTop: 22 }}>
            {Array(PIN_LENGTH).fill(null).map((_, i) => {
              const filled = digits[i] !== "";
              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={1}
                  onPress={() => inputRefs.current[i]?.focus()}
                  style={{
                    width: 56, height: 60, borderRadius: 14, borderWidth: 1.5,
                    borderColor: error ? RED : filled ? c.primary : c.border,
                    backgroundColor: c.card,
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <TextInput
                    ref={(ref) => { inputRefs.current[i] = ref; }}
                    style={{ position: "absolute", width: "100%", height: "100%", opacity: 0.02, textAlign: "center" }}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digits[i]}
                    editable={!verifying}
                    onChangeText={(t) => handleChange(t, i)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                    caretHidden
                    secureTextEntry
                  />
                  {filled && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c.primary }} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Status line */}
          <View style={{ minHeight: 34, marginTop: 14, alignItems: "center", justifyContent: "center" }}>
            {verifying ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <ActivityIndicator size="small" color={c.primary} />
                <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: c.mutedForeground }}>Verifying…</Text>
              </View>
            ) : error ? (
              <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: RED, textAlign: "center" }}>{error}</Text>
            ) : null}
          </View>

          {needsSetup && (
            <TouchableOpacity
              onPress={() => { onCancel(); guardedPush(() => router.push("/create-pin" as any)); }}
              activeOpacity={0.85}
              style={{ backgroundColor: c.primary, borderRadius: 12, paddingVertical: 13, alignItems: "center", marginBottom: 6 }}
            >
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: WHITE }}>Set up PIN</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={onCancel}
            disabled={verifying}
            activeOpacity={0.7}
            style={{ alignSelf: "center", paddingVertical: 10, paddingHorizontal: 24, opacity: verifying ? 0.5 : 1 }}
          >
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.mutedForeground }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

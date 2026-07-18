import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
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
import Svg, { Path } from "react-native-svg";

const TEAL = "#164951";
const WHITE = "#FFFFFF";
const DARK = "#111827";
const MUTED = "#9CA3AF";
const BG_INPUT = "#F9FAFB";

const CODE_LENGTH = 5;

function BackArrow() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12l7-7M5 12l7 7"
        stroke={DARK}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function VerifyCodeScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 12);

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const inputRefs = useRef<(TextInput | null)[]>(Array(CODE_LENGTH).fill(null));

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

  const isComplete = code.every((c) => c !== "");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const params = useLocalSearchParams<{ phone?: string }>();
  const phone = params.phone ?? "";

  const handleVerify = async () => {
    if (!isComplete) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const { authApi } = require("../services/api");
      await authApi.verifyOtp(phone, "phone_verification", code.join(""));
      router.push("/create-pin");
    } catch (err: any) {
      setErrorMsg(err?.message || "Invalid code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const { authApi } = require("../services/api");
      await authApi.sendOtp(phone, "phone_verification");
    } catch { /* silently fail */ }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}>

        {/* ── Back button (absolute, doesn't affect flow) ── */}
        <TouchableOpacity
          style={[styles.backBtn, { top: topPad + 12 }]}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <BackArrow />
        </TouchableOpacity>

        {/* ── Centered content ── */}
        <View style={styles.centeredContent}>

          {/* ── Header ── */}
          <View style={styles.headerSection}>
            <Text style={styles.headline}>Enter Verification Code</Text>
            <Text style={styles.subtitle}>
              Enter the 5-digit code we sent to your phone number.
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
                  style={[styles.otpBox, isActive && styles.otpBoxActive]}
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
            <Text style={styles.resendText}>Didn't receive a code? </Text>
            <TouchableOpacity activeOpacity={0.7} onPress={handleResend}>
              <Text style={styles.resendLink}>Resend</Text>
            </TouchableOpacity>
          </View>

          {errorMsg ? (
            <View style={{ paddingHorizontal: 24, marginBottom: 8, alignItems: "center" }}>
              <Text style={{ color: "#EF4444", fontSize: 13 }}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* ── Continue button ── */}
          <View style={styles.ctaWrap}>
            <TouchableOpacity
              style={[styles.continueBtn, (!isComplete || loading) && styles.continueBtnDisabled]}
              activeOpacity={0.85}
              onPress={handleVerify}
              disabled={!isComplete || loading}
            >
              <Text style={styles.continueBtnText}>{loading ? "Verifying..." : "Continue"}</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  backBtn: {
    position: "absolute",
    left: 24,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  centeredContent: {
    flex: 1,
    justifyContent: "center",
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: "center",
  },
  headline: {
    fontSize: 24,
    fontFamily: "PlusJakartaSans_700Bold",
    color: DARK,
    lineHeight: 32,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
    color: MUTED,
    lineHeight: 22,
    textAlign: "center",
  },
  otpRow: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  otpBox: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    backgroundColor: BG_INPUT,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  otpBoxActive: {
    borderColor: TEAL,
  },
  hiddenInput: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0,
    color: "transparent",
  },
  otpDigit: {
    fontSize: 22,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: DARK,
  },
  cursor: {
    width: 1.5,
    height: 24,
    backgroundColor: DARK,
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  resendText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    color: MUTED,
  },
  resendLink: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: TEAL,
  },
  ctaWrap: {
    paddingHorizontal: 24,
  },
  continueBtn: {
    height: 56,
    backgroundColor: TEAL,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  continueBtnDisabled: {
    opacity: 0.5,
  },
  continueBtnText: {
    fontSize: 17,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: WHITE,
  },
});

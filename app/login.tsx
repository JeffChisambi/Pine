import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AnimatedEyeButton from "../components/AnimatedEyeButton";
import { useAuth } from "../services/auth-context";
import { ApiError } from "../services/api";

const TEAL = "#164951";
const WHITE = "#FFFFFF";
const DARK = "#111827";
const BORDER_LIGHT = "#F3F4F6";
const MUTED = "#9CA3AF";
const BG_INPUT = "#F9FAFB";

// ── Google logo (colour) ──────────────────────────────────────────
function GoogleLogo() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path
        fill="#FFC107"
        d="M21.488 11.205H21.25v-.038H11v3.666h5.181C15.425 16.968 13.394 18.5 11 18.5c-3.037 0-5.5-2.463-5.5-5.5s2.463-5.5 5.5-5.5c1.402 0 2.678.529 3.649 1.393l2.593-2.593C15.104 4.774 13.164 3.833 11 3.833 5.938 3.833 1.833 7.938 1.833 13s4.105 9.167 9.167 9.167 9.167-4.105 9.167-9.167c0-.615-.064-1.215-.179-1.795Z"
      />
      <Path
        fill="#FF3D00"
        d="M2.89 8.733 5.902 10.942C6.717 8.924 8.69 7.5 11 7.5c1.402 0 2.678.529 3.649 1.393l2.593-2.593C15.604 4.774 13.415 3.833 11 3.833 7.479 3.833 4.426 5.821 2.89 8.733Z"
      />
      <Path
        fill="#4CAF50"
        d="M11 22.167c2.368 0 4.519-.906 6.146-2.38l-2.837-2.401A5.454 5.454 0 0 1 11 18.5c-2.384 0-4.409-1.52-5.171-3.642L2.839 17.161C4.356 20.13 7.437 22.167 11 22.167Z"
      />
      <Path
        fill="#1976D2"
        d="M21.488 11.205H21.25v-.038H11v3.666h5.181a5.51 5.51 0 0 1-1.874 2.553l2.837 2.401c-.2.182 3.023-2.204 3.023-6.787 0-.615-.064-1.215-.179-1.795Z"
      />
    </Svg>
  );
}

// ── Apple logo (dark) ─────────────────────────────────────────────
function AppleLogo() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        fill={DARK}
        d="M17.691 7.842C16.702 6.608 15.313 5.895 14.002 5.895c-1.734 0-2.467.824-3.67.824-1.24 0-2.183-.823-3.683-.823-1.473 0-3.04.895-4.033 2.425-1.398 2.151-1.161 6.197 1.105 9.646.811 1.233 1.893 2.62 3.308 2.633 1.258.012 1.614-.802 3.321-.812 1.707-.009 2.029.821 3.287.809 1.415-.013 2.557-1.549 3.367-2.782.581-.884.797-1.33 1.248-2.329-3.276-1.238-3.803-5.867-.561-7.644Z"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        fill={DARK}
        d="M13.687 4.517c.63-.808 1.108-1.95.934-3.117-.029.001-1.233.655-1.935 1.508-.638.775-1.165 1.924-.96 3.041 1.123.034 2.286-.637 2.961-1.432Z"
      />
    </Svg>
  );
}



// ── Lock icon ─────────────────────────────────────────────────────
function LockIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M6.875 8.375V5.664a3.125 3.125 0 1 1 6.25 0v2.711"
        stroke={MUTED}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14.375 8.375H5.625A1.25 1.25 0 0 0 4.375 9.625v4.75A1.25 1.25 0 0 0 5.625 15.625h8.75A1.25 1.25 0 0 0 15.625 14.375v-4.75A1.25 1.25 0 0 0 14.375 8.375Z"
        stroke={MUTED}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}



export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 12);

  const auth = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const identifier = "+265" + phoneNumber.trim();
  const canSubmit = phoneNumber.trim().length > 0 && password.length > 0 && !loading;

  const handleLogin = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setErrorMsg("");
    try {
      await auth.login({ phone: identifier.trim(), password });
      router.replace("/(tabs)");
    } catch (err) {
      const msg = err instanceof ApiError
        ? err.message
        : "Network error. Please check your connection.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: WHITE }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
    <View
      style={[
        styles.container,
        { paddingTop: topPad, paddingBottom: Math.max(bottomPad, 12) },
      ]}
    >
      {/* ── Headline ── */}
      <View style={styles.headerSection}>
        <Text style={styles.headline}>Welcome back!</Text>
        <Text style={styles.subheadline}>Sign in to your Pine account to continue investing.</Text>
      </View>

      {/* ── Phone number field ── */}
      <View style={[styles.fieldWrap, { flexDirection: "row", gap: 10 }]}>
        {/* Country code box */}
        <View style={styles.countryBox}>
          <Text style={styles.countryLabel}>Country code</Text>
          <View style={styles.countryInner}>
            <Text style={styles.flagText}>🇲🇼</Text>
            <Text style={styles.countryCode}>+265</Text>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path d="M6 9l6 6 6-6" stroke={MUTED} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
        </View>

        {/* Phone number input box */}
        <View style={[styles.inputRow, { flex: 1 }]}>
          <TextInput
            style={[styles.input, { paddingHorizontal: 4 }]}
            placeholder="Phone Number"
            placeholderTextColor={MUTED}
            keyboardType="phone-pad"
            autoCapitalize="none"
            value={phoneNumber}
            onChangeText={(t) => { setPhoneNumber(t); setErrorMsg(""); }}
          />
        </View>
      </View>

      {/* ── Password field ── */}
      <View style={styles.fieldWrap}>
        <View style={styles.inputRow}>
          <View style={styles.iconWrap}>
            <LockIcon />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={MUTED}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(t) => { setPassword(t); setErrorMsg(""); }}
          />
          <AnimatedEyeButton visible={showPassword} onPress={() => setShowPassword(v => !v)} />
        </View>
      </View>

      {/* ── Error message ── */}
      {errorMsg ? (
        <View style={{ paddingHorizontal: 24, marginBottom: 4 }}>
          <Text style={{ color: "#EF4444", fontSize: 13 }}>{errorMsg}</Text>
        </View>
      ) : null}

      {/* ── Forgot password ── */}
      <View style={styles.forgotWrap}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/forgot-password")}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>
      </View>

      {/* ── Sign In button ── */}
      <View style={styles.ctaWrap}>
        <TouchableOpacity
          style={[styles.signInBtn, !canSubmit && { opacity: 0.5 }]}
          activeOpacity={0.85}
          onPress={handleLogin}
          disabled={!canSubmit}
        >
          {loading ? (
            <ActivityIndicator color={WHITE} size="small" />
          ) : (
            <Text style={styles.signInText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Bottom row ── */}
      <View style={styles.bottomRow}>
        <Text style={styles.bottomText}>Don't have an account? </Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/signup")}>
          <Text style={styles.bottomLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },

  // ── Header ──────────────────────────────────────────────────────
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: "flex-start",
  },
  topCard: {
    backgroundColor: TEAL,
    borderRadius: 16,
    padding: 20,
    width: "100%",
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topCardContent: {
    flex: 1,
    paddingRight: 12,
  },
  topCardTitle: {
    fontSize: 16,
    fontFamily: "PlusJakartaSans_700Bold",
    color: WHITE,
    marginBottom: 4,
  },
  topCardSub: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "rgba(255,255,255,0.7)",
  },
  overlappingLogos: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: WHITE,
    borderWidth: 2,
    borderColor: TEAL,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  headline: {
    fontSize: 26,
    fontFamily: "PlusJakartaSans_700Bold",
    color: DARK,
    lineHeight: 34,
    textAlign: "left",
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  subheadline: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
    color: MUTED,
    textAlign: "left",
    alignSelf: "flex-start",
    lineHeight: 20,
  },

  // ── Social ──────────────────────────────────────────────────────
  socialRow: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 16,
  },
  socialBtn: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  socialBtnText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: DARK,
    textAlign: "left",
    lineHeight: 17,
  },

  // ── Divider ─────────────────────────────────────────────────────
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 28,
    marginBottom: 24,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER_LIGHT,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    color: MUTED,
  },

  // ── Fields ──────────────────────────────────────────────────────
  fieldWrap: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BG_INPUT,
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 14,
  },
  iconWrap: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "PlusJakartaSans_400Regular",
    color: DARK,
  },
  // ── Country code box ────────────────────────────────────────────
  countryBox: {
    backgroundColor: BG_INPUT,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    justifyContent: "center",
    height: 56,
  },
  countryLabel: {
    fontSize: 10,
    fontFamily: "PlusJakartaSans_500Medium",
    color: TEAL,
    marginBottom: 2,
  },
  countryInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  flagText: {
    fontSize: 18,
    lineHeight: 22,
  },
  countryCode: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: DARK,
  },
  eyeBtn: {
    padding: 4,
  },

  // ── Forgot ──────────────────────────────────────────────────────
  forgotWrap: {
    paddingHorizontal: 24,
    marginTop: 4,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  forgotText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: TEAL,
  },
  forgotHint: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    color: MUTED,
    flex: 1,
  },

  // ── CTA ─────────────────────────────────────────────────────────
  ctaWrap: {
    paddingHorizontal: 24,
    marginTop: 28,
  },
  signInBtn: {
    height: 56,
    backgroundColor: TEAL,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  signInText: {
    fontSize: 17,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: WHITE,
  },

  // ── Bottom row ──────────────────────────────────────────────────
  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 28,
  },
  bottomText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    color: MUTED,
  },
  bottomLink: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: TEAL,
  },
});

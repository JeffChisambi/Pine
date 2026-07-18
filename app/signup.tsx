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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import AnimatedEyeButton from "../components/AnimatedEyeButton";
import { useAuth } from "../services/auth-context";
import { ApiError } from "../services/api";

const TEAL        = "#164951";
const WHITE       = "#FFFFFF";
const DARK        = "#111827";
const BORDER_LIGHT= "#F3F4F6";
const MUTED       = "#9CA3AF";
const BG_INPUT    = "#F9FAFB";

/* ─── Icons ─────────────────────────────────────────────────── */
function PersonIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M10 10.625a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2.5 16.875c0-3.452 3.358-6.25 7.5-6.25s7.5 2.798 7.5 6.25" stroke={MUTED} strokeWidth={1.5} strokeMiterlimit={10} />
    </Svg>
  );
}

function EmailIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M17.5 4.25H2.5A1.25 1.25 0 0 0 1.25 5.5v9a1.25 1.25 0 0 0 1.25 1.25h15a1.25 1.25 0 0 0 1.25-1.25v-9A1.25 1.25 0 0 0 17.5 4.25Z" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.125 5.5 10 10.875 16.875 5.5" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M6.875 8.375V5.664a3.125 3.125 0 1 1 6.25 0v2.711" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14.375 8.375H5.625A1.25 1.25 0 0 0 4.375 9.625v4.75A1.25 1.25 0 0 0 5.625 15.625h8.75A1.25 1.25 0 0 0 15.625 14.375v-4.75A1.25 1.25 0 0 0 14.375 8.375Z" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M6.25 1.875v1.25M13.75 1.875v1.25M2.5 7.5h15M3.125 3.125h13.75c.345 0 .625.28.625.625v13.75c0 .345-.28.625-.625.625H3.125A.625.625 0 0 1 2.5 17.5V3.75c0-.345.28-.625.625-.625Z" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}


/* ─── FloatField — input with guiding label on the top border ── */
interface FloatFieldProps {
  label: string;
  children: React.ReactNode;
  error?: boolean;
  focused?: boolean;
}
function FloatField({ label, children, error, focused }: FloatFieldProps) {
  return (
    <View style={styles.floatWrap}>
      <View
        style={[
          styles.inputRow,
          styles.inputRowBordered,
          focused && styles.inputRowFocused,
          error  && styles.inputRowError,
        ]}
      >
        {children}
      </View>
      <Text style={[styles.floatLabel, focused && styles.floatLabelFocused, error && styles.floatLabelError]}>
        {label}
      </Text>
    </View>
  );
}

/* ─── Phone icon ──────────────────────────────────────────────── */
function PhoneIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M7.033 3.18c-.206-.62-.77-1.055-1.424-1.055H3.75A1.667 1.667 0 0 0 2.083 3.75c0 7.834 6.333 14.167 14.167 14.167a1.667 1.667 0 0 0 1.667-1.667v-1.858c0-.654-.435-1.218-1.055-1.424l-2.22-.74a1.458 1.458 0 0 0-1.52.369l-.86.86a11.3 11.3 0 0 1-4.969-4.969l.86-.86a1.458 1.458 0 0 0 .37-1.52l-.74-2.22Z"
        stroke={MUTED}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/* ─── Screen ─────────────────────────────────────────────────── */
export default function SignupScreen() {
  const insets    = useSafeAreaInsets();
  const topPad    = Platform.OS === "web" ? 44 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 12);

  const auth = useAuth();

  // Personal details
  const [firstName,  setFirstName]  = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName,   setLastName]   = useState("");
  const [dob,        setDob]        = useState("");
  const [gender,     setGender]     = useState<"Male" | "Female" | "">("");

  // Account
  const [phone,           setPhone]           = useState("+265");
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [loading,  setLoading]  = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Focus states
  const [firstFocused,   setFirstFocused]   = useState(false);
  const [middleFocused,  setMiddleFocused]  = useState(false);
  const [lastFocused,    setLastFocused]    = useState(false);
  const [dobFocused,     setDobFocused]     = useState(false);
  const [phoneFocused,   setPhoneFocused]   = useState(false);
  const [emailFocused,   setEmailFocused]   = useState(false);
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordsMatch = confirmPassword === "" || password === confirmPassword;

  const passwordRules = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    digit:     /\d/.test(password),
    special:   /[^a-zA-Z\d]/.test(password),
  };
  const passwordValid = Object.values(passwordRules).every(Boolean);

  const canContinue =
    firstName.trim()  !== "" &&
    lastName.trim()   !== "" &&
    dob.length >= 8   &&
    gender     !== "" &&
    phone.length >= 13 &&
    passwordValid &&
    password   === confirmPassword &&
    !loading;

  const handleSignup = async () => {
    if (!canContinue) return;
    setLoading(true);
    setErrorMsg("");
    try {
      await auth.register({
        phone: phone.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
        email: email.trim() || undefined,
      });
      router.push("/phone-number");
    } catch (err) {
      const msg = err instanceof ApiError
        ? err.message
        : "Network error. Please check your connection.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ── DOB auto-formatter: inserts / as user types ── */
  const handleDob = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) formatted = `${digits.slice(0,2)} / ${digits.slice(2,4)} / ${digits.slice(4)}`;
    else if (digits.length > 2) formatted = `${digits.slice(0,2)} / ${digits.slice(2)}`;
    setDob(formatted);
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
      <View style={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}>

        {/* ── Header ── */}
        <View style={styles.headerSection}>
          <Text style={styles.headline}>Welcome to Pine</Text>
        </View>

        {/* ════════ Personal Details ════════ */}
        <View style={styles.sectionWrap}>

          {/* First Name */}
          <FloatField label="Official First Name" focused={firstFocused}>
            <View style={styles.iconWrap}><PersonIcon /></View>
            <TextInput
              style={styles.input}
              placeholder="First name"
              placeholderTextColor={MUTED}
              autoCapitalize="words"
              value={firstName}
              onChangeText={setFirstName}
              onFocus={() => setFirstFocused(true)}
              onBlur={() => setFirstFocused(false)}
            />
          </FloatField>

          {/* Middle Name (optional) */}
          <FloatField label="Middle Name · Optional" focused={middleFocused}>
            <View style={styles.iconWrap}><PersonIcon /></View>
            <TextInput
              style={styles.input}
              placeholder="Middle name (if any)"
              placeholderTextColor={MUTED}
              autoCapitalize="words"
              value={middleName}
              onChangeText={setMiddleName}
              onFocus={() => setMiddleFocused(true)}
              onBlur={() => setMiddleFocused(false)}
            />
          </FloatField>

          {/* Last Name */}
          <FloatField label="Official Last Name" focused={lastFocused}>
            <View style={styles.iconWrap}><PersonIcon /></View>
            <TextInput
              style={styles.input}
              placeholder="Last name"
              placeholderTextColor={MUTED}
              autoCapitalize="words"
              value={lastName}
              onChangeText={setLastName}
              onFocus={() => setLastFocused(true)}
              onBlur={() => setLastFocused(false)}
            />
          </FloatField>

          {/* Date of Birth */}
          <FloatField label="Date of Birth" focused={dobFocused}>
            <View style={styles.iconWrap}><CalendarIcon /></View>
            <TextInput
              style={styles.input}
              placeholder="DD / MM / YYYY"
              placeholderTextColor={MUTED}
              keyboardType="number-pad"
              value={dob}
              onChangeText={handleDob}
              onFocus={() => setDobFocused(true)}
              onBlur={() => setDobFocused(false)}
              maxLength={14}
            />
          </FloatField>

          {/* Gender */}
          <View style={styles.floatWrap}>
            <View style={[styles.inputRow, styles.inputRowBordered, styles.genderRow]}>
              {(["Male", "Female"] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderPill, gender === g && styles.genderPillActive]}
                  onPress={() => setGender(g)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.genderPillText, gender === g && styles.genderPillTextActive]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.floatLabel, gender !== "" && styles.floatLabelFocused]}>
              Gender
            </Text>
          </View>
        </View>

        {/* ════════ Account Details ════════ */}
        <View style={styles.sectionWrap}>

          {/* Phone Number (required) */}
          <FloatField label="Phone Number" focused={phoneFocused}>
            <View style={styles.iconWrap}><PhoneIcon /></View>
            <TextInput
              style={styles.input}
              placeholder="+265..."
              placeholderTextColor={MUTED}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              onFocus={() => setPhoneFocused(true)}
              onBlur={() => setPhoneFocused(false)}
            />
          </FloatField>

          {/* Email (optional) */}
          <FloatField label="Email Address (optional)" focused={emailFocused}>
            <View style={styles.iconWrap}><EmailIcon /></View>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={MUTED}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
          </FloatField>

          {/* Password */}
          <View style={styles.floatWrap}>
            <View style={[styles.inputRow, styles.inputRowBordered]}>
              <View style={styles.iconWrap}><LockIcon /></View>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={MUTED}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <AnimatedEyeButton visible={showPassword} onPress={() => setShowPassword(v => !v)} />
            </View>
            <Text style={styles.floatLabel}>Password</Text>
          </View>

          {/* Password requirements */}
          {password.length > 0 && (
            <View style={styles.pwRulesWrap}>
              {([
                [passwordRules.length,    "At least 8 characters"],
                [passwordRules.uppercase, "One uppercase letter"],
                [passwordRules.lowercase, "One lowercase letter"],
                [passwordRules.digit,     "One number"],
                [passwordRules.special,   "One special character (!@#$…)"],
              ] as [boolean, string][]).map(([ok, label]) => (
                <View key={label} style={styles.pwRuleRow}>
                  <Text style={[styles.pwRuleDot, ok && styles.pwRuleDotOk]}>●</Text>
                  <Text style={[styles.pwRuleText, ok && styles.pwRuleTextOk]}>{label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Confirm Password */}
          <View style={styles.floatWrap}>
            <View style={[styles.inputRow, styles.inputRowBordered, !passwordsMatch && styles.inputRowError]}>
              <View style={styles.iconWrap}><LockIcon /></View>
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor={MUTED}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <AnimatedEyeButton visible={showConfirmPassword} onPress={() => setShowConfirmPassword(v => !v)} />
            </View>
            <Text style={[styles.floatLabel, !passwordsMatch && styles.floatLabelError]}>
              Confirm Password
            </Text>
            {!passwordsMatch && (
              <Text style={styles.errorText}>Passwords do not match</Text>
            )}
          </View>
        </View>

        {/* ── Error message ── */}
        {errorMsg ? (
          <View style={{ paddingHorizontal: 4, marginBottom: 8 }}>
            <Text style={{ color: "#EF4444", fontSize: 13 }}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* ── Continue button ── */}
        <View style={styles.ctaWrap}>
          <TouchableOpacity
            style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
            activeOpacity={0.85}
            onPress={handleSignup}
            disabled={!canContinue}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.continueBtnText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Bottom row ── */}
        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>Already have an account? </Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()}>
            <Text style={styles.bottomLink}>Sign In</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ─── Styles ─────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },

  // ── Header ──────────────────────────────────────────────────
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
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
  topCardContent: { flex: 1, paddingRight: 12 },
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
  overlappingLogos: { flexDirection: "row", alignItems: "center" },
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
    fontSize: 28,
    fontFamily: "PlusJakartaSans_700Bold",
    color: DARK,
    lineHeight: 36,
    textAlign: "center",
  },

  // ── Section grouping ─────────────────────────────────────────
  sectionWrap: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },

  // ── Floating-label field ─────────────────────────────────────
  floatWrap: {
    position: "relative",
    marginBottom: 22,
  },
  floatLabel: {
    position: "absolute",
    top: -9,
    left: 12,
    backgroundColor: WHITE,
    paddingHorizontal: 4,
    fontSize: 11,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: MUTED,
    letterSpacing: 0.2,
  },
  floatLabelFocused: {
    color: TEAL,
  },
  floatLabelError: {
    color: "#EF4444",
  },

  // ── Input row ────────────────────────────────────────────────
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BG_INPUT,
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 14,
  },
  inputRowBordered: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
  },
  inputRowFocused: {
    borderColor: TEAL,
  },
  inputRowError: {
    borderColor: "#EF4444",
  },
  iconWrap: { marginRight: 12 },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "PlusJakartaSans_400Regular",
    color: DARK,
  },

  // ── Gender pills ─────────────────────────────────────────────
  genderRow: {
    height: 56,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  genderPill: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BG_INPUT,
  },
  genderPillActive: {
    backgroundColor: TEAL,
    borderColor: TEAL,
  },
  genderPillText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: MUTED,
  },
  genderPillTextActive: {
    color: WHITE,
  },

  // ── Error ────────────────────────────────────────────────────
  errorText: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#EF4444",
    marginTop: 6,
    marginLeft: 4,
  },

  // ── Password rules ───────────────────────────────────────────
  pwRulesWrap: {
    marginTop: -10,
    marginBottom: 16,
    paddingHorizontal: 4,
    gap: 4,
  },
  pwRuleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pwRuleDot: {
    fontSize: 8,
    color: MUTED,
  },
  pwRuleDotOk: {
    color: "#22C55E",
  },
  pwRuleText: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    color: MUTED,
  },
  pwRuleTextOk: {
    color: "#22C55E",
  },

  // ── CTA ──────────────────────────────────────────────────────
  ctaWrap: {
    paddingHorizontal: 24,
    marginTop: 8,
  },
  continueBtn: {
    height: 56,
    backgroundColor: TEAL,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  continueBtnDisabled: { opacity: 0.5 },
  continueBtnText: {
    fontSize: 17,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: WHITE,
  },

  // ── Bottom ───────────────────────────────────────────────────
  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 28,
    paddingBottom: 16,
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

import { guardedBack } from "@/utils/navigation";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
} from "react-native";
import Animated, { SlideInLeft, SlideInRight, SlideOutLeft, SlideOutRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import AnimatedEyeButton from "../components/AnimatedEyeButton";
import { useAuth } from "../services/auth-context";
import { ApiError } from "../services/api";
import { formatMalawiNational, isValidMalawiNational, malawiE164 } from "@/utils/phone";
import { useColors } from "@/hooks/useColors";

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
  valid?: boolean;
}
function FloatField({ label, children, error, focused, valid }: FloatFieldProps) {
  const c = useColors();
  return (
    <View style={styles.floatWrap}>
      <View
        style={[
          styles.inputRow,
          styles.inputRowBordered,
          focused && [styles.inputRowFocused, { borderColor: c.primary }],
          valid && styles.inputRowValid,
          error  && styles.inputRowError,
        ]}
      >
        {children}
      </View>
      <Text style={[styles.floatLabel, focused && [styles.floatLabelFocused, { color: c.primary }], error && styles.floatLabelError]}>
        {label}
      </Text>
    </View>
  );
}

function BackIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19l-7-7 7-7" stroke={DARK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
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
/**
 * Sign-up is four short steps, one screen each, so nothing has to scroll and
 * the person only ever has to think about one thing:
 *
 *   1. Your name        first, middle (optional), last
 *   2. About you        date of birth, gender
 *   3. How to reach you phone, email
 *   4. Password         password, confirm
 *
 * Each step checks its own fields before Continue lights up, and the account
 * is only created at the very end. Going back keeps what was typed.
 */
type Step = 0 | 1 | 2 | 3;
const STEP_COUNT = 4;

const STEP_META: Array<{ title: string; subtitle: string }> = [
  { title: "What's your name?",        subtitle: "As it appears on your national ID." },
  { title: "A little about you",       subtitle: "Needed to open your trading account." },
  { title: "How can we reach you?",    subtitle: "We'll send a code to confirm your email." },
  { title: "Choose a password",        subtitle: "Something only you would know." },
];

export default function SignupScreen() {
  const c = useColors();
  const insets    = useSafeAreaInsets();
  const topPad    = Platform.OS === "web" ? 44 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 12);

  const auth = useAuth();

  const [step, setStep] = useState<Step>(0);
  // Which way the next step slides in from.
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  // Personal details
  const [firstName,  setFirstName]  = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName,   setLastName]   = useState("");
  const [dob,        setDob]        = useState("");
  const [gender,     setGender]     = useState<"Male" | "Female" | "">("");

  // Account
  const [phone,           setPhone]           = useState("");
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

  // First input of each step, so the keyboard is up the moment a step lands.
  const firstRef   = useRef<TextInput>(null);
  const dobRef     = useRef<TextInput>(null);
  const phoneRef   = useRef<TextInput>(null);
  const passRef    = useRef<TextInput>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      [firstRef, dobRef, phoneRef, passRef][step]?.current?.focus();
    }, 320);
    return () => clearTimeout(t);
  }, [step]);

  const passwordsMatch = confirmPassword === "" || password === confirmPassword;

  const passwordRules = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    digit:     /\d/.test(password),
    special:   /[^a-zA-Z\d]/.test(password),
  };
  const passwordValid = Object.values(passwordRules).every(Boolean);

  // Email is required — account creation includes email verification.
  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim());

  // A real calendar date, and an adult. The MSE will not open an account for
  // a minor, so there is no point letting someone get four steps in first.
  const dobDigits = dob.replace(/\D/g, "");
  const dobDate = useMemo(() => {
    if (dobDigits.length !== 8) return null;
    const d = +dobDigits.slice(0, 2), m = +dobDigits.slice(2, 4), y = +dobDigits.slice(4);
    const date = new Date(Date.UTC(y, m - 1, d));
    if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
    return date;
  }, [dobDigits]);
  const dobValid = !!dobDate && dobDate.getTime() <= Date.now();
  const isAdult = !!dobDate && (Date.now() - dobDate.getTime()) / (365.25 * 24 * 3600 * 1000) >= 18;

  const stepValid: Record<Step, boolean> = {
    0: firstName.trim() !== "" && lastName.trim() !== "",
    1: dobValid && isAdult && gender !== "",
    2: isValidMalawiNational(phone) && emailValid,
    3: passwordValid && password === confirmPassword,
  };
  const canContinue = stepValid[step] && !loading;
  const isLast = step === STEP_COUNT - 1;

  const goTo = (next: Step) => {
    setErrorMsg("");
    setDirection(next > step ? "forward" : "back");
    setStep(next);
  };

  const handleBack = () => {
    if (step > 0) goTo((step - 1) as Step);
    else guardedBack("/login");
  };

  const handleContinue = () => {
    if (!canContinue) return;
    if (!isLast) { goTo((step + 1) as Step); return; }
    handleSignup();
  };

  const handleSignup = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      // DOB is entered as "DD / MM / YYYY" — convert to ISO (YYYY-MM-DD) for
      // the API so the backend can reconcile it against OCR/MRZ later.
      const dobIso = `${dobDigits.slice(4)}-${dobDigits.slice(2, 4)}-${dobDigits.slice(0, 2)}`;

      await auth.register({
        phone: malawiE164(phone),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
        email: email.trim().toLowerCase(),
        dateOfBirth: dobIso,
        gender: gender === "Male" ? "M" : gender === "Female" ? "F" : undefined,
      });
      // A transaction PIN is mandatory (required for every trade), so it comes
      // first; email verification follows. The AuthGate enforces both.
      router.push("/create-pin");
    } catch (err) {
      const msg = err instanceof ApiError
        ? err.message
        : "Network error. Please check your connection.";
      setErrorMsg(msg);
      // A taken phone or email is fixed on the contact step, not here.
      if (/phone|email|already/i.test(msg)) goTo(2);
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

  const entering = direction === "forward" ? SlideInRight.duration(260) : SlideInLeft.duration(260);
  const exiting  = direction === "forward" ? SlideOutLeft.duration(200) : SlideOutRight.duration(200);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: WHITE }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}>

        {/* ── Top bar: back + progress ── */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={step > 0 ? "Previous step" : "Back to sign in"}
            style={styles.backBtn}
          >
            <BackIcon />
          </TouchableOpacity>
          <View style={styles.progressWrap} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: STEP_COUNT, now: step + 1 }}>
            <View style={styles.progressTrack}>
              {Array.from({ length: STEP_COUNT }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.progressSeg, { backgroundColor: i <= step ? c.primary : BORDER_LIGHT }]}
                />
              ))}
            </View>
            <Text style={styles.progressText}>Step {step + 1} of {STEP_COUNT}</Text>
          </View>
        </View>

        {/* ── Step body ── */}
        {/* Scrolls when it has to: on a short landscape screen with the keyboard
            up, the confirm-password field and the rules list do not fit above
            the button, and a fixed pane simply clipped them. */}
        <View style={styles.body}>
          <Animated.View key={step} entering={entering} exiting={exiting} style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.stepPane}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.headline}>{STEP_META[step].title}</Text>
            <Text style={styles.subtitle}>{STEP_META[step].subtitle}</Text>

            {step === 0 && (
              <View style={styles.fields}>
                <FloatField label="Official First Name" focused={firstFocused}>
                  <View style={styles.iconWrap}><PersonIcon /></View>
                  <TextInput
                    ref={firstRef}
                    style={styles.input}
                    placeholder="First name"
                    placeholderTextColor={MUTED}
                    autoCapitalize="words"
                    returnKeyType="next"
                    value={firstName}
                    onChangeText={setFirstName}
                    onFocus={() => setFirstFocused(true)}
                    onBlur={() => setFirstFocused(false)}
                  />
                </FloatField>

                <FloatField label="Middle Name · Optional" focused={middleFocused}>
                  <View style={styles.iconWrap}><PersonIcon /></View>
                  <TextInput
                    style={styles.input}
                    placeholder="Middle name (if any)"
                    placeholderTextColor={MUTED}
                    autoCapitalize="words"
                    returnKeyType="next"
                    value={middleName}
                    onChangeText={setMiddleName}
                    onFocus={() => setMiddleFocused(true)}
                    onBlur={() => setMiddleFocused(false)}
                  />
                </FloatField>

                <FloatField label="Official Last Name" focused={lastFocused}>
                  <View style={styles.iconWrap}><PersonIcon /></View>
                  <TextInput
                    style={styles.input}
                    placeholder="Last name"
                    placeholderTextColor={MUTED}
                    autoCapitalize="words"
                    returnKeyType="done"
                    onSubmitEditing={handleContinue}
                    value={lastName}
                    onChangeText={setLastName}
                    onFocus={() => setLastFocused(true)}
                    onBlur={() => setLastFocused(false)}
                  />
                </FloatField>
              </View>
            )}

            {step === 1 && (
              <View style={styles.fields}>
                <FloatField
                  label="Date of Birth"
                  focused={dobFocused}
                  valid={dobValid && isAdult}
                  error={dobDigits.length === 8 && !(dobValid && isAdult)}
                >
                  <View style={styles.iconWrap}><CalendarIcon /></View>
                  <TextInput
                    ref={dobRef}
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
                {dobDigits.length === 8 && !dobValid && (
                  <Text style={styles.hintError}>That isn't a real date.</Text>
                )}
                {dobDigits.length === 8 && dobValid && !isAdult && (
                  <Text style={styles.hintError}>You must be 18 or older to open a trading account.</Text>
                )}

                <View style={styles.floatWrap}>
                  <View style={[styles.inputRow, styles.inputRowBordered, styles.genderRow]}>
                    {(["Male", "Female"] as const).map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[styles.genderPill, gender === g && [styles.genderPillActive, { backgroundColor: c.primary, borderColor: c.primary }]]}
                        onPress={() => setGender(g)}
                        activeOpacity={0.7}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: gender === g }}
                      >
                        <Text style={[styles.genderPillText, gender === g && styles.genderPillTextActive]}>
                          {g}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={[styles.floatLabel, gender !== "" && [styles.floatLabelFocused, { color: c.primary }]]}>
                    Gender
                  </Text>
                </View>
              </View>
            )}

            {step === 2 && (
              <View style={styles.fields}>
                <FloatField label="Phone Number" focused={phoneFocused} valid={isValidMalawiNational(phone)}>
                  <View style={styles.iconWrap}><PhoneIcon /></View>
                  <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: DARK, marginRight: 6 }}>+265</Text>
                  <TextInput
                    ref={phoneRef}
                    style={styles.input}
                    placeholder="991 234 567"
                    placeholderTextColor={MUTED}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={(t) => setPhone(formatMalawiNational(t))}
                    onFocus={() => setPhoneFocused(true)}
                    onBlur={() => setPhoneFocused(false)}
                    maxLength={11}
                  />
                </FloatField>

                <FloatField
                  label="Email Address"
                  focused={emailFocused}
                  valid={emailValid}
                  error={email.trim() !== "" && !emailFocused && !emailValid}
                >
                  <View style={styles.iconWrap}><EmailIcon /></View>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={MUTED}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleContinue}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </FloatField>
                <Text style={styles.hint}>We'll email you a code to confirm this address.</Text>
              </View>
            )}

            {step === 3 && (
              <View style={styles.fields}>
                <View style={styles.floatWrap}>
                  <View style={[styles.inputRow, styles.inputRowBordered, passwordValid && styles.inputRowValid]}>
                    <View style={styles.iconWrap}><LockIcon /></View>
                    <TextInput
                      ref={passRef}
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor={MUTED}
                      secureTextEntry={!showPassword}
                      returnKeyType="next"
                      value={password}
                      onChangeText={setPassword}
                    />
                    <AnimatedEyeButton visible={showPassword} onPress={() => setShowPassword(v => !v)} />
                  </View>
                  <Text style={styles.floatLabel}>Password</Text>
                </View>

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

                <View style={styles.floatWrap}>
                  <View style={[styles.inputRow, styles.inputRowBordered, !passwordsMatch && styles.inputRowError, confirmPassword !== "" && passwordsMatch && styles.inputRowValid]}>
                    <View style={styles.iconWrap}><LockIcon /></View>
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm Password"
                      placeholderTextColor={MUTED}
                      secureTextEntry={!showConfirmPassword}
                      returnKeyType="done"
                      onSubmitEditing={handleContinue}
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
            )}
          </ScrollView>
          </Animated.View>
        </View>

        {/* ── Error message ── */}
        {errorMsg ? (
          <View style={{ paddingHorizontal: 28, marginBottom: 8 }}>
            <Text style={{ color: "#EF4444", fontSize: 13 }}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* ── Continue button ── */}
        <View style={styles.ctaWrap}>
          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: c.primary }, !canContinue && styles.continueBtnDisabled]}
            activeOpacity={0.85}
            onPress={handleContinue}
            disabled={!canContinue}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canContinue }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.continueBtnText}>{isLast ? "Create account" : "Continue"}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Bottom row ── */}
        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>Already have an account? </Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => guardedBack("/login")}>
            <Text style={[styles.bottomLink, { color: c.primary }]}>Sign In</Text>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

/* ─── Styles ─────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },

  // ── Top bar ─────────────────────────────────────────────────
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  progressWrap: {
    flex: 1,
    paddingRight: 40, // balances the back button so the bar sits centred
    gap: 6,
  },
  progressTrack: {
    flexDirection: "row",
    gap: 6,
  },
  progressSeg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: MUTED,
    letterSpacing: 0.3,
    textAlign: "center",
  },

  // ── Body ────────────────────────────────────────────────────
  body: {
    flex: 1,
    overflow: "hidden",
  },
  stepPane: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 12,
  },
  headline: {
    fontSize: 26,
    fontFamily: "PlusJakartaSans_700Bold",
    color: DARK,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
    color: MUTED,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 28,
  },
  fields: {},
  hint: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    color: MUTED,
    marginTop: -10,
    marginLeft: 4,
  },
  hintError: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#EF4444",
    marginTop: -14,
    marginBottom: 16,
    marginLeft: 4,
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
  },
  inputRowValid: {
    borderColor: "#22C55E",
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
    paddingTop: 16,
    paddingBottom: 4,
  },
  bottomText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    color: MUTED,
  },
  bottomLink: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
});

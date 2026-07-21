import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AnimatedEyeButton from "../components/AnimatedEyeButton";
import { useAuth } from "../services/auth-context";
import { ApiError } from "../services/api";

const TEAL = "#164951";
const WHITE = "#FFFFFF";
const DARK = "#111827";
const BORDER_LIGHT = "#EBEBEB";
const MUTED = "#9CA3AF";
const BG_INPUT = "#F4F4F4";

// ── Country list ──────────────────────────────────────────────────
type Country = { flag: string; name: string; dial: string };
const COUNTRIES: Country[] = [
  { flag: "🇲🇼", name: "Malawi",         dial: "+265" },
  { flag: "🇿🇦", name: "South Africa",   dial: "+27"  },
  { flag: "🇿🇲", name: "Zambia",         dial: "+260" },
  { flag: "🇿🇼", name: "Zimbabwe",       dial: "+263" },
  { flag: "🇲🇿", name: "Mozambique",     dial: "+258" },
  { flag: "🇹🇿", name: "Tanzania",       dial: "+255" },
  { flag: "🇰🇪", name: "Kenya",          dial: "+254" },
  { flag: "🇺🇬", name: "Uganda",         dial: "+256" },
  { flag: "🇧🇼", name: "Botswana",       dial: "+267" },
  { flag: "🇳🇦", name: "Namibia",        dial: "+264" },
  { flag: "🇬🇧", name: "United Kingdom", dial: "+44"  },
  { flag: "🇺🇸", name: "United States",  dial: "+1"   },
];

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 16);

  const auth = useAuth();
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const identifier = selectedCountry.dial + phoneNumber.trim();
  const canSubmit = phoneNumber.trim().length > 0 && password.length > 0 && !loading;

  const filteredCountries = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.dial.includes(countrySearch)
  );

  const handleLogin = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setErrorMsg("");
    try {
      await auth.login({ phone: identifier.trim(), password });
      router.replace("/(tabs)");
    } catch (err) {
      const msg =
        err instanceof ApiError
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
      {/* ── Country picker modal ── */}
      <Modal visible={showCountryPicker} animationType="slide" transparent>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => { setShowCountryPicker(false); setCountrySearch(""); }}
        />
        <View style={[styles.modalSheet, { paddingBottom: Math.max(bottomPad, 24) }]}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Select country</Text>
          <View style={styles.modalSearch}>
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search country or code…"
              placeholderTextColor={MUTED}
              value={countrySearch}
              onChangeText={setCountrySearch}
              autoFocus
            />
          </View>
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.dial + item.name}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.countryRow,
                  selectedCountry.dial === item.dial &&
                    selectedCountry.name === item.name &&
                    styles.countryRowActive,
                ]}
                onPress={() => {
                  setSelectedCountry(item);
                  setShowCountryPicker(false);
                  setCountrySearch("");
                }}
              >
                <Text style={styles.countryRowFlag}>{item.flag}</Text>
                <Text style={styles.countryRowName}>{item.name}</Text>
                <Text style={styles.countryRowDial}>{item.dial}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}>

          {/* ── Top nav bar ── */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backBtn}
              activeOpacity={0.7}
              onPress={() => router.canGoBack() ? router.back() : router.replace("/")}
            >
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M19 12H5M5 12l7 7M5 12l7-7"
                  stroke={DARK}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/signup")}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* ── Heading ── */}
          <View style={styles.headingSection}>
            <Text style={styles.headline}>Welcome back!</Text>
            <Text style={styles.subheadline}>
              Let's get you back into building wealth.
            </Text>
          </View>

          {/* ── Phone row ── */}
          <View style={styles.phoneRow}>
            {/* Country code selector */}
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.countryBox}
              onPress={() => setShowCountryPicker(true)}
            >
              <Text style={styles.countryLabel}>Country code</Text>
              <View style={styles.countryInner}>
                <Text style={styles.flagText}>{selectedCountry.flag}</Text>
                <Text style={styles.countryDialText}>{selectedCountry.dial}</Text>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Path d="M6 9l6 6 6-6" stroke={MUTED} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
            </TouchableOpacity>

            {/* Phone number input */}
            <View style={styles.phoneInput}>
              <TextInput
                style={styles.input}
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
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={MUTED}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(t) => { setPassword(t); setErrorMsg(""); }}
              />
              <AnimatedEyeButton
                visible={showPassword}
                onPress={() => setShowPassword((v) => !v)}
              />
            </View>
          </View>

          {/* ── Error message ── */}
          {errorMsg ? (
            <View style={{ paddingHorizontal: 24, marginBottom: 8 }}>
              <Text style={{ color: "#EF4444", fontSize: 13 }}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* ── Forgot password ── */}
          <View style={styles.forgotWrap}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/forgot-password")}
            >
              <Text style={styles.forgotText}>Forgot your password?</Text>
            </TouchableOpacity>
          </View>

          {/* ── Log in button ── */}
          <View style={styles.ctaWrap}>
            <TouchableOpacity
              style={[styles.loginBtn, !canSubmit && { opacity: 0.5 }]}
              activeOpacity={0.85}
              onPress={handleLogin}
              disabled={!canSubmit}
            >
              {loading ? (
                <ActivityIndicator color={WHITE} size="small" />
              ) : (
                <Text style={styles.loginBtnText}>Log in</Text>
              )}
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

  // ── Top bar ─────────────────────────────────────────────────────
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  signUpLink: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: TEAL,
  },

  // ── Heading ─────────────────────────────────────────────────────
  headingSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  headline: {
    fontSize: 30,
    fontFamily: "PlusJakartaSans_700Bold",
    color: DARK,
    lineHeight: 38,
    marginBottom: 8,
  },
  subheadline: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_400Regular",
    color: MUTED,
    lineHeight: 22,
  },

  // ── Phone row ───────────────────────────────────────────────────
  phoneRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  countryBox: {
    backgroundColor: WHITE,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: "center",
    height: 60,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
  },
  countryLabel: {
    position: "absolute",
    top: -9,
    left: 12,
    backgroundColor: WHITE,
    paddingHorizontal: 4,
    fontSize: 10,
    fontFamily: "PlusJakartaSans_500Medium",
    color: MUTED,
    zIndex: 1,
  },
  countryInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  flagText: {
    fontSize: 18,
    lineHeight: 22,
  },
  countryDialText: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: DARK,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: BG_INPUT,
    borderRadius: 14,
    height: 60,
    justifyContent: "center",
    paddingHorizontal: 16,
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
    borderRadius: 14,
    height: 60,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "PlusJakartaSans_400Regular",
    color: DARK,
  },

  // ── Forgot ──────────────────────────────────────────────────────
  forgotWrap: {
    paddingHorizontal: 24,
    marginTop: 2,
    marginBottom: 32,
  },
  forgotText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: TEAL,
  },

  // ── CTA ─────────────────────────────────────────────────────────
  ctaWrap: {
    paddingHorizontal: 24,
  },
  loginBtn: {
    height: 58,
    backgroundColor: TEAL,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  loginBtnText: {
    fontSize: 17,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: WHITE,
  },

  // ── Country picker modal ─────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalSheet: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 12,
    maxHeight: "70%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: BORDER_LIGHT,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: "PlusJakartaSans_700Bold",
    color: DARK,
    marginBottom: 14,
  },
  modalSearch: {
    backgroundColor: BG_INPUT,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
    justifyContent: "center",
    marginBottom: 10,
  },
  modalSearchInput: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
    color: DARK,
  },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_LIGHT,
    gap: 12,
  },
  countryRowActive: {
    backgroundColor: TEAL + "10",
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  countryRowFlag: {
    fontSize: 22,
  },
  countryRowName: {
    flex: 1,
    fontSize: 15,
    fontFamily: "PlusJakartaSans_500Medium",
    color: DARK,
  },
  countryRowDial: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
    color: MUTED,
  },
});

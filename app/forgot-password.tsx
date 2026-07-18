import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";

const TEAL = "#164951";
const WHITE = "#FFFFFF";
const DARK = "#111827";
const MUTED = "#9CA3AF";
const BG_INPUT = "#F9FAFB";
const GREEN = "#45B369";
const TEAL_DARK = "#2D5B62";

function CloseIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={DARK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
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

function LockIllustration() {
  return (
    <Svg width={130} height={130} viewBox="0 0 130 130">
      <Circle cx={65} cy={65} r={65} fill={TEAL} />
      <Circle cx={108.875} cy={101.292} r={45.5} stroke={TEAL_DARK} strokeWidth={1.08333} fill="none" />
      <Circle cx={79.625} cy={17.875} r={53.0833} stroke={TEAL_DARK} strokeWidth={1.08333} fill="none" />
      <Circle cx={25.459} cy={96.958} r={7.04167} fill={TEAL_DARK} />
      <Rect x={26} y={35.271} width={78} height={108} rx={8} fill={GREEN} />
      <Rect x={30.333} y={40.083} width={69.333} height={104} rx={6} fill="white" />
      <Path d="M52 40.083H78V42.25C78 43.447 77.03 44.417 75.833 44.417H54.167C52.97 44.417 52 43.447 52 42.25V40.083Z" fill={GREEN} />
      <Circle cx={65} cy={73.333} r={17} fill={GREEN} />
      <Path d="M68.125 71.125V67.414C68.125 66.585 67.796 65.79 67.21 65.204C66.624 64.618 65.829 64.289 65 64.289C64.171 64.289 63.376 64.618 62.79 65.204C62.204 65.79 61.875 66.585 61.875 67.414V71.125" stroke={TEAL} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M69.375 71.125H60.625C59.589 71.125 58.75 71.964 58.75 73V79.875C58.75 80.911 59.589 81.75 60.625 81.75H69.375C70.411 81.75 71.25 80.911 71.25 79.875V73C71.25 71.964 70.411 71.125 69.375 71.125Z" stroke={TEAL} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x={43.333} y={100.75} width={43.333} height={4.333} rx={2.167} fill="#EBECEF" />
      <Rect x={49.833} y={110.5} width={30.333} height={4.333} rx={2.167} fill="#F3F4F6" />
    </Svg>
  );
}

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 12);

  const [phone, setPhone] = useState("+265");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async () => {
    if (!phone || phone.length < 13) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const { authApi } = require("../services/api");
      await authApi.forgotPassword(phone.trim());
      setSent(true);
    } catch (err: any) {
      setErrorMsg(err?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}>

      {/* ── Close button ── */}
      <TouchableOpacity
        style={[styles.closeBtn, { top: topPad + 12 }]}
        activeOpacity={0.7}
        onPress={() => router.back()}
      >
        <CloseIcon />
      </TouchableOpacity>

      {/* ── Centered content ── */}
      <View style={styles.centeredContent}>
        <View style={styles.illustrationWrap}>
          <LockIllustration />
        </View>

        <View style={styles.headerSection}>
          <Text style={styles.headline}>{sent ? "OTP Sent!" : "Forgot Password"}</Text>
          <Text style={styles.subtitle}>
            {sent
              ? "We've sent an OTP to your phone number. Check your messages."
              : "Enter your phone number and we'll send you an OTP to reset your password."}
          </Text>
        </View>

        {!sent && (
          <>
            <View style={styles.fieldWrap}>
              <View style={styles.inputRow}>
                <View style={styles.iconWrap}><EmailIcon /></View>
                <TextInput
                  style={styles.input}
                  placeholder="Phone (+265...)"
                  placeholderTextColor={MUTED}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={(t) => { setPhone(t); setErrorMsg(""); }}
                />
              </View>
            </View>

            {errorMsg ? (
              <View style={{ paddingHorizontal: 24, marginBottom: 8 }}>
                <Text style={{ color: "#EF4444", fontSize: 13 }}>{errorMsg}</Text>
              </View>
            ) : null}

            <View style={styles.ctaWrap}>
              <TouchableOpacity
                style={[styles.continueBtn, (phone.length < 13 || loading) && styles.continueBtnDisabled]}
                activeOpacity={0.85}
                onPress={handleSubmit}
                disabled={phone.length < 13 || loading}
              >
                <Text style={styles.continueBtnText}>{loading ? "Sending..." : "Continue"}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {sent && (
          <View style={styles.ctaWrap}>
            <TouchableOpacity
              style={styles.continueBtn}
              activeOpacity={0.85}
              onPress={() => router.back()}
            >
              <Text style={styles.continueBtnText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  closeBtn: {
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
  illustrationWrap: {
    alignItems: "center",
    marginBottom: 32,
  },
  headerSection: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  headline: {
    fontSize: 28,
    fontFamily: "PlusJakartaSans_700Bold",
    color: DARK,
    lineHeight: 36,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
    color: MUTED,
    lineHeight: 22,
  },
  fieldWrap: {
    paddingHorizontal: 24,
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
  ctaWrap: {
    paddingHorizontal: 24,
    marginTop: 28,
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

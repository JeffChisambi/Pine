import { router } from "expo-router";
import React, { useState } from "react";
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
import Svg, { Circle, Path, Rect } from "react-native-svg";

const TEAL = "#164951";
const WHITE = "#FFFFFF";
const DARK = "#111827";
const MUTED = "#9CA3AF";
const BG_INPUT = "#F9FAFB";

function BackArrow() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19l-7-7 7-7" stroke={DARK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MalawiFlag() {
  return (
    <Svg width={20} height={15} viewBox="0 0 20 15">
      {/* Black top stripe */}
      <Rect width={20} height={5} fill="#000000" />
      {/* Red middle stripe */}
      <Rect y={5} width={20} height={5} fill="#CE1126" />
      {/* Green bottom stripe */}
      <Rect y={10} width={20} height={5} fill="#339E35" />
      {/* Rising sun on black stripe */}
      <Circle cx={10} cy={5} r={2.8} fill="#CE1126" />
      <Circle cx={10} cy={5} r={2} fill="#000000" />
      {/* Sun rays */}
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <Path
            key={i}
            d={`M ${10 + 2.2 * Math.cos(rad)} ${5 + 2.2 * Math.sin(rad)} L ${10 + 3.2 * Math.cos(rad)} ${5 + 3.2 * Math.sin(rad)}`}
            stroke="#CE1126"
            strokeWidth={0.5}
          />
        );
      })}
    </Svg>
  );
}

function ClearIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Circle cx={9} cy={9} r={9} stroke={MUTED} strokeWidth={1.5} />
      <Path d="M12 6L6 12M6 6l6 6" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function PhoneNumberScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 12);

  const [phone, setPhone] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fullPhone = `+265${phone}`;

  const handleSendOtp = async () => {
    if (phone.length < 7) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const { authApi } = require("../services/api");
      await authApi.sendOtp(fullPhone, "phone_verification");
      router.push({ pathname: "/verify-code", params: { phone: fullPhone } } as any);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to send code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}>

        {/* ── Back button ── */}
        <TouchableOpacity
          style={[styles.backBtn, { top: topPad + 12 }]}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <BackArrow />
        </TouchableOpacity>

        {/* ── Centered content ── */}
        <View style={styles.centeredContent}>
          <View style={styles.headerSection}>
            <Text style={styles.headline}>Add a Phone Number</Text>
            <Text style={styles.subtitle}>
              We'll send you a verification code to confirm your number.
            </Text>
          </View>

          {/* ── Phone field ── */}
          <View style={styles.fieldWrap}>
            <View style={[styles.phoneRow, focused && styles.phoneRowFocused]}>
              <View style={styles.countrySection}>
                <MalawiFlag />
                <Text style={styles.countryCode}>+265</Text>
              </View>
              <View style={styles.divider} />
              <TextInput
                style={styles.phoneInput}
                placeholder="Phone number"
                placeholderTextColor={MUTED}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(t) => { setPhone(t); setErrorMsg(""); }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
              {phone.length > 0 && (
                <TouchableOpacity style={styles.clearBtn} activeOpacity={0.7} onPress={() => setPhone("")}>
                  <ClearIcon />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {errorMsg ? (
            <View style={{ paddingHorizontal: 24, marginBottom: 8 }}>
              <Text style={{ color: "#EF4444", fontSize: 13 }}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* ── Continue button ── */}
          <View style={styles.ctaWrap}>
            <TouchableOpacity
              style={[styles.continueBtn, (phone.length < 7 || loading) && styles.continueBtnDisabled]}
              activeOpacity={0.85}
              onPress={handleSendOtp}
              disabled={phone.length < 7 || loading}
            >
              <Text style={styles.continueBtnText}>{loading ? "Sending..." : "Continue"}</Text>
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
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BG_INPUT,
    borderRadius: 12,
    height: 56,
    borderWidth: 1,
    borderColor: "transparent",
  },
  phoneRowFocused: {
    borderColor: TEAL,
  },
  countrySection: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 14,
    gap: 6,
  },
  countryCode: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_400Regular",
    color: DARK,
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: DARK,
    marginHorizontal: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "PlusJakartaSans_400Regular",
    color: DARK,
  },
  clearBtn: {
    paddingRight: 14,
    padding: 4,
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

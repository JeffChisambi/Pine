import { router } from "expo-router";
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
const BORDER_LIGHT = "#EBECEF";

const PIN_LENGTH = 4;

function CloseIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={DARK}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function CreatePinScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 12);

  const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const inputRefs = useRef<(TextInput | null)[]>(Array(PIN_LENGTH).fill(null));

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, "").slice(-1);
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);
    if (digit && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace") {
      if (pin[index]) {
        const newPin = [...pin];
        newPin[index] = "";
        setPin(newPin);
      } else if (index > 0) {
        const newPin = [...pin];
        newPin[index - 1] = "";
        setPin(newPin);
        inputRefs.current[index - 1]?.focus();
        setFocusedIndex(index - 1);
      }
    }
  };

  const isComplete = pin.every((d) => d !== "");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleCreatePin = async () => {
    if (!isComplete) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const { authApi } = require("../services/api");
      await authApi.createPin(pin.join(""));
      router.replace("/(tabs)");
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to create PIN. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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

          {/* ── Header ── */}
          <View style={styles.headerSection}>
            <Text style={styles.headline}>Create New Pin</Text>
            <Text style={styles.subtitle}>
              Add a PIN number to make your account more secure.
            </Text>
          </View>

          {/* ── PIN boxes ── */}
          <View style={styles.pinRow}>
            {Array(PIN_LENGTH).fill(null).map((_, i) => {
              const isFilled = pin[i] !== "";
              const isActive = focusedIndex === i;
              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={1}
                  style={[
                    styles.pinBox,
                    isActive && styles.pinBoxActive,
                    isFilled && styles.pinBoxFilled,
                  ]}
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
                    value={pin[i]}
                    onChangeText={(t) => handleChange(t, i)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                    onFocus={() => setFocusedIndex(i)}
                    caretHidden
                    secureTextEntry
                  />
                  {isFilled
                    ? <View style={styles.pinDot} />
                    : isActive && <View style={styles.pinCursor} />
                  }
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Buttons ── */}
          <View style={styles.btnSection}>
            <TouchableOpacity
              style={[styles.continueBtn, (!isComplete || loading) && styles.continueBtnDisabled]}
              activeOpacity={0.85}
              onPress={handleCreatePin}
              disabled={!isComplete || loading}
            >
              <Text style={styles.continueBtnText}>{loading ? "Saving..." : "Continue"}</Text>
            </TouchableOpacity>

            {errorMsg ? (
              <Text style={{ color: "#EF4444", fontSize: 13, textAlign: "center", marginTop: 8 }}>{errorMsg}</Text>
            ) : null}

            <TouchableOpacity
              style={styles.laterBtn}
              activeOpacity={0.7}
              onPress={() => router.replace("/(tabs)")}
            >
              <Text style={styles.laterBtnText}>Maybe later</Text>
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

  /* PIN boxes */
  pinRow: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 15,
    marginBottom: 40,
  },
  pinBox: {
    flex: 1,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: BORDER_LIGHT,
  },
  pinBoxActive: {
    borderBottomColor: TEAL,
  },
  pinBoxFilled: {
    borderBottomColor: BORDER_LIGHT,
  },
  hiddenInput: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0,
    color: "transparent",
  },
  pinDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: DARK,
  },
  pinCursor: {
    width: 2,
    height: 24,
    borderRadius: 1,
    backgroundColor: DARK,
  },

  /* Buttons */
  btnSection: {
    paddingHorizontal: 24,
    gap: 12,
  },
  continueBtn: {
    height: 56,
    backgroundColor: TEAL,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  continueBtnDisabled: {
    opacity: 0.45,
  },
  continueBtnText: {
    fontSize: 17,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: WHITE,
  },
  laterBtn: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  laterBtnText: {
    fontSize: 17,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: DARK,
  },
});

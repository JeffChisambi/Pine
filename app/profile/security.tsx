import { guardedBack } from "@/utils/navigation";
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

const TEAL = "#164951";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";
const RED = "#EF4770";

// ── Icons ────────────────────────────────────────────────────────────────────

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19l-7-7 7-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ShieldIcon() {
  return (
    <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3L4 6.5V11C4 15.25 7.4 19.24 12 21C16.6 19.24 20 15.25 20 11V6.5L12 3Z"
        stroke={TEAL} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
      />
      <Path d="M9 12l2 2 4-4" stroke={TEAL} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function EyeIcon({ visible, color }: { visible: boolean; color: string }) {
  if (visible) {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.5} />
      </Svg>
    );
  }
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14.12 14.12A3 3 0 119.88 9.88" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 3l18 18" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={11} width={14} height={10} rx={2} stroke={TEAL} strokeWidth={1.5} />
      <Path d="M8 11V7a4 4 0 018 0v4" stroke={TEAL} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function PinIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={TEAL} strokeWidth={1.5} />
      <Path d="M9 9h.01M12 9h.01M15 9h.01M9 12h.01M12 12h.01M15 12h.01M9 15h.01M12 15h.01M15 15h.01" stroke={TEAL} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

// ── Password field ────────────────────────────────────────────────────────────

interface PasswordFieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  numeric?: boolean;
  maxLength?: number;
  c: ReturnType<typeof useColors>;
}

function PasswordField({ label, value, onChangeText, placeholder, numeric = false, maxLength, c }: PasswordFieldProps) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 14, color: c.text, marginBottom: 8 }}>
        {label}
      </Text>
      <View style={{
        backgroundColor: focused ? c.background : c.card,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: focused ? TEAL : c.border,
        height: 56,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
      }}>
        <TextInput
          style={{ flex: 1, fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: c.text, padding: 0 }}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={MUTED}
          secureTextEntry={!visible}
          keyboardType={numeric ? "number-pad" : "default"}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <TouchableOpacity onPress={() => setVisible(v => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <EyeIcon visible={visible} color={MUTED} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16, marginTop: 8 }}>
      {icon}
      <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: TEAL }}>{title}</Text>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function SecurityScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;
  const c = useColors();

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // PIN state
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const handleSave = () => {
    const passwordChanged = currentPassword || newPassword || confirmPassword;
    const pinChanged = currentPin || newPin || confirmPin;

    if (passwordChanged) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        Alert.alert("Incomplete", "Please fill in all password fields.");
        return;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert("Mismatch", "New password and confirmation do not match.");
        return;
      }
      if (newPassword.length < 8) {
        Alert.alert("Too short", "New password must be at least 8 characters.");
        return;
      }
    }

    if (pinChanged) {
      if (!currentPin || !newPin || !confirmPin) {
        Alert.alert("Incomplete", "Please fill in all PIN fields.");
        return;
      }
      if (newPin !== confirmPin) {
        Alert.alert("Mismatch", "New PIN and confirmation do not match.");
        return;
      }
      if (newPin.length < 4) {
        Alert.alert("Too short", "PIN must be at least 4 digits.");
        return;
      }
    }

    if (!passwordChanged && !pinChanged) {
      guardedBack("/(tabs)/profile");
      return;
    }

    // TODO: wire up API calls for password/PIN change
    Alert.alert("Success", "Your security settings have been updated.", [
      { text: "OK", onPress: () => guardedBack("/(tabs)/profile") },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.background, paddingTop: topPad }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12 }}>
        <TouchableOpacity
          onPress={() => guardedBack("/(tabs)/profile")}
          style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
        >
          <BackIcon color={c.text} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: c.text, textAlign: "center" }}>
          Security
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Shield illustration */}
        <View style={{ alignItems: "center", marginBottom: 32, marginTop: 8 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: `${TEAL}12`,
            alignItems: "center", justifyContent: "center",
          }}>
            <ShieldIcon />
          </View>
          <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: MUTED, marginTop: 10, textAlign: "center" }}>
            Keep your account safe by using a{"\n"}strong password and a secure PIN.
          </Text>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: c.border, marginBottom: 28 }} />

        {/* Password section */}
        <SectionHeader icon={<LockIcon />} title="Change Password" />

        <PasswordField
          label="Current Password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Enter current password"
          c={c}
        />
        <PasswordField
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="At least 8 characters"
          c={c}
        />
        <PasswordField
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Repeat new password"
          c={c}
        />

        {/* Password strength hint */}
        {newPassword.length > 0 && (
          <View style={{ flexDirection: "row", gap: 6, marginTop: -8, marginBottom: 20 }}>
            {[1, 2, 3, 4].map(level => {
              const strength = Math.min(
                Math.floor(newPassword.length / 3) +
                (/[A-Z]/.test(newPassword) ? 1 : 0) +
                (/[0-9]/.test(newPassword) ? 1 : 0) +
                (/[^A-Za-z0-9]/.test(newPassword) ? 1 : 0),
                4
              );
              const active = level <= strength;
              const barColor = strength <= 1 ? RED : strength === 2 ? "#F38744" : strength === 3 ? "#F5C518" : "#45B369";
              return (
                <View
                  key={level}
                  style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: active ? barColor : c.border }}
                />
              );
            })}
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: MUTED, alignSelf: "center", marginLeft: 4 }}>
              {(() => {
                const s = Math.min(
                  Math.floor(newPassword.length / 3) +
                  (/[A-Z]/.test(newPassword) ? 1 : 0) +
                  (/[0-9]/.test(newPassword) ? 1 : 0) +
                  (/[^A-Za-z0-9]/.test(newPassword) ? 1 : 0),
                  4
                );
                return ["Weak", "Weak", "Fair", "Good", "Strong"][s] ?? "";
              })()}
            </Text>
          </View>
        )}

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: c.border, marginBottom: 28 }} />

        {/* PIN section */}
        <SectionHeader icon={<PinIcon />} title="Change PIN" />

        <PasswordField
          label="Current PIN"
          value={currentPin}
          onChangeText={setCurrentPin}
          placeholder="Enter current PIN"
          numeric
          maxLength={6}
          c={c}
        />
        <PasswordField
          label="New PIN"
          value={newPin}
          onChangeText={setNewPin}
          placeholder="4–6 digits"
          numeric
          maxLength={6}
          c={c}
        />
        <PasswordField
          label="Confirm New PIN"
          value={confirmPin}
          onChangeText={setConfirmPin}
          placeholder="Repeat new PIN"
          numeric
          maxLength={6}
          c={c}
        />
      </ScrollView>

      {/* Save button */}
      <View style={{
        paddingHorizontal: 24, paddingTop: 12,
        paddingBottom: insets.bottom + 16,
        borderTopWidth: 1, borderTopColor: c.border,
        backgroundColor: c.background,
      }}>
        <TouchableOpacity
          style={{ backgroundColor: TEAL, borderRadius: 14, paddingVertical: 16, alignItems: "center" }}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: WHITE }}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

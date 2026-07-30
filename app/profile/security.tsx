/**
 * Security screen — production-grade password and PIN management.
 *
 * Password rules (enforced client + server):
 *   - Minimum 8 characters
 *   - Must contain uppercase, lowercase, digit, and special character
 *
 * PIN rules:
 *   - 4–6 digits only
 *
 * API:
 *   POST /auth/change-password  { currentPassword, newPassword }
 *   POST /auth/pin/change       { currentPin, newPin }
 */
import { guardedBack } from "@/utils/navigation";
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { useColors } from "@/hooks/useColors";
import { authApi } from "../../services/api";

const TEAL  = "#164951";
const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";
const RED   = "#EF4770";
const AMBER = "#F38744";

// ── Validation ────────────────────────────────────────────────────────────────

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;

function getPasswordStrength(pw: string): number {
  if (!pw) return 0;
  let score = Math.floor(pw.length / 3);
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

function strengthLabel(s: number) {
  return ["", "Weak", "Fair", "Good", "Strong"][s] ?? "";
}

function strengthColor(s: number) {
  return s <= 1 ? RED : s === 2 ? AMBER : s === 3 ? "#F5C518" : GREEN;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

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
      <Path d="M12 3L4 6.5V11C4 15.25 7.4 19.24 12 21C16.6 19.24 20 15.25 20 11V6.5L12 3Z"
        stroke={TEAL} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
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
      <Path d="M9 9h.01M12 9h.01M15 9h.01M9 12h.01M12 12h.01M15 12h.01M9 15h.01M12 15h.01M15 15h.01"
        stroke={TEAL} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={GREEN} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Password field ────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  numeric?: boolean;
  maxLength?: number;
  error?: string;
  c: ReturnType<typeof useColors>;
}

function PasswordField({ label, value, onChangeText, placeholder, numeric = false, maxLength, error, c }: FieldProps) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  return (
    <View style={{ marginBottom: error ? 8 : 20 }}>
      <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 14, color: c.text, marginBottom: 8 }}>
        {label}
      </Text>
      <View style={{
        backgroundColor: focused ? c.background : c.card,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: error ? RED : focused ? TEAL : c.border,
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
      {error ? (
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: RED, marginTop: 6, marginLeft: 4 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16, marginTop: 8 }}>
      {icon}
      <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: TEAL }}>{title}</Text>
    </View>
  );
}

function SuccessBanner({ message }: { message: string }) {
  return (
    <View style={{
      flexDirection: "row", alignItems: "center", gap: 8,
      backgroundColor: "#F0FDF4", borderRadius: 10,
      borderWidth: 1, borderColor: "#86EFAC",
      padding: 12, marginBottom: 20,
    }}>
      <CheckIcon />
      <Text style={{ flex: 1, fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: "#166534" }}>
        {message}
      </Text>
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
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwErrors,        setPwErrors]        = useState<Record<string, string>>({});
  const [pwLoading,       setPwLoading]       = useState(false);
  const [pwSuccess,       setPwSuccess]       = useState(false);

  // PIN state
  const [currentPin,  setCurrentPin]  = useState("");
  const [newPin,      setNewPin]      = useState("");
  const [confirmPin,  setConfirmPin]  = useState("");
  const [pinErrors,   setPinErrors]   = useState<Record<string, string>>({});
  const [pinLoading,  setPinLoading]  = useState(false);
  const [pinSuccess,  setPinSuccess]  = useState(false);

  const pwStrength = getPasswordStrength(newPassword);

  // ── Password requirements display ────────────────────────────────────────────
  const pwRequirements = newPassword.length > 0 ? [
    { met: newPassword.length >= 8,            label: "At least 8 characters" },
    { met: /[A-Z]/.test(newPassword),          label: "One uppercase letter" },
    { met: /[a-z]/.test(newPassword),          label: "One lowercase letter" },
    { met: /\d/.test(newPassword),             label: "One number" },
    { met: /[^A-Za-z0-9]/.test(newPassword),  label: "One special character" },
  ] : [];

  // ── Change password ───────────────────────────────────────────────────────────
  const handleChangePassword = useCallback(async () => {
    const errors: Record<string, string> = {};

    if (!currentPassword) errors.currentPassword = "Enter your current password";
    if (!newPassword)     errors.newPassword     = "Enter a new password";
    else if (!PASSWORD_REGEX.test(newPassword))
      errors.newPassword = "Must have uppercase, lowercase, digit and special character";
    if (!confirmPassword) errors.confirmPassword = "Confirm your new password";
    else if (newPassword !== confirmPassword)
      errors.confirmPassword = "Passwords do not match";
    if (newPassword === currentPassword && newPassword)
      errors.newPassword = "New password must be different from your current password";

    if (Object.keys(errors).length > 0) {
      setPwErrors(errors);
      return;
    }

    setPwErrors({});
    setPwLoading(true);
    setPwSuccess(false);

    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const msg = typeof err?.message === "string"
        ? err.message
        : "Failed to change password. Please check your current password and try again.";
      // Show inline error if it's about current password
      if (msg.toLowerCase().includes("incorrect") || msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("wrong")) {
        setPwErrors({ currentPassword: "Incorrect current password" });
      } else {
        Alert.alert("Error", msg);
      }
    } finally {
      setPwLoading(false);
    }
  }, [currentPassword, newPassword, confirmPassword]);

  // ── Change PIN ────────────────────────────────────────────────────────────────
  const handleChangePin = useCallback(async () => {
    const errors: Record<string, string> = {};

    if (!currentPin)                          errors.currentPin  = "Enter your current PIN";
    if (!newPin)                              errors.newPin      = "Enter a new PIN";
    else if (!/^\d{4,6}$/.test(newPin))      errors.newPin      = "PIN must be 4–6 digits";
    if (!confirmPin)                          errors.confirmPin  = "Confirm your new PIN";
    else if (newPin !== confirmPin)           errors.confirmPin  = "PINs do not match";
    if (newPin === currentPin && newPin)      errors.newPin      = "New PIN must differ from current PIN";

    if (Object.keys(errors).length > 0) {
      setPinErrors(errors);
      return;
    }

    setPinErrors({});
    setPinLoading(true);
    setPinSuccess(false);

    try {
      await authApi.changePin(currentPin, newPin);
      setPinSuccess(true);
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
    } catch (err: any) {
      const msg = typeof err?.message === "string"
        ? err.message
        : "Failed to change PIN. Please check your current PIN and try again.";
      if (msg.toLowerCase().includes("incorrect") || msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("wrong")) {
        setPinErrors({ currentPin: "Incorrect current PIN" });
      } else {
        Alert.alert("Error", msg);
      }
    } finally {
      setPinLoading(false);
    }
  }, [currentPin, newPin, confirmPin]);

  const anyLoading = pwLoading || pinLoading;

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
          disabled={anyLoading}
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
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: `${TEAL}12`, alignItems: "center", justifyContent: "center" }}>
            <ShieldIcon />
          </View>
          <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: MUTED, marginTop: 10, textAlign: "center" }}>
            Keep your account safe by using a{"\n"}strong password and a secure PIN.
          </Text>
        </View>

        <View style={{ height: 1, backgroundColor: c.border, marginBottom: 28 }} />

        {/* ── Password section ──────────────────────────────────────────── */}
        <SectionHeader icon={<LockIcon />} title="Change Password" />

        {pwSuccess && <SuccessBanner message="Password changed successfully!" />}

        <PasswordField
          label="Current Password"
          value={currentPassword}
          onChangeText={t => { setCurrentPassword(t); setPwErrors(e => ({ ...e, currentPassword: "" })); setPwSuccess(false); }}
          placeholder="Enter current password"
          error={pwErrors.currentPassword}
          c={c}
        />
        <PasswordField
          label="New Password"
          value={newPassword}
          onChangeText={t => { setNewPassword(t); setPwErrors(e => ({ ...e, newPassword: "" })); setPwSuccess(false); }}
          placeholder="Min 8 chars, uppercase, number, symbol"
          error={pwErrors.newPassword}
          c={c}
        />
        <PasswordField
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={t => { setConfirmPassword(t); setPwErrors(e => ({ ...e, confirmPassword: "" })); setPwSuccess(false); }}
          placeholder="Repeat new password"
          error={pwErrors.confirmPassword}
          c={c}
        />

        {/* Strength bar */}
        {newPassword.length > 0 && (
          <View style={{ marginTop: -4, marginBottom: 16 }}>
            <View style={{ flexDirection: "row", gap: 4, marginBottom: 8 }}>
              {[1, 2, 3, 4].map(l => (
                <View key={l} style={{
                  flex: 1, height: 4, borderRadius: 2,
                  backgroundColor: l <= pwStrength ? strengthColor(pwStrength) : c.border,
                }} />
              ))}
              <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: MUTED, alignSelf: "center", marginLeft: 6, width: 40 }}>
                {strengthLabel(pwStrength)}
              </Text>
            </View>
            {/* Requirements checklist */}
            <View style={{ gap: 4 }}>
              {pwRequirements.map(r => (
                <View key={r.label} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={{
                    width: 14, height: 14, borderRadius: 7,
                    backgroundColor: r.met ? "#F0FDF4" : c.card,
                    borderWidth: 1, borderColor: r.met ? GREEN : c.border,
                    alignItems: "center", justifyContent: "center",
                  }}>
                    {r.met && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN }} />}
                  </View>
                  <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: r.met ? GREEN : MUTED }}>
                    {r.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={{
            backgroundColor: TEAL, borderRadius: 12, paddingVertical: 15,
            alignItems: "center", marginBottom: 32,
            opacity: pwLoading ? 0.7 : 1,
          }}
          onPress={handleChangePassword}
          disabled={pwLoading || pinLoading}
          activeOpacity={0.85}
        >
          {pwLoading
            ? <ActivityIndicator color={WHITE} />
            : <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: WHITE }}>Update Password</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 1, backgroundColor: c.border, marginBottom: 28 }} />

        {/* ── PIN section ───────────────────────────────────────────────── */}
        <SectionHeader icon={<PinIcon />} title="Change PIN" />

        {pinSuccess && <SuccessBanner message="PIN changed successfully!" />}

        <PasswordField
          label="Current PIN"
          value={currentPin}
          onChangeText={t => { setCurrentPin(t); setPinErrors(e => ({ ...e, currentPin: "" })); setPinSuccess(false); }}
          placeholder="Enter current PIN"
          numeric
          maxLength={6}
          error={pinErrors.currentPin}
          c={c}
        />
        <PasswordField
          label="New PIN"
          value={newPin}
          onChangeText={t => { setNewPin(t); setPinErrors(e => ({ ...e, newPin: "" })); setPinSuccess(false); }}
          placeholder="4–6 digits"
          numeric
          maxLength={6}
          error={pinErrors.newPin}
          c={c}
        />
        <PasswordField
          label="Confirm New PIN"
          value={confirmPin}
          onChangeText={t => { setConfirmPin(t); setPinErrors(e => ({ ...e, confirmPin: "" })); setPinSuccess(false); }}
          placeholder="Repeat new PIN"
          numeric
          maxLength={6}
          error={pinErrors.confirmPin}
          c={c}
        />

        <TouchableOpacity
          style={{
            backgroundColor: TEAL, borderRadius: 12, paddingVertical: 15,
            alignItems: "center",
            opacity: pinLoading ? 0.7 : 1,
          }}
          onPress={handleChangePin}
          disabled={pinLoading || pwLoading}
          activeOpacity={0.85}
        >
          {pinLoading
            ? <ActivityIndicator color={WHITE} />
            : <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: WHITE }}>Update PIN</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

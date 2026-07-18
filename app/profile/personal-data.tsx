import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { useAuth } from "../../services/auth-context";

const TEAL = "#164951";
const GREEN_AVATAR = "#8FD1A5";
const WHITE = "#FFFFFF";
const DARK = "#111827";
const MUTED = "#9CA3AF";
const DIVIDER = "#EBECEF";
const FIELD_BG = "#F9FAFB";
const FIELD_BORDER = "#F3F4F6";
const FIELD_ACTIVE_BORDER = TEAL;

const { width: SCREEN_W } = Dimensions.get("window");

function BackIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={DARK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function EditPencilIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path d="M11.5 2a1.5 1.5 0 0 1 2.121 2.121L4.5 13.243 2 14l.757-2.5L11.5 2z" stroke={WHITE} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AvatarFigure() {
  const size = 88;
  const r = size / 2;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={r} cy={r} r={r} fill={GREEN_AVATAR} />
      <Circle cx={r} cy={r * 0.78} r={r * 0.35} fill="#C2837B" />
      <Path
        d={`M${r * 0.3} ${size - 2} Q${r} ${r * 1.38} ${r * 1.7} ${size - 2}`}
        fill="#9E7D84"
      />
      <Path
        d={`M${r * 0.38} ${r * 0.52} Q${r} ${r * 0.2} ${r * 1.62} ${r * 0.52}`}
        fill="#AC7080"
        stroke="#AC7080"
        strokeWidth={r * 0.18}
      />
    </Svg>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "words" | "sentences";
  editable?: boolean;
}

function FormField({ label, value, onChangeText, placeholder, keyboardType = "default", autoCapitalize = "words", editable = true }: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={[fieldStyles.field, focused && fieldStyles.fieldFocused, !editable && fieldStyles.fieldDisabled]}>
        <TextInput
          style={[fieldStyles.input, !editable && fieldStyles.inputDisabled]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={MUTED}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  label: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 14,
    color: DARK,
    marginBottom: 8,
  },
  field: {
    backgroundColor: FIELD_BG,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: FIELD_BORDER,
    height: 56,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  fieldFocused: {
    borderColor: FIELD_ACTIVE_BORDER,
    backgroundColor: WHITE,
  },
  fieldDisabled: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
  },
  input: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 15,
    color: DARK,
    padding: 0,
  },
  inputDisabled: {
    color: MUTED,
  },
});

export default function PersonalDataScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;
  const { user } = useAuth();

  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "—";
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: topPad }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Data</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <AvatarFigure />
            <View style={styles.avatarEditBadge}>
              <EditPencilIcon />
            </View>
          </View>
        </View>

        {/* Form fields */}
        <FormField
          label="Full Name"
          value={fullName}
          onChangeText={() => {}}
          placeholder=""
          autoCapitalize="words"
          editable={false}
        />
        <FormField
          label="Phone Number"
          value={phone}
          onChangeText={setPhone}
          placeholder="+265 XXX XXX XXX"
          keyboardType="phone-pad"
          autoCapitalize="none"
        />
        <FormField
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          placeholder="email@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </ScrollView>

      {/* Save button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.saveBtn} onPress={() => router.back()}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WHITE },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    flex: 1,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 17,
    color: DARK,
    textAlign: "center",
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  /* Avatar section (Design 49: centered 88x88 at top of content) */
  avatarSection: {
    alignItems: "center",
    marginBottom: 36,
    marginTop: 8,
  },
  avatarWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: "visible",
    position: "relative",
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: TEAL,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: WHITE,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: DIVIDER,
    backgroundColor: WHITE,
  },
  saveBtn: {
    backgroundColor: TEAL,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: WHITE,
  },
});

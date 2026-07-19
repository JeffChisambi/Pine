import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { useAuth } from "../../services/auth-context";
import { useColors } from "@/hooks/useColors";

const TEAL = "#164951";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";

function EditPencilIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path d="M11.5 2a1.5 1.5 0 0 1 2.121 2.121L4.5 13.243 2 14l.757-2.5L11.5 2z" stroke={WHITE} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AvatarFigure() {
  return (
    <Svg width={88} height={88} viewBox="0 0 24 24" fill="none">
      <Path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z" stroke="#9CA3AF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 20C4 17.33 7.58 15 12 15C16.42 15 20 17.33 20 20" stroke="#9CA3AF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
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
  c: ReturnType<typeof useColors>;
}

function FormField({ label, value, onChangeText, placeholder, keyboardType = "default", autoCapitalize = "words", editable = true, c }: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 14, color: c.text, marginBottom: 8 }}>{label}</Text>
      <View style={{
        backgroundColor: editable ? (focused ? c.background : c.card) : c.card,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: focused ? TEAL : c.border,
        height: 56,
        paddingHorizontal: 16,
        justifyContent: "center",
        opacity: editable ? 1 : 0.6,
      }}>
        <TextInput
          style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: editable ? c.text : MUTED, padding: 0 }}
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

export default function PersonalDataScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;
  const { user } = useAuth();
  const c = useColors();

  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "—";
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.background, paddingTop: topPad }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M15 18l-6-6 6-6" stroke={c.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={{ flex: 1, fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: c.text, textAlign: "center" }}>Personal Data</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={{ alignItems: "center", marginBottom: 36, marginTop: 8 }}>
          <View style={{ width: 88, height: 88, borderRadius: 44, overflow: "visible", position: "relative", backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" }}>
            <AvatarFigure />
            <View style={{ position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: TEAL, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: c.background }}>
              <EditPencilIcon />
            </View>
          </View>
        </View>

        <FormField label="Full Name" value={fullName} onChangeText={() => {}} placeholder="" autoCapitalize="words" editable={false} c={c} />
        <FormField label="Phone Number" value={phone} onChangeText={setPhone} placeholder="+265 XXX XXX XXX" keyboardType="phone-pad" autoCapitalize="none" c={c} />
        <FormField label="Email Address" value={email} onChangeText={setEmail} placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" c={c} />
      </ScrollView>

      {/* Save button */}
      <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: insets.bottom + 16, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.background }}>
        <TouchableOpacity style={{ backgroundColor: TEAL, borderRadius: 14, paddingVertical: 16, alignItems: "center" }} onPress={() => router.back()}>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: WHITE }}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

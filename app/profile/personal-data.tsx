import { guardedBack } from "@/utils/navigation";
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useAuth } from "../../services/auth-context";
import { useColors } from "@/hooks/useColors";

const MUTED = "#9CA3AF";

function AvatarFigure() {
  return (
    <Svg width={88} height={88} viewBox="0 0 24 24" fill="none">
      <Path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z" stroke="#9CA3AF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 20C4 17.33 7.58 15 12 15C16.42 15 20 17.33 20 20" stroke="#9CA3AF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReadOnlyField({ label, value, c }: { label: string; value: string; c: ReturnType<typeof useColors> }) {
  return (
    <View style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border }}>
      <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED, marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 15, color: c.text }}>{value}</Text>
    </View>
  );
}

function formatDob(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function formatGender(g: string | null | undefined): string {
  if (!g) return "—";
  if (g === "M") return "Male";
  if (g === "F") return "Female";
  return g;
}

function formatMemberSince(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export default function PersonalDataScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 16;
  const { user } = useAuth();
  const c = useColors();

  return (
    <View style={{ flex: 1, backgroundColor: c.background, paddingTop: topPad }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => guardedBack("/(tabs)/profile")} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M15 19l-7-7 7-7" stroke={c.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={{ flex: 1, fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: c.text, textAlign: "center" }}>Personal Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={{ alignItems: "center", marginBottom: 32, marginTop: 8 }}>
          <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center" }}>
            <AvatarFigure />
          </View>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text, marginTop: 12 }}>
            {`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "—"}
          </Text>
        </View>

        <ReadOnlyField label="First Name" value={user?.firstName ?? "—"} c={c} />
        <ReadOnlyField label="Last Name" value={user?.lastName ?? "—"} c={c} />
        <ReadOnlyField label="Email Address" value={user?.email ?? "—"} c={c} />
        <ReadOnlyField label="Phone Number" value={user?.phone ?? "—"} c={c} />
        <ReadOnlyField label="Date of Birth" value={formatDob(user?.dateOfBirth)} c={c} />
        <ReadOnlyField label="Gender" value={formatGender(user?.gender)} c={c} />
        <ReadOnlyField label="Member Since" value={formatMemberSince(user?.createdAt)} c={c} />
      </ScrollView>
    </View>
  );
}

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import Constants from "expo-constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/contexts/theme-context";
import { useAuth } from "@/services/auth-context";
import { guardedBack } from "@/utils/navigation";
import PinVerifyModal from "@/components/PinVerifyModal";
import { accountApi, getErrorMessage, logHandledError } from "@/services/api";

const TEAL = "#164951";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";
const RED = "#EF4770";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 16;
  const c = useColors();
  const { isDark, toggleTheme } = useTheme();
  const { logout } = useAuth();

  const [showPin, setShowPin] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const appVersion = (Constants.expoConfig as any)?.version ?? "1.0.0";

  const confirmDelete = () => {
    Alert.alert(
      "Delete account?",
      "This closes your account and removes your personal data. Your transaction history is retained for legal and compliance reasons. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => setShowPin(true) },
      ],
    );
  };

  const runDelete = async (pinToken: string) => {
    setShowPin(false);
    setDeleting(true);
    try {
      await accountApi.deleteAccount(pinToken);
      await logout();
      router.replace("/login");
      setTimeout(() => Alert.alert("Account closed", "Your account has been closed and your personal data removed."), 300);
    } catch (err) {
      logHandledError("Delete account", err);
      Alert.alert("Couldn't delete account", getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background, paddingTop: topPad }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 8, gap: 6 }}>
        <TouchableOpacity onPress={() => guardedBack("/(tabs)/profile")} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <Feather name="chevron-left" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 20, color: c.text }}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {/* Preferences */}
        <Label c={c}>PREFERENCES</Label>
        <Group c={c}>
          <Row c={c} icon="moon" title="Dark Mode" sub="Switch app appearance"
            right={<Switch value={isDark} onValueChange={toggleTheme} trackColor={{ true: TEAL, false: "#D1D5DB" }} thumbColor={WHITE} />} />
          <Divider c={c} />
          <Row c={c} icon="bell" title="Notifications" sub="Manage notification preferences"
            onPress={() => router.push("/profile/push-notifications" as any)} chevron />
        </Group>

        {/* Account */}
        <Label c={c}>ACCOUNT</Label>
        <Group c={c}>
          <Row c={c} icon="user" title="Personal Data" sub="Name, email, address"
            onPress={() => router.push("/profile/personal-data" as any)} chevron />
          <Divider c={c} />
          <Row c={c} icon="lock" title="Security" sub="Password & PIN"
            onPress={() => router.push("/profile/security" as any)} chevron />
          <Divider c={c} />
          <Row c={c} icon="help-circle" title="Help & Support" sub="Get help, contact us"
            onPress={() => router.push("/help" as any)} chevron />
        </Group>

        {/* About */}
        <Label c={c}>ABOUT</Label>
        <Group c={c}>
          <Row c={c} icon="info" title="App Version" sub={String(appVersion)} />
        </Group>

        {/* Danger zone */}
        <Label c={c}>DANGER ZONE</Label>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={confirmDelete}
          disabled={deleting}
          style={{
            flexDirection: "row", alignItems: "center", gap: 14,
            borderWidth: 1, borderColor: "#FCA5A5",
            backgroundColor: isDark ? "rgba(239,71,112,0.12)" : "#FFF1F2",
            borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16,
          }}
        >
          <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: "rgba(239,71,112,0.15)", alignItems: "center", justifyContent: "center" }}>
            {deleting ? <ActivityIndicator color={RED} size="small" /> : <Feather name="trash-2" size={18} color={RED} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: RED }}>Delete Account</Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED, marginTop: 2 }}>
              Close your account and remove personal data
            </Text>
          </View>
        </TouchableOpacity>
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED, lineHeight: 18, marginTop: 10, paddingHorizontal: 4 }}>
          Deleting your account permanently disables sign-in and anonymizes your personal data. Financial and compliance records are retained as required by law.
        </Text>
      </ScrollView>

      <PinVerifyModal
        visible={showPin}
        title="Confirm account deletion"
        subtitle="Enter your PIN to permanently close your account"
        onVerified={runDelete}
        onCancel={() => setShowPin(false)}
      />
    </View>
  );
}

function Label({ children, c }: { children: React.ReactNode; c: ReturnType<typeof useColors> }) {
  return <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 12, letterSpacing: 0.5, color: MUTED, marginTop: 22, marginBottom: 10 }}>{children}</Text>;
}

function Group({ children, c }: { children: React.ReactNode; c: ReturnType<typeof useColors> }) {
  return <View style={{ backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 16, overflow: "hidden" }}>{children}</View>;
}

function Divider({ c }: { c: ReturnType<typeof useColors> }) {
  return <View style={{ height: 1, backgroundColor: c.border, marginLeft: 16 }} />;
}

function Row({ c, icon, title, sub, right, chevron, onPress }: {
  c: ReturnType<typeof useColors>; icon: any; title: string; sub: string;
  right?: React.ReactNode; chevron?: boolean; onPress?: () => void;
}) {
  const Container: any = onPress ? TouchableOpacity : View;
  return (
    <Container activeOpacity={0.7} onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14 }}>
      <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: c.muted, alignItems: "center", justifyContent: "center" }}>
        <Feather name={icon} size={18} color={c.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: c.text }}>{title}</Text>
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED, marginTop: 2 }}>{sub}</Text>
      </View>
      {right ?? (chevron ? <Feather name="chevron-right" size={18} color={MUTED} /> : null)}
    </Container>
  );
}

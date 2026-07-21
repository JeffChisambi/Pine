import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { notificationsApi, type NotificationPreferences } from "../../services/api";
import { useColors } from "@/hooks/useColors";

const TEAL = "#164951";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";

function CustomToggle({ value, onChange, disabled }: { value: boolean; onChange: () => void; disabled?: boolean }) {
  const TRACK_W = 50;
  const TRACK_H = 30;
  const THUMB_SIZE = 26;
  const THUMB_MARGIN = 2;
  const translateX = value ? TRACK_W - THUMB_SIZE - THUMB_MARGIN : THUMB_MARGIN;

  return (
    <TouchableOpacity onPress={onChange} activeOpacity={disabled ? 1 : 0.85} disabled={disabled}>
      <View style={{ width: TRACK_W, height: TRACK_H, borderRadius: TRACK_H / 2, backgroundColor: value ? TEAL : "#EBECEF", justifyContent: "center", overflow: "hidden", opacity: disabled ? 0.5 : 1 }}>
        <View style={{ width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: THUMB_SIZE / 2, backgroundColor: WHITE, transform: [{ translateX }], alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: value ? TEAL : "#EBECEF", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}>
          {value ? (
            <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
              <Path d="M3 7l3 3 5-5" stroke={TEAL} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          ) : (
            <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
              <Path d="M4 4l6 6M10 4L4 10" stroke={MUTED} strokeWidth={1.4} strokeLinecap="round" />
            </Svg>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const CATEGORY_CONFIG: Record<string, { label: string; description: string }> = {
  SECURITY:  { label: "Security Alerts",   description: "Login, password & security events" },
  TRADING:   { label: "Trading",           description: "Order executions, rejections & settlements" },
  PORTFOLIO: { label: "Portfolio",         description: "Holdings updates & dividends" },
  WALLET:    { label: "Wallet",            description: "Deposits, withdrawals & balance changes" },
  KYC:       { label: "KYC Verification",  description: "Identity verification status updates" },
  MARKET:    { label: "Market Updates",    description: "Price alerts & market movements" },
  SYSTEM:    { label: "System",            description: "App updates & maintenance notices" },
  MARKETING: { label: "Marketing & News",  description: "Promotions, tips & newsletters" },
};

const CHANNEL_LABELS = {
  push:  "Push Notifications",
  email: "Email",
  sms:   "SMS",
} as const;

type ChannelKey = keyof typeof CHANNEL_LABELS;

export default function PushNotificationsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;
  const c = useColors();

  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    notificationsApi.getPreferences()
      .then((prefs) => setPreferences(prefs))
      .catch(() => {
        setPreferences({
          SECURITY:  { push: true,  email: true,  sms: false, inApp: true },
          TRADING:   { push: true,  email: true,  sms: false, inApp: true },
          PORTFOLIO: { push: true,  email: true,  sms: false, inApp: true },
          WALLET:    { push: true,  email: true,  sms: false, inApp: true },
          KYC:       { push: true,  email: true,  sms: false, inApp: true },
          MARKET:    { push: true,  email: false, sms: false, inApp: true },
          SYSTEM:    { push: true,  email: false, sms: false, inApp: true },
          MARKETING: { push: false, email: true,  sms: false, inApp: true },
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const togglePref = async (category: string, channel: ChannelKey) => {
    if (!preferences || category === "SECURITY") return;
    const current = preferences[category]?.[channel] ?? false;
    const newValue = !current;
    setPreferences((prev) => prev ? { ...prev, [category]: { ...prev[category], [channel]: newValue } } : prev);
    setSaving(`${category}-${channel}`);
    try {
      await notificationsApi.updatePreference(category, { [channel]: newValue });
    } catch {
      setPreferences((prev) => prev ? { ...prev, [category]: { ...prev[category], [channel]: current } } : prev);
    } finally {
      setSaving(null);
    }
  };

  const categories = Object.keys(CATEGORY_CONFIG);

  return (
    <View style={{ flex: 1, backgroundColor: c.background, paddingTop: topPad }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M15 19l-7-7 7-7" stroke={c.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={{ flex: 1, fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: c.text, textAlign: "center" }}>Notification Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={TEAL} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED, marginBottom: 20, lineHeight: 19 }}>
            Choose how you want to be notified for each category. Security alerts cannot be disabled.
          </Text>

          {categories.map((category) => {
            const config = CATEGORY_CONFIG[category];
            const prefs = preferences?.[category];
            const isMandatory = category === "SECURITY";

            return (
              <View key={category} style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: c.text }}>{config?.label ?? category}</Text>
                  {isMandatory && (
                    <View style={{ backgroundColor: "#F0FDF4", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 11, color: "#166534" }}>Always on</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED, marginBottom: 10 }}>{config?.description ?? ""}</Text>

                <View style={{ backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, overflow: "hidden" }}>
                  {(Object.keys(CHANNEL_LABELS) as ChannelKey[]).map((channel, i) => (
                    <View key={channel}>
                      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 14, color: c.text }}>{CHANNEL_LABELS[channel]}</Text>
                        </View>
                        <CustomToggle value={prefs?.[channel] ?? false} onChange={() => togglePref(category, channel)} disabled={isMandatory} />
                      </View>
                      {i < Object.keys(CHANNEL_LABELS).length - 1 && <View style={{ height: 1, backgroundColor: c.border, marginHorizontal: 16 }} />}
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

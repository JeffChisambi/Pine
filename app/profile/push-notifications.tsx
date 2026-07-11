import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { notificationsApi, type NotificationPreferences } from "../../services/api";

const TEAL = "#164951";
const WHITE = "#FFFFFF";
const DARK = "#111827";
const MUTED = "#9CA3AF";
const DIVIDER = "#EBECEF";
const TRACK_OFF = "#EBECEF";
const THUMB_OFF_STROKE = "#EBECEF";
const RED = "#EF4770";

function BackIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={DARK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/* ── Custom toggle matching the design ── */
function CustomToggle({ value, onChange, disabled }: { value: boolean; onChange: () => void; disabled?: boolean }) {
  const TRACK_W = 50;
  const TRACK_H = 30;
  const THUMB_SIZE = 26;
  const THUMB_MARGIN = 2;
  const translateX = value ? TRACK_W - THUMB_SIZE - THUMB_MARGIN : THUMB_MARGIN;

  return (
    <TouchableOpacity onPress={onChange} activeOpacity={disabled ? 1 : 0.85} disabled={disabled}>
      <View
        style={[
          toggleStyles.track,
          {
            width: TRACK_W,
            height: TRACK_H,
            borderRadius: TRACK_H / 2,
            backgroundColor: value ? TEAL : TRACK_OFF,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <View
          style={[
            toggleStyles.thumb,
            {
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: THUMB_SIZE / 2,
              transform: [{ translateX }],
              borderColor: value ? TEAL : THUMB_OFF_STROKE,
            },
          ]}
        >
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

const toggleStyles = StyleSheet.create({
  track: {
    justifyContent: "center",
    overflow: "hidden",
  },
  thumb: {
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});

/** Category display config */
const CATEGORY_CONFIG: Record<string, { label: string; description: string }> = {
  SECURITY:  { label: "Security Alerts",     description: "Login, password & security events" },
  TRADING:   { label: "Trading",             description: "Order executions, rejections & settlements" },
  PORTFOLIO: { label: "Portfolio",           description: "Holdings updates & dividends" },
  WALLET:    { label: "Wallet",              description: "Deposits, withdrawals & balance changes" },
  KYC:       { label: "KYC Verification",    description: "Identity verification status updates" },
  MARKET:    { label: "Market Updates",      description: "Price alerts & market movements" },
  SYSTEM:    { label: "System",              description: "App updates & maintenance notices" },
  MARKETING: { label: "Marketing & News",    description: "Promotions, tips & newsletters" },
};

/** Channel labels */
const CHANNEL_LABELS = {
  push:  "Push Notifications",
  email: "Email",
  sms:   "SMS",
} as const;

type ChannelKey = keyof typeof CHANNEL_LABELS;

export default function PushNotificationsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;

  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    notificationsApi.getPreferences()
      .then((prefs) => setPreferences(prefs))
      .catch(() => {
        // Provide defaults if API fails
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

    // Optimistic update
    setPreferences((prev) => prev ? {
      ...prev,
      [category]: { ...prev[category], [channel]: newValue },
    } : prev);

    setSaving(`${category}-${channel}`);
    try {
      await notificationsApi.updatePreference(category, { [channel]: newValue });
    } catch {
      // Revert on error
      setPreferences((prev) => prev ? {
        ...prev,
        [category]: { ...prev[category], [channel]: current },
      } : prev);
    } finally {
      setSaving(null);
    }
  };

  const categories = Object.keys(CATEGORY_CONFIG);

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={TEAL} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.pageDescription}>
            Choose how you want to be notified for each category. Security alerts cannot be disabled.
          </Text>

          {categories.map((category) => {
            const config = CATEGORY_CONFIG[category];
            const prefs = preferences?.[category];
            const isMandatory = category === "SECURITY";

            return (
              <View key={category} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryLabel}>{config?.label ?? category}</Text>
                  {isMandatory && (
                    <View style={styles.mandatoryBadge}>
                      <Text style={styles.mandatoryText}>Always on</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.categoryDesc}>{config?.description ?? ""}</Text>

                <View style={styles.card}>
                  {(Object.keys(CHANNEL_LABELS) as ChannelKey[]).map((channel, i) => (
                    <View key={channel}>
                      <View style={styles.toggleRow}>
                        <View style={styles.toggleTextBlock}>
                          <Text style={styles.toggleLabel}>{CHANNEL_LABELS[channel]}</Text>
                        </View>
                        <CustomToggle
                          value={prefs?.[channel] ?? false}
                          onChange={() => togglePref(category, channel)}
                          disabled={isMandatory}
                        />
                      </View>
                      {i < Object.keys(CHANNEL_LABELS).length - 1 && <View style={styles.itemDivider} />}
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
    fontFamily: "Poppins_600SemiBold",
    fontSize: 17,
    color: DARK,
    textAlign: "center",
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  pageDescription: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: MUTED,
    marginBottom: 20,
    lineHeight: 19,
  },
  /* Category section */
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  categoryLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: DARK,
  },
  mandatoryBadge: {
    backgroundColor: "#F0FDF4",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  mandatoryText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: "#166534",
  },
  categoryDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: MUTED,
    marginBottom: 10,
  },
  /* Toggle card */
  card: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DIVIDER,
    overflow: "hidden",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  toggleTextBlock: { flex: 1 },
  toggleLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: DARK,
  },
  itemDivider: {
    height: 1,
    backgroundColor: DIVIDER,
    marginHorizontal: 16,
  },
});

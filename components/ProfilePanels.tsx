/**
 * ProfilePanels.tsx
 *
 * Contains the three profile sub-screen panels as inline overlay components.
 * Each panel uses the same "card over background" spring animation as the
 * news section's DetailModal — the parent screen stays completely still.
 *
 * Usage in profile.tsx:
 *   {activePanel === 'notifications' && <NotificationsPanel onClose={() => setActivePanel(null)} />}
 */
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  StyleSheet,
  BackHandler,
  Linking,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWindowDimensions } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { useAuth } from "../services/auth-context";
import { notificationsApi, type NotificationPreferences, type Notification } from "../services/api";
import {
  getPushPermissionStatus,
  registerForPushNotificationsAsync,
  type PushPermissionStatus,
} from "../services/push";
import { useColors } from "@/hooks/useColors";

// ─── Shared tokens ────────────────────────────────────────────────────────────
const TEAL   = "#164951";
const GREEN  = "#45B369";
const RED    = "#EF4770";
const ORANGE = "#F38744";
const PURPLE = "#4A4AF4";
const WHITE  = "#FFFFFF";
const MUTED  = "#9CA3AF";
const MUTED2 = "#6B7280";

// ─── Shared back icon ─────────────────────────────────────────────────────────
function BackChevron({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19l-7-7 7-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Shared slide-in wrapper ──────────────────────────────────────────────────
function SlidePanel({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;
  const c = useColors();
  const translateX = useSharedValue(width);

  useEffect(() => {
    translateX.value = withSpring(0, { damping: 22, stiffness: 220, mass: 0.8 });
  }, []);

  const close = useCallback(() => {
    translateX.value = withTiming(width, { duration: 260, easing: Easing.in(Easing.cubic) }, () =>
      runOnJS(onClose)()
    );
  }, [width, onClose]);

  // Android hardware back
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => { close(); return true; });
    return () => sub.remove();
  }, [close]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: c.background, paddingTop: topPad, zIndex: 10 }, animStyle]}>
      {typeof children === "function" ? (children as any)({ close }) : children}
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. NOTIFICATIONS PANEL
// ══════════════════════════════════════════════════════════════════════════════

function getIconForCategory(category: string, c: ReturnType<typeof useColors>) {
  const props = { width: 32, height: 32, viewBox: "0 0 32 32" };
  switch (category?.toUpperCase()) {
    case "TRADING":   return <Svg {...props}><Circle cx={16} cy={16} r={16} fill={GREEN} /><Path d="M10 20l4-4 3 2 5-6" stroke={WHITE} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" /><Path d="M18 12h4v4" stroke={WHITE} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>;
    case "PORTFOLIO": return <Svg {...props}><Circle cx={16} cy={16} r={16} fill={TEAL} /><Path d="M11 22V15l5-4 5 4v7H11z" stroke={WHITE} strokeWidth={1.3} strokeLinejoin="round" fill="none" /></Svg>;
    case "WALLET":    return <Svg {...props}><Circle cx={16} cy={16} r={16} fill={ORANGE} /><Path d="M10 12h12v9H10z" stroke={WHITE} strokeWidth={1.3} fill="none" strokeLinejoin="round" /></Svg>;
    case "SECURITY":  return <Svg {...props}><Circle cx={16} cy={16} r={16} fill={RED} /><Path d="M16 10l5 2.5v4c0 3.5-2.2 6-5 7-2.8-1-5-3.5-5-7v-4L16 10z" stroke={WHITE} strokeWidth={1.3} fill="none" /></Svg>;
    case "KYC":       return <Svg {...props}><Circle cx={16} cy={16} r={16} fill={PURPLE} /></Svg>;
    default:          return <Svg {...props}><Circle cx={16} cy={16} r={16} fill={TEAL} /><Circle cx={16} cy={16} r={5} stroke={WHITE} strokeWidth={1.3} fill="none" /></Svg>;
  }
}

function formatRelativeTime(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  } catch { return ""; }
}

export function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const result = await notificationsApi.list(30);
      setNotifications(result.notifications ?? []);
      setUnreadCount(result.unreadCount ?? 0);
    } catch { /* keep existing */ } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead = async (id: string) => {
    setNotifications(p => p.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
    try { await notificationsApi.markRead(id); } catch { fetchNotifications(); }
  };

  const markAllRead = async () => {
    setNotifications(p => p.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try { await notificationsApi.markAllRead(); } catch { fetchNotifications(); }
  };

  const deleteNotification = async (id: string) => {
    setNotifications(p => p.filter(n => n.id !== id));
    try { await notificationsApi.delete(id); } catch { fetchNotifications(); }
  };

  return (
    <SlidePanel onClose={onClose}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12, gap: 8 }}>
          <TouchableOpacity onPress={onClose} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
            <BackChevron color={c.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 20, color: c.text }}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={{ backgroundColor: RED, borderRadius: 10, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 }}>
                <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 11, color: WHITE }}>{unreadCount}</Text>
              </View>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead} style={{ paddingHorizontal: 6, paddingVertical: 4 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 12, color: TEAL }}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color={TEAL} />
          </View>
        ) : notifications.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 48, gap: 12 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: c.text, marginTop: 8 }}>No notifications yet</Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: MUTED, textAlign: "center" }}>We'll notify you when something important happens</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {notifications.map((item, i) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.75}
                onPress={() => { if (!item.isRead) markRead(item.id); }}
                style={[
                  { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 20, paddingVertical: 14, gap: 14, backgroundColor: item.isRead ? "transparent" : (c.card + "88") },
                  i < notifications.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border },
                ]}
              >
                <View style={{ flexShrink: 0 }}>{getIconForCategory(item.category, c)}</View>
                <View style={{ flex: 1, gap: 3 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "space-between" }}>
                    <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text, flex: 1 }} numberOfLines={1}>{item.title}</Text>
                    <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: MUTED, flexShrink: 0 }}>{formatRelativeTime(item.createdAt)}</Text>
                  </View>
                  <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED2, lineHeight: 19 }} numberOfLines={2}>{item.body}</Text>
                </View>
                {!item.isRead && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN, flexShrink: 0, marginTop: 4 }} />}
              </TouchableOpacity>
            ))}
            <View style={{ height: 32 }} />
          </ScrollView>
        )}
      </View>
    </SlidePanel>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. PERSONAL DATA PANEL
// ══════════════════════════════════════════════════════════════════════════════

function EditPencilIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path d="M11.5 2a1.5 1.5 0 0 1 2.121 2.121L4.5 13.243 2 14l.757-2.5L11.5 2z" stroke={WHITE} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

interface FieldProps {
  label: string; value: string;
  onChangeText: (t: string) => void; placeholder: string;
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
      <View style={{ backgroundColor: editable ? (focused ? c.background : c.card) : c.card, borderRadius: 12, borderWidth: 1.5, borderColor: focused ? TEAL : c.border, height: 56, paddingHorizontal: 16, justifyContent: "center", opacity: editable ? 1 : 0.6 }}>
        <TextInput
          style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: editable ? c.text : MUTED, padding: 0 }}
          value={value} onChangeText={onChangeText} placeholder={placeholder}
          placeholderTextColor={MUTED} keyboardType={keyboardType}
          autoCapitalize={autoCapitalize} editable={editable}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

export function PersonalDataPanel({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const c = useColors();
  const insets = useSafeAreaInsets();

  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "—";
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  return (
    <SlidePanel onClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12 }}>
          <TouchableOpacity onPress={onClose} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
            <BackChevron color={c.text} />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: c.text, textAlign: "center" }}>Personal Data</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <View style={{ alignItems: "center", marginBottom: 36, marginTop: 8 }}>
            <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" }}>
              <Svg width={88} height={88} viewBox="0 0 24 24" fill="none">
                <Path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z" stroke="#9CA3AF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M4 20C4 17.33 7.58 15 12 15C16.42 15 20 17.33 20 20" stroke="#9CA3AF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <View style={{ position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: TEAL, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: c.background }}>
                <EditPencilIcon />
              </View>
            </View>
          </View>

          <FormField label="Full Name" value={fullName} onChangeText={() => {}} placeholder="" autoCapitalize="words" editable={false} c={c} />
          <FormField label="Phone Number" value={phone} onChangeText={setPhone} placeholder="+265 XXX XXX XXX" keyboardType="phone-pad" autoCapitalize="none" c={c} />
          <FormField label="Email Address" value={email} onChangeText={setEmail} placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" c={c} />
        </ScrollView>

        {/* Save */}
        <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: insets.bottom + 16, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.background }}>
          <TouchableOpacity style={{ backgroundColor: TEAL, borderRadius: 14, paddingVertical: 16, alignItems: "center" }} onPress={onClose}>
            <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: WHITE }}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SlidePanel>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. PUSH NOTIFICATIONS PANEL
// ══════════════════════════════════════════════════════════════════════════════

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

const CHANNEL_LABELS = { push: "Push Notifications", email: "Email", sms: "SMS" } as const;
type ChannelKey = keyof typeof CHANNEL_LABELS;

function CustomToggle({ value, onChange, disabled }: { value: boolean; onChange: () => void; disabled?: boolean }) {
  const TW = 50, TH = 30, TS = 26, TM = 2;
  const tx = value ? TW - TS - TM : TM;
  return (
    <TouchableOpacity onPress={onChange} activeOpacity={disabled ? 1 : 0.85} disabled={disabled}>
      <View style={{ width: TW, height: TH, borderRadius: TH / 2, backgroundColor: value ? TEAL : "#EBECEF", justifyContent: "center", overflow: "hidden", opacity: disabled ? 0.5 : 1 }}>
        <View style={{ width: TS, height: TS, borderRadius: TS / 2, backgroundColor: WHITE, transform: [{ translateX: tx }], alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: value ? TEAL : "#EBECEF" }}>
          {value
            ? <Svg width={14} height={14} viewBox="0 0 14 14" fill="none"><Path d="M3 7l3 3 5-5" stroke={TEAL} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" /></Svg>
            : <Svg width={14} height={14} viewBox="0 0 14 14" fill="none"><Path d="M4 4l6 6M10 4L4 10" stroke={MUTED} strokeWidth={1.4} strokeLinecap="round" /></Svg>
          }
        </View>
      </View>
    </TouchableOpacity>
  );
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  SECURITY:  { push: true,  email: true,  sms: false, inApp: true },
  TRADING:   { push: true,  email: true,  sms: false, inApp: true },
  PORTFOLIO: { push: true,  email: true,  sms: false, inApp: true },
  WALLET:    { push: true,  email: true,  sms: false, inApp: true },
  KYC:       { push: true,  email: true,  sms: false, inApp: true },
  MARKET:    { push: true,  email: false, sms: false, inApp: true },
  SYSTEM:    { push: true,  email: false, sms: false, inApp: true },
  MARKETING: { push: false, email: true,  sms: false, inApp: true },
};

// ─── Device push (OS-level) section ───────────────────────────────────────────
function DevicePushSection({ c }: { c: ReturnType<typeof useColors> }) {
  const [status, setStatus] = useState<PushPermissionStatus | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setStatus(await getPushPermissionStatus());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const enable = async () => {
    setBusy(true);
    try {
      const res = await registerForPushNotificationsAsync(true);
      setStatus(res.status);
      // If the OS dialog was previously dismissed as "denied", the only way
      // forward is the system settings screen.
      if (res.status === "denied") Linking.openSettings().catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  // Copy per state.
  const meta = (() => {
    switch (status) {
      case "granted":
        return { dot: GREEN, title: "Push enabled on this device", sub: "You'll receive alerts even when the app is closed.", action: null as null | string };
      case "denied":
        return { dot: RED, title: "Push turned off", sub: "Notifications are blocked in your system settings.", action: "Open Settings" };
      case "undetermined":
        return { dot: ORANGE, title: "Push not set up", sub: "Enable push to get real-time alerts on this device.", action: "Enable Push" };
      case "unavailable":
        return { dot: MUTED, title: "Push unavailable on this build", sub: "Update to the latest app version to enable push notifications.", action: null };
      default:
        return { dot: MUTED, title: "Checking device status…", sub: "", action: null };
    }
  })();

  return (
    <View style={{ backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 24 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: meta.dot }} />
        <Text style={{ flex: 1, fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: c.text }}>{meta.title}</Text>
      </View>
      {!!meta.sub && (
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12.5, color: MUTED, lineHeight: 18, marginTop: 6 }}>{meta.sub}</Text>
      )}
      {meta.action && (
        <TouchableOpacity
          onPress={status === "denied" ? () => Linking.openSettings().catch(() => {}) : enable}
          disabled={busy}
          activeOpacity={0.85}
          style={{ marginTop: 14, backgroundColor: TEAL, borderRadius: 10, paddingVertical: 11, alignItems: "center", justifyContent: "center", opacity: busy ? 0.6 : 1, flexDirection: "row", gap: 8 }}
        >
          {busy && <ActivityIndicator size="small" color={WHITE} />}
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: WHITE }}>{meta.action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function PushNotificationsPanel({ onClose }: { onClose: () => void }) {
  const c = useColors();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    notificationsApi.getPreferences()
      .then(setPreferences)
      .catch(() => setPreferences(DEFAULT_PREFERENCES))
      .finally(() => setLoading(false));
  }, []);

  const setSaving = (key: string, on: boolean) =>
    setSavingKeys(prev => {
      const next = new Set(prev);
      if (on) next.add(key); else next.delete(key);
      return next;
    });

  const togglePref = async (category: string, channel: ChannelKey) => {
    if (!preferences || category === "SECURITY") return;
    const key = `${category}-${channel}`;
    if (savingKeys.has(key)) return; // ignore taps while this row is saving
    const current = preferences[category]?.[channel] ?? false;
    const next = !current;

    setError(null);
    setPreferences(p => p ? { ...p, [category]: { ...p[category], [channel]: next } } : p);
    setSaving(key, true);
    try {
      await notificationsApi.updatePreference(category, { [channel]: next });
    } catch {
      // Roll back the optimistic update and surface the failure.
      setPreferences(p => p ? { ...p, [category]: { ...p[category], [channel]: current } } : p);
      setError("Couldn't save that change. Check your connection and try again.");
    } finally {
      setSaving(key, false);
    }
  };

  return (
    <SlidePanel onClose={onClose}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12 }}>
          <TouchableOpacity onPress={onClose} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
            <BackChevron color={c.text} />
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
            {/* OS-level push status for this device */}
            <DevicePushSection c={c} />

            {error && (
              <View style={{ backgroundColor: "#FEF2F2", borderRadius: 10, borderWidth: 1, borderColor: "#FECACA", paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16, flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: RED }} />
                <Text style={{ flex: 1, fontFamily: "PlusJakartaSans_500Medium", fontSize: 12.5, color: "#991B1B", lineHeight: 18 }}>{error}</Text>
              </View>
            )}

            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED, marginBottom: 20, lineHeight: 19 }}>
              Choose how you want to be notified for each category. Security alerts cannot be disabled.
            </Text>
            {Object.keys(CATEGORY_CONFIG).map((category) => {
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
                    {(Object.keys(CHANNEL_LABELS) as ChannelKey[]).map((channel, i) => {
                      const key = `${category}-${channel}`;
                      const isSaving = savingKeys.has(key);
                      return (
                        <View key={channel}>
                          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 14, color: c.text }}>{CHANNEL_LABELS[channel]}</Text>
                            </View>
                            {isSaving && <ActivityIndicator size="small" color={TEAL} />}
                            <CustomToggle value={prefs?.[channel] ?? false} onChange={() => togglePref(category, channel)} disabled={isMandatory || isSaving} />
                          </View>
                          {i < Object.keys(CHANNEL_LABELS).length - 1 && <View style={{ height: 1, backgroundColor: c.border, marginHorizontal: 16 }} />}
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>
    </SlidePanel>
  );
}

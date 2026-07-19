import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path, Circle, Rect, G, Defs, ClipPath } from "react-native-svg";
import { notificationsApi, type Notification } from "../../services/api";
import { useColors } from "@/hooks/useColors";

const TEAL = "#164951";
const GREEN = "#45B369";
const RED = "#EF4770";
const ORANGE = "#F38744";
const PURPLE = "#4A4AF4";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";

function NotificationsIllustration() {
  return (
    <Svg width={236} height={226} viewBox="0 0 236 226" fill="none">
      <Defs>
        <ClipPath id="notif_clip">
          <Rect width={235.711} height={226} fill="white" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#notif_clip)">
        <Path d="M110.346 2.28374C125.249 0.759012 134.973 5.84205 147.515 12.8037C160.571 19.7859 176.618 28.3681 182.743 42.7952C187.063 52.9719 188.603 63.6382 195.07 73.2845C199.644 80.1077 204.496 85.8352 209.695 92.2323C214.48 98.0337 218.809 104.197 222.643 110.666C233.411 128.928 238.212 147.041 232.798 167.95C227.83 187.245 215.452 203.802 198.35 214.024C180.327 224.581 158.999 226.435 139.237 220.384C137.337 219.802 135.348 218.966 133.468 218.487L133.287 218.441C119.777 213.687 106.396 204.712 93.1597 199.677C70.4604 191.042 48.0877 194.274 27.7113 178.056C13.8847 167.051 5.34654 153.818 3.16182 135.972C2.35881 129.245 2.76621 122.428 4.36474 115.844C8.37222 99.6362 22.3056 78.2278 32.4857 64.8618C39.0285 56.2718 47.3719 47.9308 54.5062 39.8544C68.945 23.5086 80.9521 8.24787 103.532 3.25472C105.625 2.79198 108.183 2.5494 110.346 2.28374Z" fill="#EFF2F2"/>
        <Path d="M136.466 35.5381C136.682 34.7332 136.685 34.4783 137.525 34.045C144.147 30.6175 150.4 29.3522 157.676 31.2642C171.898 35.0009 180.021 49.5207 175.945 63.6422C174.504 68.6332 171.497 73.4447 167.086 76.6515C166.887 76.7963 166.182 76.863 165.916 76.8859C164.217 78.9895 161.331 81.1223 159.142 82.7498C161.986 91.4395 160.424 101.063 161.179 110.364C162.418 125.313 164.612 142.135 174.638 153.984C177.745 157.656 182.324 156.958 182.446 164.365C182.473 166.923 181.471 169.384 179.665 171.196C178.676 172.199 176.699 173.546 175.335 173.7C171.5 174.133 166.697 173.959 162.814 173.953L136.89 173.919C136.261 178.67 135.758 181.195 132.797 184.952C123.889 196.256 105.772 192.88 101.559 179.098C101.002 177.278 100.864 175.764 100.645 173.916C88.8933 173.972 77.1119 173.928 65.3584 173.96C62.1635 173.969 60.1105 173.489 57.8039 171.105C56.1919 169.438 54.8213 166.442 55.0072 164.148C55.474 158.387 58.9476 157.261 62.6731 154.235C63.8682 153.265 66.9373 148.403 67.693 146.966C75.8201 131.505 76.6725 112.261 76.6299 95.1246C76.5253 83.2556 81.1234 72.0404 89.6017 63.7161C94.7805 58.6311 100.865 55.1043 107.816 53.0367C112.316 51.698 116.319 51.6066 120.949 51.6889C120.999 51.5285 121.054 51.3696 121.113 51.2124C123.995 43.7774 129.212 38.7811 136.466 35.5381Z" fill="#1C4E56"/>
        <Path d="M26.414 193.107C29.4747 192.507 32.442 194.503 33.0406 197.564C33.6393 200.624 31.6429 203.591 28.5817 204.189C25.5221 204.786 22.5572 202.791 21.9586 199.731C21.3602 196.672 23.3546 193.706 26.414 193.107Z" fill="#46B874"/>
        <Path d="M207.377 55.6781C214.053 54.9811 215.902 59.28 213.442 64.9573C212.515 65.4294 211.646 65.7746 210.688 66.165C209.468 66.2608 208.263 66.3659 207.08 65.9604C205.757 65.5146 204.675 64.5448 204.087 63.278C203.474 61.9112 203.422 60.3585 203.944 58.9544C204.594 57.2513 205.772 56.3702 207.377 55.6781Z" fill="#46B874"/>
      </G>
    </Svg>
  );
}

function TradingIcon() {
  return (
    <Svg width={32} height={32} viewBox="0 0 32 32">
      <Circle cx={16} cy={16} r={16} fill={GREEN} />
      <Path d="M10 20l4-4 3 2 5-6" stroke={WHITE} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M18 12h4v4" stroke={WHITE} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function PortfolioIcon() {
  return (
    <Svg width={32} height={32} viewBox="0 0 32 32">
      <Circle cx={16} cy={16} r={16} fill={TEAL} />
      <Path d="M11 22V15l5-4 5 4v7H11z" stroke={WHITE} strokeWidth={1.3} strokeLinejoin="round" fill="none" />
      <Rect x={14} y={18} width={4} height={4} rx={1} fill={WHITE} />
    </Svg>
  );
}

function WalletIcon() {
  return (
    <Svg width={32} height={32} viewBox="0 0 32 32">
      <Circle cx={16} cy={16} r={16} fill={ORANGE} />
      <Rect x={10} y={12} width={12} height={9} rx={2} stroke={WHITE} strokeWidth={1.3} fill="none" />
      <Circle cx={19} cy={16.5} r={1.2} fill={WHITE} />
    </Svg>
  );
}

function SecurityIcon() {
  return (
    <Svg width={32} height={32} viewBox="0 0 32 32">
      <Circle cx={16} cy={16} r={16} fill={RED} />
      <Path d="M16 10l5 2.5v4c0 3.5-2.2 6-5 7-2.8-1-5-3.5-5-7v-4L16 10z" stroke={WHITE} strokeWidth={1.3} fill="none" />
      <Path d="M14 16l1.5 1.5 3-3" stroke={WHITE} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function KycIcon() {
  return (
    <Svg width={32} height={32} viewBox="0 0 32 32">
      <Circle cx={16} cy={16} r={16} fill={PURPLE} />
      <Rect x={11} y={11} width={10} height={10} rx={2} stroke={WHITE} strokeWidth={1.3} fill="none" />
      <Path d="M14 15l1.5 1.5 3-3" stroke={WHITE} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function SystemIcon() {
  return (
    <Svg width={32} height={32} viewBox="0 0 32 32">
      <Circle cx={16} cy={16} r={16} fill={TEAL} />
      <Circle cx={16} cy={16} r={5} stroke={WHITE} strokeWidth={1.3} fill="none" />
      <Path d="M16 9v2M16 21v2M9 16h2M21 16h2" stroke={WHITE} strokeWidth={1.3} strokeLinecap="round" />
    </Svg>
  );
}

function getIconForCategory(category: string) {
  switch (category?.toUpperCase()) {
    case "TRADING": return <TradingIcon />;
    case "PORTFOLIO": return <PortfolioIcon />;
    case "WALLET": return <WalletIcon />;
    case "SECURITY": return <SecurityIcon />;
    case "KYC": return <KycIcon />;
    case "MARKET": return <TradingIcon />;
    default: return <SystemIcon />;
  }
}

function formatRelativeTime(dateStr: string): string {
  try {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;
  const c = useColors();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const result = await notificationsApi.list(30);
      setNotifications(result.notifications ?? []);
      setUnreadCount(result.unreadCount ?? 0);
    } catch {
      // Keep existing state on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const onRefresh = () => { setRefreshing(true); fetchNotifications(); };

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
    try { await notificationsApi.markRead(id); } catch { fetchNotifications(); }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try { await notificationsApi.markAllRead(); } catch { fetchNotifications(); }
  };

  const deleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((c) => {
      const wasUnread = notifications.find((n) => n.id === id && !n.isRead);
      return wasUnread ? Math.max(0, c - 1) : c;
    });
    try { await notificationsApi.delete(id); } catch { fetchNotifications(); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background, paddingTop: topPad }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12, gap: 8 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M15 18l-6-6 6-6" stroke={c.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
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
          <NotificationsIllustration />
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: c.text, marginTop: 8 }}>No notifications yet</Text>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: MUTED, textAlign: "center" }}>We'll notify you when something important happens</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TEAL} />}
        >
          {notifications.map((item, i) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.75}
              onPress={() => { if (!item.isRead) markRead(item.id); }}
              onLongPress={() => deleteNotification(item.id)}
              style={[
                { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 24, paddingVertical: 18, gap: 14 },
                !item.isRead && { backgroundColor: c.card },
                i < notifications.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border },
              ]}
            >
              <View style={{ marginTop: 2 }}>{getIconForCategory(item.category)}</View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: c.text, flex: 1 }} numberOfLines={1}>{item.title}</Text>
                  {!item.isRead && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: TEAL }} />}
                </View>
                <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED, lineHeight: 19, marginBottom: 6 }} numberOfLines={2}>{item.body}</Text>
                <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: "#C4C4C4" }}>{formatRelativeTime(item.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { notificationsApi, type Notification } from "../../services/api";

const TEAL = "#164951";
const GREEN = "#45B369";
const RED = "#EF4770";
const ORANGE = "#F38744";
const PURPLE = "#4A4AF4";
const WHITE = "#FFFFFF";
const DARK = "#111827";
const MUTED = "#9CA3AF";
const UNREAD_BG = "#F9FAFB";
const DIVIDER = "#F3F4F6";

function BackIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={DARK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/* ── Category-based icons ── */
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

/** Format timestamp into relative time (e.g. "2m ago", "1h ago", "3d ago") */
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
    // Optimistic update
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await notificationsApi.markRead(id);
    } catch {
      // Revert on error
      fetchNotifications();
    }
  };

  const markAllRead = async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await notificationsApi.markAllRead();
    } catch {
      fetchNotifications();
    }
  };

  const deleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((c) => {
      const wasUnread = notifications.find((n) => n.id === id && !n.isRead);
      return wasUnread ? Math.max(0, c - 1) : c;
    });
    try {
      await notificationsApi.delete(id);
    } catch {
      fetchNotifications();
    }
  };

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={TEAL} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyWrap}>
          <SystemIcon />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySubtitle}>We'll notify you when something important happens</Text>
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
                styles.notifItem,
                !item.isRead && styles.notifItemUnread,
                i < notifications.length - 1 && styles.notifItemBorder,
              ]}
            >
              {/* Left: category icon */}
              <View style={styles.iconWrap}>{getIconForCategory(item.category)}</View>

              {/* Center: text */}
              <View style={styles.notifBody}>
                <View style={styles.notifTitleRow}>
                  <Text style={styles.notifTitle} numberOfLines={1}>{item.title}</Text>
                  {!item.isRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notifBodyText} numberOfLines={2}>{item.body}</Text>
                <Text style={styles.notifTime}>{formatRelativeTime(item.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ height: 32 }} />
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
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: DARK,
  },
  unreadBadge: {
    backgroundColor: RED,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
    color: WHITE,
  },
  markAllBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  markAllText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: TEAL,
  },
  /* Loading / Empty states */
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 48,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 17,
    color: DARK,
    marginTop: 8,
  },
  emptySubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: MUTED,
    textAlign: "center",
  },
  /* Notification items */
  notifItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingVertical: 18,
    backgroundColor: WHITE,
    gap: 14,
  },
  notifItemUnread: {
    backgroundColor: UNREAD_BG,
  },
  notifItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },
  iconWrap: {
    marginTop: 2,
  },
  notifBody: { flex: 1 },
  notifTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  notifTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: DARK,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: TEAL,
  },
  notifBodyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: MUTED,
    lineHeight: 19,
    marginBottom: 6,
  },
  notifTime: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#C4C4C4",
  },
});

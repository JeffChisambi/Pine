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
import Svg, { Path, Circle, Rect, G, Defs, ClipPath } from "react-native-svg";
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
        <Path d="M136.466 35.5381C136.682 34.7332 136.685 34.4783 137.525 34.045C144.147 30.6175 150.4 29.3522 157.676 31.2642C171.898 35.0009 180.021 49.5207 175.945 63.6422C174.504 68.6332 171.497 73.4447 167.086 76.6515C166.887 76.7963 166.182 76.863 165.916 76.8859C166.215 76.4189 166.51 75.9495 166.801 75.4776C171.066 68.5577 172.869 62.5716 171.074 54.5506C168.707 43.967 160.868 36.7705 150.397 34.5045C145.019 33.3408 141.677 34.2821 136.466 35.5381Z" fill="#B4D5D3"/>
        <Path d="M116.725 54.8244C117.416 54.711 119.369 54.7223 120.157 54.7072C119.162 60.5548 119.438 65.8404 121.98 71.3736C124.923 77.6251 130.201 82.4721 136.681 84.8725C143.07 87.202 150.116 86.9471 156.32 84.1616C156.787 86.5428 157.483 89.9162 157.683 92.3201C158.108 97.4415 157.911 102.667 158.038 107.845C158.357 120.874 160.173 133.75 165.56 145.732C166.912 148.739 169.166 152.175 170.934 154.974C166.277 154.878 161.05 154.998 156.354 154.996L123.464 154.997L66.5042 154.95C76.8667 140.37 79.1377 123.259 79.6727 105.802C79.87 99.3617 79.4487 92.856 80.7418 86.4962C82.0508 80.2386 84.8396 74.3854 88.8745 69.4264C96.238 60.4989 105.253 55.9458 116.725 54.8244Z" fill="#EFF2F2"/>
        <Path d="M106.308 64.4672C107.476 64.4356 108.269 64.8366 108.377 66.0739C107.488 67.8715 103.25 69.2101 101.449 70.693C97.7123 73.7707 95.018 76.7049 92.7918 80.9727C90.4026 85.5529 90.2722 88.969 89.5792 93.8739C89.5251 94.2574 89.2726 94.5825 88.9754 94.8324C88.1312 94.99 86.7712 95.0621 86.6319 94.0103C86.1267 90.1939 87.6209 84.6112 89.0661 81.273C92.3903 73.629 98.5817 67.5945 106.308 64.4672Z" fill="#1C4E56"/>
        <Path d="M143.426 37.4794C156.062 36.2525 167.282 45.5494 168.424 58.1941C169.566 70.8389 160.193 81.9954 147.541 83.0524C135.009 84.0994 123.981 74.8351 122.85 62.31C121.718 49.7847 130.908 38.6946 143.426 37.4794Z" fill="#B4D5D3"/>
        <Path d="M145.5 68.2386C144.216 68.2386 143.122 67.8892 142.219 67.1903C141.315 66.4858 140.625 65.4659 140.148 64.1307C139.67 62.7898 139.432 61.1705 139.432 59.2727C139.432 57.3864 139.67 55.7756 140.148 54.4403C140.631 53.0994 141.324 52.0767 142.227 51.3722C143.136 50.6619 144.227 50.3068 145.5 50.3068C146.773 50.3068 147.861 50.6619 148.764 51.3722C149.673 52.0767 150.366 53.0994 150.844 54.4403C151.327 55.7756 151.568 57.3864 151.568 59.2727C151.568 61.1705 151.33 62.7898 150.852 64.1307C150.375 65.4659 149.685 66.4858 148.781 67.1903C147.878 67.8892 146.784 68.2386 145.5 68.2386ZM145.5 66.3636C146.773 66.3636 147.761 65.75 148.466 64.5227C149.17 63.2955 149.523 61.5455 149.523 59.2727C149.523 57.7614 149.361 56.4744 149.037 55.4119C148.719 54.3494 148.259 53.5398 147.656 52.983C147.06 52.4261 146.341 52.1477 145.5 52.1477C144.239 52.1477 143.253 52.7699 142.543 54.0142C141.832 55.2528 141.477 57.0057 141.477 59.2727C141.477 60.7841 141.636 62.0682 141.955 63.125C142.273 64.1818 142.73 64.9858 143.327 65.5369C143.929 66.0881 144.653 66.3636 145.5 66.3636Z" fill="#164951"/>
        <Path d="M56.2674 84.756C56.9125 84.7818 57.1566 84.7474 57.6982 85.131C58.016 85.7357 58.0079 85.8213 57.8951 86.4993C57.0059 88.1546 52.504 89.7867 50.6108 90.6304C49.7984 90.3457 49.6297 90.3117 49.0213 89.7072C48.4872 87.5304 54.519 85.2598 56.2674 84.756Z" fill="#1C4E56"/>
        <Path d="M43.8069 91.9752C44.8621 92.246 45.3472 92.605 45.5081 93.6697C45.0433 95.163 41.2593 98.2813 39.755 100.034C38.9428 99.8004 38.7252 99.7719 38.0653 99.2288C37.1949 97.0474 42.0958 93.0835 43.8069 91.9752Z" fill="#1C4E56"/>
        <Path d="M33.9435 103.192C34.1037 103.221 34.2633 103.255 34.4217 103.292C35.2807 103.498 35.5608 103.746 35.9821 104.421C35.9581 105.872 33.0123 111.696 32.0227 112.852C29.1191 111.455 30.5363 109.244 31.6566 106.998C32.2814 105.745 33.115 104.303 33.9435 103.192Z" fill="#1C4E56"/>
        <Path d="M28.4983 131.471C29.0236 131.531 29.9719 131.649 30.28 132.181C31.4581 134.22 31.8987 137.605 31.945 139.942C31.9552 140.447 31.3361 140.8 30.9744 141.087C30.6279 141.075 30.4016 140.979 30.0748 140.873C28.4967 139.336 26.9494 133.451 28.4983 131.471Z" fill="#1C4E56"/>
        <Path d="M33.5279 145.302C35.4209 145.514 38.3472 150.643 38.8899 152.512C39.0508 153.067 38.3973 153.76 38.0881 154.175C35.8654 153.992 32.806 148.992 32.6912 146.879C32.6482 146.086 33.0626 145.814 33.5279 145.302Z" fill="#1C4E56"/>
        <Path d="M28.2895 116.944C29.1346 116.936 30.0862 116.847 30.7532 117.329C31.2114 118.445 30.0796 124.845 29.8287 126.332C28.7887 126.454 28.0525 126.605 27.4296 125.696C27.1383 123.996 27.7031 118.6 28.2895 116.944Z" fill="#1C4E56"/>
        <Path d="M67.9154 81.9702C69.1613 81.8202 72.9495 81.5154 72.1009 83.9413C71.1688 84.8957 68.465 84.9199 67.0408 85.0477C65.5104 85.2307 63.3793 85.5829 62.3389 84.2278C62.5276 82.2523 66.5153 82.106 67.9154 81.9702Z" fill="#1C4E56"/>
        <Path d="M26.414 193.107C29.4747 192.507 32.442 194.503 33.0406 197.564C33.6393 200.624 31.6429 203.591 28.5817 204.189C25.5221 204.786 22.5572 202.791 21.9586 199.731C21.3602 196.672 23.3546 193.706 26.414 193.107Z" fill="#46B874"/>
        <Path d="M207.377 55.6781C214.053 54.9811 215.902 59.28 213.442 64.9573C212.515 65.4294 211.646 65.7746 210.688 66.165C209.468 66.2608 208.263 66.3659 207.08 65.9604C205.757 65.5146 204.675 64.5448 204.087 63.278C203.474 61.9112 203.422 60.3585 203.944 58.9544C204.594 57.2513 205.772 56.3702 207.377 55.6781Z" fill="#46B874"/>
      </G>
    </Svg>
  );
}

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
          <NotificationsIllustration />
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
    fontFamily: "PlusJakartaSans_700Bold",
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
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 11,
    color: WHITE,
  },
  markAllBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  markAllText: {
    fontFamily: "PlusJakartaSans_500Medium",
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
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 17,
    color: DARK,
    marginTop: 8,
  },
  emptySubtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
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
    fontFamily: "PlusJakartaSans_600SemiBold",
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
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: MUTED,
    lineHeight: 19,
    marginBottom: 6,
  },
  notifTime: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "#C4C4C4",
  },
});

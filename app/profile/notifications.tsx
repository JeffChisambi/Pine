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
    <Svg width={242} height={212} viewBox="0 0 242 212" fill="none">
      <G id="notbel" clipPath="url(#clip0_7_943)">
        <Path id="Vector" d="M107.363 50.9631C108.891 50.8948 113.654 50.2035 112.505 52.9788C111.152 54.287 107.143 53.7603 105.08 54.6626C90.3218 61.1459 79.9555 74.3712 77.7078 89.4698C76.7634 95.2035 77.7897 100.755 78.6365 106.427C80.6901 120.182 82.598 133.986 84.5825 147.747C85.8935 156.837 87.6049 162.122 82.9118 170.872C87.1151 170.043 90.6255 169.074 94.7614 168.059L120.755 161.528C143.384 155.949 166.904 150.339 189.372 144.366C185.392 141.913 182.333 139.041 180.312 134.987C177.329 129.004 174.793 122.865 172.059 116.785L163.791 98.1461C162.674 95.588 161.491 93.0326 160.413 90.4787C160.203 89.7056 159.309 88.1895 160.296 87.6781C161.26 87.1782 162.237 87.3408 162.678 88.2697C165.554 94.3409 168.113 100.837 170.949 106.891L177.394 121.408C179.824 126.896 181.932 132.919 185.911 137.884C190.975 144.201 206.127 145.159 200.236 156.173C198.785 158.887 196.106 159.757 193.151 160.521C171.449 166.13 149.605 171.288 127.886 176.841L102.203 183.249C97.0009 184.577 91.7882 185.993 86.5257 187.081C81.9478 187.998 77.1807 185.416 75.9713 181.161C74.6944 176.669 79.3272 171.886 81.2112 167.705C82.2693 165.335 82.8517 162.803 82.9288 160.236C83.0939 155.692 81.8905 150.15 81.2566 145.609L76.9736 115.445C76.0344 109.147 74.0209 98.4317 74.4328 92.4848C74.9662 84.8633 77.4331 77.4701 81.6294 70.9168C86.5129 63.3891 92.598 57.8501 100.869 53.5805C102.768 52.6001 105.253 51.4493 107.363 50.9631Z" fill="#1F5660" />
        <Path id="Vector_2" d="M192.396 146.52C199.448 147.25 200.564 155.041 194.585 157.21C191.386 158.37 186.592 159.312 183.188 160.167L160.3 165.905L84.9182 184.666C77.8604 184.163 76.6053 175.802 82.9532 173.903C87.1049 172.661 91.6578 171.658 95.9034 170.607L120.877 164.403L171.882 151.661C178.677 149.972 185.607 148.122 192.396 146.52Z" fill="#F1F8F6" />
        <Path id="Vector_3" d="M164.672 76.4099C157.46 82.0283 148.713 84.3344 137.979 80.9478C127.246 77.5615 119.859 68.3381 119.408 57.7584C118.956 47.1788 125.533 37.4348 135.944 33.26C137.249 32.2553 146.247 29.9646 152.258 31.0883C158.269 32.212 162.267 34.4594 166.675 38.5795C171.084 42.6996 175.88 50.8417 174.288 59.9293C173.223 66.0097 171.884 70.7915 164.672 76.4099Z" fill="#1B575B" />
        <Path id="Vector_4" d="M126.349 44.2698C132.229 35.8666 143.307 32.0607 153.608 34.9045C163.91 37.7484 170.998 46.5696 171.052 56.6109C171.106 66.6521 164.111 75.5389 153.841 78.4786C144.042 81.2835 133.413 78.0493 127.258 70.3898C121.103 62.7305 120.739 52.287 126.349 44.2698Z" fill="#3EB974" />
        <Path id="Vector_5" d="M126.349 44.2698C126.577 44.8164 125.291 49.3057 125.148 50.3949C123.452 63.4178 132.989 75.0959 146.533 77.9128C147.734 78.1626 153.584 78.3475 153.841 78.4786C144.042 81.2834 133.413 78.0493 127.258 70.3898C121.103 62.7304 120.739 52.287 126.349 44.2698Z" fill="#3EB974" />
        <Path id="Vector_6" d="M146.548 48.5809C150.171 48.5995 152.462 50.6468 152.786 54.0806C153.218 58.6597 153.656 65.0561 147.239 65.8084C143.022 65.6411 140.698 64.0446 140.51 59.824C140.292 54.9741 139.573 48.965 146.548 48.5809Z" fill="#F1F8F6" />
        <Path id="Vector_7" d="M145.848 50.7517C147.063 50.7562 148.302 50.782 148.934 51.9844C150.296 54.5763 149.95 58.5384 149.382 61.3262C149.16 62.4168 148.689 62.9481 147.748 63.4751C143.507 63.992 143.542 60.3955 143.538 57.4653C143.534 55.3262 143.354 51.6497 145.848 50.7517Z" fill="#3EB974" />
        <Path id="Vector_8" d="M151.349 173.13C151.716 172.52 151.831 172.384 152.483 172.013C152.882 171.97 153.442 171.872 153.72 172.188C156.59 175.556 154.235 181.762 151.353 184.513C148.985 186.774 145.521 188.028 142.154 188.118C136.989 188.257 130.069 184.253 129.917 178.976C129.901 178.409 130 177.886 130.45 177.472C133.89 177.534 131.091 184.629 141.033 185.406C140.665 184.963 139.175 185.434 141.434 186.433C137.091 184.323 133.242 182.501 131.818 178.29C137.12 176.634 146.413 174.82 151.349 173.13Z" fill="#3EB974" />
        <Path id="Vector_9" d="M151.349 173.13C151.716 172.52 151.831 172.384 152.483 172.013C152.882 171.97 153.442 171.872 153.72 172.188C156.59 175.556 154.235 181.762 151.353 184.513C148.985 186.774 145.521 188.028 142.154 188.118C136.989 188.257 130.069 184.253 129.917 178.976C129.901 178.409 130 177.886 130.45 177.472C133.89 177.534 132.438 184.659 142.38 185.436C143.112 185.59 144.723 185.172 145.425 184.908C150.304 183.071 153.288 177.829 151.349 173.13Z" fill="#1F5660" />
        <Path id="Vector_10" d="M108.966 61.9611C109.827 61.8815 109.89 61.9701 110.473 62.493C110.778 63.2206 110.678 64.0004 109.927 64.4044C106.929 66.0178 104.135 67.1538 101.381 69.1732C93.6547 74.8383 88.6702 83.4761 87.9659 92.6406C87.776 95.1108 88.1588 97.6929 87.9993 100.168C87.9553 100.854 87.406 101.168 86.8256 101.586C84.7175 100.584 84.908 99.0437 84.8291 97.1164C84.1949 81.6282 93.5693 67.843 108.966 61.9611Z" fill="#3EB974" />
        <Path id="Vector_11" d="M47.3863 100.065C48.7163 99.6233 50.1979 99.891 51.2563 100.764C52.3144 101.637 52.7828 102.978 52.4793 104.267C52.176 105.556 51.1487 106.589 49.796 106.966C47.7777 107.529 45.6472 106.485 44.9935 104.613C44.3398 102.742 45.4014 100.724 47.3863 100.065Z" fill="#3EB974" />
        <Path id="Vector_12" d="M86.699 194.248C88.1887 193.967 89.7146 194.54 90.5803 195.709C91.4457 196.875 91.4843 198.413 90.6788 199.617C90.1349 200.432 89.2629 201.005 88.2602 201.207C86.1972 201.627 84.1643 200.394 83.7309 198.463C83.2976 196.531 84.63 194.639 86.699 194.248Z" fill="#1F5660" />
        <Path id="Vector_13" d="M208.995 69.0009C210.3 68.6017 211.734 68.8916 212.746 69.7592C213.757 70.6267 214.19 71.9369 213.876 73.1864C213.563 74.436 212.553 75.4304 211.235 75.7876C209.244 76.3267 207.158 75.2746 206.547 73.423C205.936 71.5712 207.026 69.6036 208.995 69.0009Z" fill="#3EB974" />
        <Path id="Vector_14" d="M18.0427 50.2655C19.5028 49.8089 21.1132 50.2234 22.1177 51.3141C23.1221 52.4046 23.3212 53.9551 22.6215 55.237C22.1545 56.0923 21.3364 56.7338 20.3541 57.0149C18.3705 57.5823 16.2674 56.5536 15.6349 54.7067C15.0023 52.8597 16.0753 50.8805 18.0427 50.2655Z" fill="#1F5660" />
        <Path id="Vector_15" d="M195.823 103.398C199.104 103.261 199.814 104.212 200.391 106.972C199.766 108.988 199.637 109.485 197.403 110.114C194.215 110.198 191.639 108.716 193.036 105.164C193.432 104.157 194.769 103.698 195.823 103.398Z" fill="#1F5660" />
        <Path id="Vector_16" d="M208.821 153.944C212.081 153.798 218.064 154.969 221.398 155.701C222.001 155.833 222.167 156.215 222.368 156.661C222.324 157.257 222.077 157.455 221.688 157.937C220.286 158.172 211.075 157.134 209.258 156.506C208.739 156.326 208.567 155.994 208.374 155.531C208.346 154.765 208.459 154.622 208.821 153.944Z" fill="#3EB974" />
        <Path id="Vector_17" d="M213.232 131.839C213.988 131.803 214.541 131.754 215.134 132.188C216.274 134.275 207.641 139.926 205.852 141.169C205.059 141.351 204.176 140.754 203.923 140.056C204.163 138.378 211.343 133.438 213.232 131.839Z" fill="#3EB974" />
        <Path id="Vector_18" d="M219.415 143.892C220.4 143.775 220.973 143.538 221.63 144.282C221.759 144.93 221.833 145.127 221.626 145.781C220.599 146.615 212.778 147.818 210.935 148.09C209.653 148.277 207.759 148.514 208.186 146.577C209.602 144.932 216.903 144.236 219.415 143.892Z" fill="#3EB974" />
        <Path id="Vector_19" d="M25.6933 135.908C26.3402 135.891 26.9568 135.812 27.5119 136.117C28.1638 136.744 29.9429 142.597 30.255 143.826C30.4345 144.531 30.1937 144.895 29.7724 145.439C29.2504 145.455 28.7958 145.553 28.3603 145.248C26.7579 144.125 25.9515 140.5 25.41 138.738C25.0657 137.617 25.0979 136.792 25.6933 135.908Z" fill="#1F5660" />
        <Path id="Vector_20" d="M51.7186 88.0169L52.0988 87.9888C53.0486 88.3875 53.5099 89.2679 53.1399 90.2163C52.3743 90.8453 46.4292 94.0137 45.3388 94.4778C44.2701 94.4286 43.6913 94.1392 43.6541 93.1361C44.4688 91.2115 49.6335 88.9825 51.7186 88.0169Z" fill="#1F5660" />
        <Path id="Vector_21" d="M32.4409 149.035C34.1107 149.084 36.5253 153.285 37.7631 154.418C38.402 155.002 38.9639 155.795 38.8511 156.646C38.4943 157.205 38.207 157.293 37.6044 157.589C37.0944 157.535 36.6076 157.379 36.2608 157.024C35.0741 155.806 31.1758 151.748 31.147 150.228C31.3968 149.661 31.8942 149.413 32.4409 149.035Z" fill="#1F5660" />
        <Path id="Vector_22" d="M42.8314 159.479C43.5919 159.592 50.7996 164.268 50.9731 165.344C50.7138 165.986 50.55 166.07 49.9957 166.479C48.0653 166.256 41.6581 162.797 41.4097 160.953C41.6254 160.314 42.2647 159.925 42.8314 159.479Z" fill="#1F5660" />
        <Path id="Vector_23" d="M38.5765 96.3917C39.671 96.4241 40.1592 96.6503 40.3895 97.6123C40.0844 98.9802 35.6677 103.633 34.4429 104.692C31.3049 103.731 32.3096 102.862 34.0306 100.933C35.4063 99.3902 36.9126 97.6665 38.5765 96.3917Z" fill="#1F5660" />
        <Path id="Vector_24" d="M29.4728 107.792C30.2747 107.939 31.065 108.214 31.5228 108.88C31.5332 109.674 28.5281 116.639 27.9369 117.402C26.9831 117.256 26.2335 117.105 25.7749 116.264C25.8598 114.453 28.2272 109.346 29.4728 107.792Z" fill="#1F5660" />
        <Path id="Vector_25" d="M24.7122 121.694C25.1788 121.688 27.0611 121.705 27.0257 122.302C26.9307 123.897 27.1717 130.36 26.4816 131.436C26.0579 131.479 25.6504 131.465 25.2249 131.461C23.0517 130.54 24.0872 123.465 24.7122 121.694Z" fill="#1F5660" />
        <Path id="Vector_26" d="M55.6744 166.33C57.5182 166.373 59.3599 166.347 61.1993 166.39C62.6331 166.423 64.8916 166.215 65.3355 167.749C65.1719 168.364 65.1226 168.427 64.6646 168.897C62.8783 169.236 57.4539 169.401 55.6582 168.603C55.1259 168.367 55.1026 168.098 54.9546 167.66C55.0914 166.948 55.1976 166.856 55.6744 166.33Z" fill="#1F5660" />
        <Path id="Vector_27" d="M198.423 53.6257C199.319 53.2881 200.341 53.4439 201.076 54.0301C201.812 54.6162 202.138 55.5356 201.922 56.4162C201.707 57.2966 200.986 57.9921 200.051 58.2212C198.727 58.5459 197.361 57.8526 196.93 56.6377C196.5 55.4227 197.153 54.104 198.423 53.6257Z" fill="#1F5660" />
        <Path id="Vector_28" d="M7.22449 66.206C8.6098 66.0127 9.90726 66.8871 10.149 68.1769C10.3907 69.4667 9.48849 70.7014 8.11544 70.9599C7.19576 71.1331 6.24795 70.8264 5.63963 70.1587C5.03132 69.4911 4.85823 68.5674 5.1875 67.7462C5.51678 66.925 6.29659 66.3352 7.22449 66.206Z" fill="#3EB974" />
        <Path id="Vector_29" d="M62.7538 85.0626C63.6819 84.9315 64.6675 85.0869 65.1834 85.8916C65.34 87.8453 61.8483 88.0409 60.4137 88.2369C59.3491 88.5978 58.4022 88.7948 57.669 87.7068C57.6345 85.5665 61.0836 85.3386 62.7538 85.0626Z" fill="#1F5660" />
      </G>
      <Defs>
        <ClipPath id="clip0_7_943">
          <Rect width={242} height={212} fill="white" />
        </ClipPath>
      </Defs>
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

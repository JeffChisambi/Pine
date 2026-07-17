import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from "react-native-svg";
import { useAuth } from "../../services/auth-context";
import { useWalletBalance } from "../../services/wallet-queries";

const TEAL = "#164951";
const CARD_TEAL = "#2D5B62";
const GREEN_AVATAR = "#8FD1A5";
const WHITE = "#FFFFFF";
const DARK = "#111827";
const MUTED = "#9CA3AF";
const DIVIDER = "#EBECEF";
const CARD_BG = "#F9FAFB";
const CARD_BORDER = "#F3F4F6";
const RED = "#EF4770";

function EditIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Path d="M13 2a2 2 0 0 1 2.828 2.828L5.5 15.156 2 16l.844-3.5L13 2z" stroke={DARK} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRight() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M7.5 14.5L12.5 10 7.5 5.5" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ProfileMenuIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Circle cx={11} cy={8} r={3.5} stroke={MUTED} strokeWidth={1.5} />
      <Path d="M4.5 19c0-3.314 2.91-6 6.5-6s6.5 2.686 6.5 6" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function LockMenuIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Rect x={4} y={10} width={14} height={9} rx={2} stroke={MUTED} strokeWidth={1.5} />
      <Path d="M7 10V7.5a4 4 0 0 1 8 0V10" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" />
      <Circle cx={11} cy={14.5} r={1.2} fill={MUTED} />
    </Svg>
  );
}

function LinkMenuIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path d="M10 13.5a4 4 0 0 0 5.657 0l2-2a4 4 0 0 0-5.657-5.657l-1.06 1.06" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 8.5a4 4 0 0 0-5.657 0l-2 2a4 4 0 0 0 5.657 5.657l1.06-1.06" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FingerprintMenuIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path d="M6.5 8.5a4.5 4.5 0 0 1 9 0" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M4 10a7 7 0 0 1 14 0c0 4-2 7-7 8" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M11 10v4" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function BellMenuIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path d="M11 4a4 4 0 0 0-4 4v3l-2 2.5h12L15 11V8a4 4 0 0 0-4-4z" stroke={MUTED} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M9 13.5a2 2 0 0 0 4 0" stroke={MUTED} strokeWidth={1.5} />
    </Svg>
  );
}

function LogoutMenuIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path d="M14.5 7.5l4 4-4 4M18.5 11.5H9" stroke={RED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M11 18.5H5a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 5 3.5h6" stroke={RED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function KycMenuIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Rect x={3} y={5} width={16} height={12} rx={2} stroke={MUTED} strokeWidth={1.5} />
      <Circle cx={8} cy={10} r={2} stroke={MUTED} strokeWidth={1.5} />
      <Path d="M12 9h5M12 12h3" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M6 17l2-2 2 2" stroke={MUTED} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const SETTINGS_GROUP_1 = [
  { icon: <ProfileMenuIcon />, label: "Personal Data", sub: "Name, address, email", route: "/profile/personal-data" },
  { icon: <KycMenuIcon />, label: "Identity Verification", sub: "KYC — verify your identity", route: "/kyc/upload-id" },
  { icon: <LockMenuIcon />, label: "Security", sub: "Password & PIN", route: null },
  { icon: <LinkMenuIcon />, label: "Link Account", sub: "Connect your accounts", route: null },
];

const SETTINGS_GROUP_2 = [
  { icon: <FingerprintMenuIcon />, label: "Fingerprint", sub: "Biometric authentication", route: null },
  { icon: <BellMenuIcon />, label: "Notifications", sub: "Manage alerts & sounds", route: "/profile/push-notifications" },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;

  // Auth state
  const { user, logout } = useAuth();

  // API state — populated from auth context and wallet API
  const [userName, setUserName] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const { data: walletBalanceData } = useWalletBalance();
  const walletBalance = Number(
    walletBalanceData?.availableBalance || walletBalanceData?.balance || 0,
  );
  const pendingBalance = Number(walletBalanceData?.reservedBalance || 0);

  useEffect(() => {
    if (user) {
      setUserName(`${user.firstName} ${user.lastName}`);
      setUserPhone(user.phone);
      setIsVerified(user.kycStatus === 'APPROVED');
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const walletBalanceDisplay = walletBalance.toLocaleString("en-MW", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pendingBalanceDisplay = pendingBalance.toLocaleString("en-MW", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Account</Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push("/profile/personal-data" as any)}
        >
          <EditIcon />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Card (Design 48: rect x=24 y=116 w=327 h=185) ── */}
        <View style={styles.profileCard}>
          {/* Avatar + text row */}
          <View style={styles.profileHeaderRow}>
            <View style={styles.avatarCircle}>
              <Image
                source={require("../../attached_assets/Designer_1784289079544.png")}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.profileTextBlock}>
              <Text style={styles.profileName}>{userName ?? "—"}</Text>
              <Text style={styles.profilePhone}>{userPhone ?? "—"}</Text>
              {!isVerified && (
                <TouchableOpacity
                  style={styles.unverifiedChip}
                  onPress={() => router.push("/kyc/upload-id" as any)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.unverifiedText}>⚠ Verify Now</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Cash card (Design 48: rect x=45 y=212 w=286 h=69 fill=#164951) */}
          <TouchableOpacity
            style={styles.cashCard}
            onPress={() => router.push("/(tabs)/portfolio" as any)}
            activeOpacity={0.85}
          >
            {/* Decorative circles from SVG */}
            <Svg style={StyleSheet.absoluteFill} width="100%" height={69}>
              <Circle cx={252} cy={-22} r={70} stroke="#45B369" strokeWidth={1} strokeOpacity={0.5} fill="none" />
              <Circle cx={232} cy={62} r={50} stroke="#739297" strokeWidth={1} strokeOpacity={0.4} fill="none" />
              <Circle cx={274} cy={78} r={44} stroke="#FFD84A" strokeWidth={0.8} strokeOpacity={0.5} fill="none" />
            </Svg>

            <View style={styles.cashTextBlock}>
              <Text style={styles.cashLabel}>Cash Balance</Text>
              <Text style={styles.cashAmount}>MK {walletBalanceDisplay}</Text>
              <Text style={styles.cashSub}>MK {pendingBalanceDisplay} pending</Text>
            </View>

            {/* Right arrow button (Design 48: rect x=291 y=220 w=32 h=53) */}
            <View style={styles.cashArrow}>
              <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                <Path d="M5 3l4 4-4 4" stroke={WHITE} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Settings Group 1 (Design 48: rect x=24 y=317 w=327 h=162) ── */}
        <View style={styles.settingsGroup}>
          {SETTINGS_GROUP_1.map((item, i) => (
            <View key={item.label}>
              <TouchableOpacity
                style={styles.settingsRow}
                onPress={() => item.route && router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <View style={styles.rowIconWrap}>{item.icon}</View>
                <View style={styles.rowTextBlock}>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Text style={styles.rowSub}>{item.sub}</Text>
                </View>
                <ChevronRight />
              </TouchableOpacity>
              {i < SETTINGS_GROUP_1.length - 1 && <View style={styles.rowDivider} />}
            </View>
          ))}
        </View>

        {/* ── Settings Group 2 (Design 48: rect x=24 y=495 w=327 h=108) ── */}
        <View style={styles.settingsGroup}>
          {SETTINGS_GROUP_2.map((item, i) => (
            <View key={item.label}>
              <TouchableOpacity
                style={styles.settingsRow}
                onPress={() => item.route && router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <View style={styles.rowIconWrap}>{item.icon}</View>
                <View style={styles.rowTextBlock}>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Text style={styles.rowSub}>{item.sub}</Text>
                </View>
                <ChevronRight />
              </TouchableOpacity>
              {i < SETTINGS_GROUP_2.length - 1 && <View style={styles.rowDivider} />}
            </View>
          ))}
        </View>

        {/* Notification list shortcut */}
        <TouchableOpacity
          style={styles.settingsGroup}
          onPress={() => router.push("/profile/notifications" as any)}
          activeOpacity={0.7}
        >
          <View style={styles.settingsRow}>
            <View style={styles.rowIconWrap}><BellMenuIcon /></View>
            <View style={styles.rowTextBlock}>
              <Text style={styles.rowLabel}>Notification Center</Text>
              <Text style={styles.rowSub}>Recent activity & alerts</Text>
            </View>
            <ChevronRight />
          </View>
        </TouchableOpacity>

        {/* Log out */}
        <TouchableOpacity
          style={styles.logoutRow}
          activeOpacity={0.75}
          onPress={() => {
            Alert.alert(
              "Log Out",
              "Are you sure you want to log out?",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Log Out", style: "destructive", onPress: handleLogout },
              ],
            );
          }}
        >
          <LogoutMenuIcon />
          <Text style={styles.logoutLabel}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WHITE },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: DARK,
  },
  editBtn: {
    width: 40,
    height: 40,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 100,
    gap: 12,
  },
  /* Profile card */
  profileCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    overflow: "hidden",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 20,
  },
  profileHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GREEN_AVATAR,
    overflow: "hidden",
  },
  avatarImage: {
    width: 56,
    height: 56,
  },
  profileTextBlock: { flex: 1 },
  profileName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: DARK,
    marginBottom: 2,
  },
  profilePhone: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 6,
  },
  verifiedChip: {
    alignSelf: "flex-start",
    backgroundColor: "#D1FADF",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  verifiedText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: "#166534",
  },
  unverifiedChip: {
    alignSelf: "flex-start",
    backgroundColor: "#FEF3C7",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  unverifiedText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: "#92400E",
  },
  /* Cash card */
  cashCard: {
    backgroundColor: TEAL,
    borderRadius: 10,
    height: 69,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 18,
    paddingRight: 10,
    overflow: "hidden",
    position: "relative",
  },
  cashTextBlock: { flex: 1 },
  cashLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
    marginBottom: 2,
  },
  cashAmount: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: WHITE,
    marginBottom: 1,
  },
  cashSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
  },
  cashArrow: {
    width: 32,
    height: 52,
    backgroundColor: "rgba(45,91,98,0.45)",
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  /* Settings groups */
  settingsGroup: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    overflow: "hidden",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  rowIconWrap: { width: 24, alignItems: "center" },
  rowTextBlock: { flex: 1 },
  rowLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: DARK,
    marginBottom: 2,
  },
  rowSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: MUTED,
  },
  rowDivider: { height: 1, backgroundColor: DIVIDER, marginHorizontal: 16 },
  /* Logout */
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    backgroundColor: "#FFF1F2",
    borderRadius: 12,
    paddingVertical: 15,
  },
  logoutLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: RED,
  },
});

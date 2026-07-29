/**
 * KYC Under Review screen.
 *
 * Shown when the user has already submitted their KYC documents and the
 * application is being reviewed by the compliance team.
 *
 * Users are redirected here instead of the upload flow while their
 * kycStatus === "PENDING".
 */
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path, Circle, G, Rect, Defs, ClipPath } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

const TEAL = "#164951";
const AMBER = "#B45309";
const AMBER_BG = "#FFFBEB";
const AMBER_BORDER = "#FCD34D";

function ClockIllustration() {
  return (
    <View style={{ alignItems: "center", marginBottom: 8 }}>
      <Svg width={130} height={130} viewBox="0 0 130 130" fill="none">
        <Defs>
          <ClipPath id="clip0">
            <Rect width={130} height={130} rx={65} fill="white" />
          </ClipPath>
        </Defs>
        <Rect width={130} height={130} rx={65} fill={TEAL} />
        <G clipPath="url(#clip0)">
          <Circle cx={108} cy={108} r={45} stroke="#2D5B62" strokeWidth={1.1} />
          <Circle cx={22} cy={22} r={30} stroke="#2D5B62" strokeWidth={1.1} />
        </G>
        {/* Clock face */}
        <Circle cx={65} cy={65} r={36} fill="#FFFFFF" />
        <Circle cx={65} cy={65} r={32} stroke="#164951" strokeWidth={1.5} fill="none" />
        {/* Hour hand */}
        <Path d="M65 65 L65 42" stroke={TEAL} strokeWidth={3} strokeLinecap="round" />
        {/* Minute hand */}
        <Path d="M65 65 L80 72" stroke="#45B369" strokeWidth={3} strokeLinecap="round" />
        {/* Center dot */}
        <Circle cx={65} cy={65} r={3.5} fill={TEAL} />
        {/* Clock ticks */}
        <Path d="M65 35 L65 39" stroke={TEAL} strokeWidth={2} strokeLinecap="round" />
        <Path d="M65 91 L65 95" stroke={TEAL} strokeWidth={2} strokeLinecap="round" />
        <Path d="M35 65 L39 65" stroke={TEAL} strokeWidth={2} strokeLinecap="round" />
        <Path d="M91 65 L95 65" stroke={TEAL} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

function ChecklistItem({ text }: { text: string }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
      <Svg width={18} height={18} viewBox="0 0 18 18" fill="none" style={{ marginTop: 2 }}>
        <Circle cx={9} cy={9} r={8} fill="#45B369" />
        <Path d="M5.5 9l2.5 2.5 4.5-5" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      <Text style={{ flex: 1, fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: c.mutedForeground, lineHeight: 22 }}>
        {text}
      </Text>
    </View>
  );
}

export default function UnderReviewScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;
  const c = useColors();

  const styles = StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background,
      paddingTop: topPad,
    },
    content: {
      flex: 1,
      paddingHorizontal: 28,
      justifyContent: "center",
      gap: 24,
    },
    badge: {
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: AMBER_BG,
      borderWidth: 1,
      borderColor: AMBER_BORDER,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    badgeText: {
      fontFamily: "PlusJakartaSans_600SemiBold",
      fontSize: 13,
      color: AMBER,
    },
    title: {
      fontFamily: "PlusJakartaSans_700Bold",
      fontSize: 26,
      color: c.text,
      textAlign: "center",
      lineHeight: 34,
    },
    subtitle: {
      fontFamily: "PlusJakartaSans_400Regular",
      fontSize: 15,
      color: c.mutedForeground,
      textAlign: "center",
      lineHeight: 24,
    },
    card: {
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      padding: 20,
      gap: 4,
    },
    cardTitle: {
      fontFamily: "PlusJakartaSans_600SemiBold",
      fontSize: 14,
      color: c.text,
      marginBottom: 12,
    },
    footer: {
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: insets.bottom + 24,
      gap: 12,
    },
    primaryBtn: {
      backgroundColor: TEAL,
      borderRadius: 12,
      paddingVertical: 18,
      alignItems: "center",
    },
    primaryBtnText: {
      fontFamily: "PlusJakartaSans_600SemiBold",
      fontSize: 16,
      color: "#FFFFFF",
    },
  });

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <ClockIllustration />

        <View style={styles.badge}>
          <Svg width={10} height={10} viewBox="0 0 10 10">
            <Circle cx={5} cy={5} r={5} fill={AMBER} />
          </Svg>
          <Text style={styles.badgeText}>Under Review</Text>
        </View>

        <Text style={styles.title}>Your verification is{"\n"}being reviewed</Text>

        <Text style={styles.subtitle}>
          Our compliance team is reviewing your submitted documents. You'll be notified once a decision has been made.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What happens next</Text>
          <ChecklistItem text="Your documents are checked for authenticity and completeness." />
          <ChecklistItem text="Face matching is verified against your ID photo." />
          <ChecklistItem text="Your address document is reviewed." />
          <ChecklistItem text="You'll receive a notification with the outcome — usually within 24 hours." />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.replace("/(tabs)/profile" as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

import { router } from "expo-router";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const TEAL = "#164951";
const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const DARK = "#111827";
const BORDER_LIGHT = "#F3F4F6";
const MUTED = "#6B7280";
const MUTED_TEAL = "rgba(255,255,255,0.7)";

const SUBS = [
  { name: "Apple Inc.", letter: "A", bg: "#1C1C1E", price: "+2.4%" },
  { name: "Tesla", letter: "T", bg: "#CC0000", price: "+5.1%" },
  { name: "Amazon", letter: "a", bg: "#FF9900", price: "-1.2%" },
  { name: "Alphabet", letter: "G", bg: "#4A90D9", price: "+0.8%" },
  { name: "Microsoft", letter: "M", bg: "#00A4EF", price: "+3.3%" },
];

function SubRow({
  name,
  letter,
  bg,
  price,
}: (typeof SUBS)[0]) {
  return (
    <View style={phoneStyles.row}>
      <View style={[phoneStyles.iconBox, { backgroundColor: bg }]}>
        <Text style={phoneStyles.iconText}>{letter}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={phoneStyles.subName}>{name}</Text>
        <Text style={phoneStyles.subPeriod}>NYSE / NASDAQ</Text>
      </View>
      <Text style={phoneStyles.price}>{price}</Text>
    </View>
  );
}

function PhoneIllustration() {
  return (
    <View style={illStyles.circle}>
      <View style={illStyles.phone}>
        {/* Dynamic island */}
        <View style={illStyles.island} />
        {/* Status bar */}
        <View style={illStyles.statusBar}>
          <Text style={illStyles.statusTime}>9:41</Text>
        </View>
        {/* App header */}
        <View style={illStyles.appHeader}>
          <Text style={illStyles.headerSub}>Total Portfolio Value</Text>
          <Text style={illStyles.headerAmount}>K1,843</Text>
          <View style={illStyles.headerMeta}>
            <Text style={illStyles.metaActive}>↑ 18 holdings</Text>
            <Text style={illStyles.metaDue}>  3 alerts</Text>
          </View>
          {/* Mini logo row */}
          <View style={illStyles.logoRow}>
            {[
              { bg: "#FF9900", letter: "a" },
              { bg: "#E50914", letter: "N" },
              { bg: "#1DB954", letter: "S" },
              { bg: "#4A4AF4", letter: "R" },
            ].map((l, i) => (
              <View key={i} style={[illStyles.miniLogo, { backgroundColor: l.bg }]}>
                <Text style={illStyles.miniLogoText}>{l.letter}</Text>
              </View>
            ))}
            <Text style={illStyles.moreText}>+14 more</Text>
          </View>
        </View>
        {/* Subscription cards */}
        <View style={illStyles.cardArea}>
          {SUBS.map((s) => (
            <SubRow key={s.name} {...s} />
          ))}
        </View>
      </View>
    </View>
  );
}

function AppleLogo() {
  return (
    <Svg viewBox="0 0 24 24" width={22} height={22}>
      <Path
        fill={DARK}
        d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.32.07 2.22.74 2.98.8 1.13-.23 2.22-.91 3.42-.84 1.44.1 2.53.61 3.23 1.57-2.96 1.77-2.26 5.66.34 6.74-.51 1.22-1.17 2.42-1.97 3.61zM12.03 7.25c-.14-2.44 1.94-4.44 4.21-4.64.3 2.73-2.45 4.76-4.21 4.64z"
      />
    </Svg>
  );
}

function GoogleLogo() {
  return (
    <Svg viewBox="97.8 676.8 18.4 18.4" width={22} height={22}>
      <Path
        fill="#FFC107"
        d="M115.988 684.205H115.25V684.167H107V687.833H112.181C111.425 689.968 109.394 691.5 107 691.5C103.963 691.5 101.5 689.037 101.5 686C101.5 682.963 103.963 680.5 107 680.5C108.402 680.5 109.678 681.029 110.649 681.893L113.242 679.3C111.604 677.774 109.414 676.833 107 676.833C101.938 676.833 97.8333 680.938 97.8333 686C97.8333 691.062 101.938 695.167 107 695.167C112.062 695.167 116.167 691.062 116.167 686C116.167 685.385 116.103 684.785 115.988 684.205Z"
      />
      <Path
        fill="#FF3D00"
        d="M98.8903 681.733L101.902 683.942C102.717 681.925 104.69 680.5 107 680.5C108.402 680.5 109.678 681.029 110.649 681.893L113.242 679.3C111.604 677.774 109.415 676.833 107 676.833C103.479 676.833 100.426 678.821 98.8903 681.733Z"
      />
      <Path
        fill="#4CAF50"
        d="M107 695.167C109.368 695.167 111.519 694.26 113.146 692.787L110.309 690.386C109.357 691.11 108.195 691.501 107 691.5C104.616 691.5 102.591 689.98 101.829 687.858L98.8394 690.161C100.356 693.13 103.437 695.167 107 695.167Z"
      />
      <Path
        fill="#1976D2"
        d="M115.988 684.205H115.25V684.167H107V687.833H112.181C111.819 688.849 111.168 689.737 110.307 690.387L110.309 690.386L113.146 692.787C112.945 692.969 116.167 690.583 116.167 686C116.167 685.385 116.103 684.785 115.988 684.205Z"
      />
    </Svg>
  );
}

function BackIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19l-7-7 7-7" stroke={DARK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function OnboardingScreen3() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 12);

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}>
      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => router.push("/" as any)}
        >
          <BackIcon />
        </TouchableOpacity>
      </View>

      {/* ── Phone illustration inside green circle ── */}
      <View style={styles.illustrationWrap}>
        <PhoneIllustration />
      </View>

      {/* ── Text section ── */}
      <View style={styles.textSection}>
        <Text style={styles.headline}>Welcome to Pine</Text>
        <Text style={styles.subtitle}>
          We make buying, selling, and tracking stocks simple, clear, and effortless.
        </Text>
      </View>

      {/* ── Auth buttons ── */}
      <View style={styles.buttonsWrap}>
        {/* Dark — Sign in with Email */}
        <TouchableOpacity
          style={styles.darkBtn}
          activeOpacity={0.85}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.darkBtnText}>Sign in with Email</Text>
        </TouchableOpacity>

        {/* Outline — Apple */}
        <TouchableOpacity
          style={styles.outlineBtn}
          activeOpacity={0.7}
          onPress={() => router.push("/login")}
        >
          <AppleLogo />
          <Text style={styles.outlineBtnText}>Apple</Text>
        </TouchableOpacity>

        {/* Outline — Google */}
        <TouchableOpacity
          style={styles.outlineBtn}
          activeOpacity={0.7}
          onPress={() => router.push("/login")}
        >
          <GoogleLogo />
          <Text style={styles.outlineBtnText}>Google</Text>
        </TouchableOpacity>
      </View>

      {/* ── Dots ── */}
      <View style={styles.dotsRow}>
        <View style={[styles.dot, styles.dotInactive]} />
        <View style={[styles.dot, styles.dotActive]} />
      </View>

      {/* ── Bottom text ── */}
      <View style={styles.bottomRow}>
        <Text style={styles.bottomText}>Don't have an account? </Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/signup")}>
          <Text style={styles.bottomLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const CIRCLE = 252;
const PHONE_W = 193;
const PHONE_H = 388;

const illStyles = StyleSheet.create({
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: GREEN,
    overflow: "hidden",
    alignItems: "center",
  },
  phone: {
    width: PHONE_W,
    height: PHONE_H,
    marginTop: -6,
    backgroundColor: WHITE,
    borderRadius: 18,
    overflow: "hidden",
  },
  island: {
    alignSelf: "center",
    width: 60,
    height: 10,
    borderRadius: 5,
    backgroundColor: DARK,
    marginTop: 10,
    marginBottom: -2,
  },
  statusBar: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 2,
    backgroundColor: TEAL,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusTime: {
    color: WHITE,
    fontSize: 8,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  appHeader: {
    backgroundColor: TEAL,
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 14,
  },
  headerSub: {
    color: MUTED_TEAL,
    fontSize: 8,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  headerAmount: {
    color: WHITE,
    fontSize: 20,
    fontFamily: "PlusJakartaSans_700Bold",
    marginTop: 2,
  },
  headerMeta: {
    flexDirection: "row",
    marginTop: 2,
  },
  metaActive: {
    color: WHITE,
    fontSize: 8,
    fontFamily: "PlusJakartaSans_500Medium",
  },
  metaDue: {
    color: MUTED_TEAL,
    fontSize: 8,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 4,
  },
  miniLogo: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  miniLogoText: {
    color: WHITE,
    fontSize: 7,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  moreText: {
    color: MUTED_TEAL,
    fontSize: 8,
    fontFamily: "PlusJakartaSans_400Regular",
    marginLeft: 2,
  },
  cardArea: {
    backgroundColor: "#F9FAFB",
    flex: 1,
    padding: 10,
    gap: 5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHITE,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  iconText: {
    color: WHITE,
    fontSize: 10,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  subName: {
    fontSize: 9,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: DARK,
  },
  subPeriod: {
    fontSize: 7,
    color: MUTED,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  price: {
    fontSize: 9,
    fontFamily: "PlusJakartaSans_700Bold",
    color: DARK,
  },
});

const phoneStyles = illStyles;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    height: 44,
  },
  backBtn: {
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
    borderRadius: 8,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  illustrationWrap: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 4,
  },
  textSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 4,
    alignItems: "center",
  },
  headline: {
    fontSize: 28,
    fontFamily: "PlusJakartaSans_700Bold",
    color: DARK,
    lineHeight: 36,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
    color: MUTED,
    lineHeight: 21,
    textAlign: "center",
  },
  buttonsWrap: {
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 12,
  },
  darkBtn: {
    height: 56,
    backgroundColor: TEAL,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  darkBtnText: {
    fontSize: 17,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: WHITE,
  },
  outlineBtn: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  outlineBtnText: {
    fontSize: 17,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: DARK,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingTop: 16,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotInactive: {
    width: 8,
    backgroundColor: "#E5E7EB",
  },
  dotActive: {
    width: 20,
    backgroundColor: TEAL,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 8,
  },
  bottomText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    color: MUTED,
  },
  bottomLink: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: TEAL,
  },
});

import { guardedBack, guardedPush } from "@/utils/navigation";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

const WHITE = "#FFFFFF";

function BackArrow({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19l-7-7 7-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Face-scan illustration — clean geometric viewfinder ──────────────────────
function SelfieIllustration({ size = 280, color }: { size?: number; color: string }) {
  const ACCENT = "#45B369";
  return (
    <Svg width={size} height={size} viewBox="0 0 280 280" fill="none">
      <Defs>
        <LinearGradient id="scanFade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={ACCENT} stopOpacity="0" />
          <Stop offset="100%" stopColor={ACCENT} stopOpacity="0.14" />
        </LinearGradient>
      </Defs>

      {/* Corner viewfinder brackets */}
      <Path d="M24 58V40a16 16 0 0 1 16-16h18" stroke={color} strokeWidth={3.5} strokeLinecap="round" />
      <Path d="M222 24h18a16 16 0 0 1 16 16v18" stroke={color} strokeWidth={3.5} strokeLinecap="round" />
      <Path d="M256 222v18a16 16 0 0 1-16 16h-18" stroke={color} strokeWidth={3.5} strokeLinecap="round" />
      <Path d="M58 256H40a16 16 0 0 1-16-16v-18" stroke={color} strokeWidth={3.5} strokeLinecap="round" />

      {/* Soft guide rings */}
      <Circle cx={140} cy={140} r={92} fill={color} fillOpacity={0.05} />
      <Circle cx={140} cy={140} r={92} stroke={color} strokeOpacity={0.22} strokeWidth={1.5} strokeDasharray="3 7" strokeLinecap="round" />
      <Circle cx={140} cy={140} r={72} stroke={color} strokeOpacity={0.1} strokeWidth={1.5} />

      {/* Person — head and shoulders */}
      <Circle cx={140} cy={118} r={27} stroke={color} strokeWidth={3} />
      <Path
        d="M92 190c6-26 25-40 48-40s42 14 48 40"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* Scan sweep — soft falling gradient ending in a crisp line */}
      <Rect x={70} y={104} width={140} height={28} fill="url(#scanFade)" rx={2} />
      <Path d="M70 132h140" stroke={ACCENT} strokeWidth={2.5} strokeLinecap="round" />
      <Circle cx={70} cy={132} r={3.5} fill={ACCENT} />
      <Circle cx={210} cy={132} r={3.5} fill={ACCENT} />
    </Svg>
  );
}

export default function UploadIdSelfieScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 16;
  const params = useLocalSearchParams<{ applicationId: string }>();
  const applicationId = params.applicationId;
  const c = useColors();

  const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingBottom: 4 },
    backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: c.text },
    subtitle: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: c.mutedForeground, textAlign: "center", lineHeight: 22, marginTop: 20, paddingHorizontal: 40 },
    illustrationWrapper: { flex: 1, alignItems: "center", justifyContent: "center" },
    footer: { paddingHorizontal: 24, paddingTop: 8 },
    cta: { backgroundColor: c.primary, borderRadius: 14, paddingVertical: 18, alignItems: "center" },
    ctaText: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 16, color: WHITE },
  });

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => guardedBack("/(tabs)/profile")} activeOpacity={0.7}>
          <BackArrow color={c.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify with Selfie</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.subtitle}>
        Position your face within the frame,{"\n"}clear and well-lit.
      </Text>

      <View style={styles.illustrationWrapper}>
        <SelfieIllustration size={280} color={c.primary} />
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          style={styles.cta}
          onPress={() => guardedPush(() => router.push({ pathname: "/kyc/selfie-camera", params: { applicationId } } as any))}
          activeOpacity={0.88}
        >
          <Text style={styles.ctaText}>Take Selfie</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

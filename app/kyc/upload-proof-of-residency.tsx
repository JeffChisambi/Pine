import { guardedBack } from "@/utils/navigation";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

const TEAL = "#164951";
const GREEN = "#45B369";
const WHITE = "#FFFFFF";

function BackArrow({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19l-7-7 7-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UploadIcon({ color }: { color: string }) {
  return (
    <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
      <Path d="M16 4v16M10 10l6-6 6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 24h20" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

// ─── Illustration — untouched ─────────────────────────────────────────────────
function DocIllustration() {
  return (
    <View style={{ alignItems: "center", marginTop: 8, marginBottom: 4 }}>
      <Svg width={130} height={130} viewBox="0 0 130 130" fill="none">
        <Rect width={130} height={130} rx={65} fill="#164951" />
        <Rect x={30} y={25} width={70} height={80} rx={6} fill="#FFFFFF" />
        <Rect x={40} y={40} width={25} height={6} rx={2} fill="#2D5B62" />
        <Rect x={40} y={55} width={45} height={4} rx={1} fill="#45B369" />
        <Rect x={40} y={65} width={50} height={4} rx={1} fill="#45B369" />
        <Rect x={40} y={75} width={35} height={4} rx={1} fill="#45B369" />
        <Circle cx={85} cy={43} r={8} fill="#2D5B62" />
        <Rect x={70} y={90} width={20} height={4} rx={1} fill="#164951" />
      </Svg>
    </View>
  );
}

export default function UploadProofOfResidencyScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;
  const [uploaded, setUploaded] = useState(false);
  const c = useColors();

  const canContinue = uploaded;

  const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text },
    scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingBottom: 40, gap: 20 },
    descBlock: { gap: 8, alignItems: "center" },
    descTitle: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 20, color: c.text, textAlign: "center" },
    descSub: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: c.mutedForeground, lineHeight: 22, textAlign: "center" },
    slotsContainer: { gap: 12 },
    uploadSlot: { backgroundColor: c.card, borderRadius: 12, borderWidth: 1.5, borderColor: c.border, borderStyle: "dashed", alignItems: "center", justifyContent: "center", paddingVertical: 28, gap: 8 },
    uploadSlotDone: { borderColor: GREEN, backgroundColor: "#F0FDF4", borderStyle: "solid" },
    uploadIconArea: { width: 56, height: 56, borderRadius: 28, backgroundColor: c.border, alignItems: "center", justifyContent: "center" },
    uploadLabel: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text },
    uploadLabelDone: { color: "#166534" },
    uploadHint: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: c.mutedForeground },
    tipBox: { flexDirection: "row", gap: 10, backgroundColor: c.card, borderRadius: 10, padding: 14, alignItems: "flex-start", borderWidth: 1, borderColor: c.border },
    tipText: { flex: 1, fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: TEAL, lineHeight: 20 },
    footer: { paddingHorizontal: 24, paddingTop: 12, backgroundColor: c.background, borderTopWidth: 1, borderTopColor: c.border },
    continueBtn: { backgroundColor: TEAL, borderRadius: 12, paddingVertical: 18, alignItems: "center" },
    continueBtnDisabled: { backgroundColor: "#A0B8BC" },
    continueBtnText: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 16, color: WHITE },
  });

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => guardedBack("/(tabs)/profile")}>
          <BackArrow color={c.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Proof of Residency</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <DocIllustration />

        <View style={styles.descBlock}>
          <Text style={styles.descTitle}>Address Verification</Text>
          <Text style={styles.descSub}>
            Upload a recent utility bill, bank statement, or tax document showing your full name and residential address.
          </Text>
        </View>

        <View style={styles.slotsContainer}>
          <TouchableOpacity
            style={[styles.uploadSlot, uploaded && styles.uploadSlotDone]}
            onPress={() => setUploaded((v) => !v)}
            activeOpacity={0.8}
          >
            <View style={styles.uploadIconArea}>
              <UploadIcon color={uploaded ? GREEN : c.mutedForeground} />
            </View>
            <Text style={[styles.uploadLabel, uploaded && styles.uploadLabelDone]}>
              {uploaded ? "✓ Uploaded" : "Upload Document"}
            </Text>
            <Text style={styles.uploadHint}>
              {uploaded ? "Tap to replace" : "JPG, PNG or PDF • Max 5MB"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tipBox}>
          <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
            <Circle cx={8} cy={8} r={7} stroke={TEAL} strokeWidth={1.5} />
            <Path d="M8 7v5M8 5v1" stroke={TEAL} strokeWidth={1.5} strokeLinecap="round" />
          </Svg>
          <Text style={styles.tipText}>
            Must be issued within the last 3 months. Ensure all text is legible.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
          onPress={() => canContinue && router.push("/kyc/proof-of-residency" as any)}
          activeOpacity={canContinue ? 0.88 : 1}
        >
          <Text style={styles.continueBtnText}>
            {canContinue ? "Continue" : "Upload document to continue"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

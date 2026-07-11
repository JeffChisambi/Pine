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
import Svg, { Path, Circle, Rect, G, Defs, ClipPath } from "react-native-svg";

const TEAL = "#164951";
const CARD_TEAL = "#2D5B62";
const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const DARK = "#111827";
const MUTED = "#9CA3AF";
const DIVIDER = "#EBECEF";
const CARD_BG = "#F9FAFB";
const CARD_BORDER = "#F3F4F6";

function BackArrow() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M12.5 5.5L7.5 10l5 4.5" stroke={DARK} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UploadIcon({ color = MUTED }: { color?: string }) {
  return (
    <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
      <Path d="M16 4v16M10 10l6-6 6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 24h20" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function DocIllustration() {
  return (
    <View style={styles.heroContainer}>
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

function UploadSlot({
  label,
  uploaded,
  onPress,
}: {
  label: string;
  uploaded: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.uploadSlot, uploaded && styles.uploadSlotDone]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.uploadIconArea}>
        <UploadIcon color={uploaded ? GREEN : MUTED} />
      </View>
      <Text style={[styles.uploadLabel, uploaded && styles.uploadLabelDone]}>
        {uploaded ? "✓ Uploaded" : label}
      </Text>
      <Text style={styles.uploadHint}>
        {uploaded ? "Tap to replace" : "JPG, PNG or PDF • Max 5MB"}
      </Text>
    </TouchableOpacity>
  );
}

export default function UploadProofOfResidencyScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;
  const [uploaded, setUploaded] = useState(false);

  const canContinue = uploaded;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <BackArrow />
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
          <UploadSlot
            label="Upload Document"
            uploaded={uploaded}
            onPress={() => setUploaded((v) => !v)}
          />
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WHITE },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, backgroundColor: CARD_BG, borderRadius: 12, borderWidth: 1, borderColor: CARD_BORDER, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: DARK },
  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingBottom: 40, gap: 20 },
  heroContainer: { alignItems: "center", marginTop: 8, marginBottom: 4 },
  descBlock: { gap: 8, alignItems: "center" },
  descTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: DARK, textAlign: "center" },
  descSub: { fontFamily: "Inter_400Regular", fontSize: 14, color: MUTED, lineHeight: 22, textAlign: "center" },
  slotsContainer: { gap: 12 },
  uploadSlot: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: CARD_BORDER,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    gap: 8,
  },
  uploadSlotDone: {
    borderColor: GREEN,
    backgroundColor: "#F0FDF4",
    borderStyle: "solid",
  },
  uploadIconArea: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: DIVIDER,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: DARK },
  uploadLabelDone: { color: "#166534" },
  uploadHint: { fontFamily: "Inter_400Regular", fontSize: 12, color: MUTED },
  tipBox: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#EFF6F8",
    borderRadius: 10,
    padding: 14,
    alignItems: "flex-start",
  },
  tipText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 13, color: TEAL, lineHeight: 20 },
  footer: { paddingHorizontal: 24, paddingTop: 12, backgroundColor: WHITE, borderTopWidth: 1, borderTopColor: CARD_BORDER },
  continueBtn: { backgroundColor: TEAL, borderRadius: 12, paddingVertical: 18, alignItems: "center" },
  continueBtnDisabled: { backgroundColor: "#A0B8BC" },
  continueBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: WHITE },
});

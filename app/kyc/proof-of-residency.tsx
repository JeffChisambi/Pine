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
import Svg, { Path, Circle, Rect, G, Defs, ClipPath } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

const TEAL = "#164951";
const CARD_TEAL = "#2D5B62";
const WHITE = "#FFFFFF";

function BackArrow({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19l-7-7 7-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Icons — untouched ────────────────────────────────────────────────────────
function IdIcon() {
  return (
    <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
      <G clipPath="url(#clip0_3132_11307)">
        <Rect width={40} height={40} rx={20} fill="#2D5B62" />
        <Rect x={8} y={10} width={24} height={32} rx={2} fill="#FFFFFF" />
        <Circle cx={20} cy={21} r={8} fill="#164951" />
        <Path d="M21.7186 18.8125C21.6421 19.8451 20.8593 20.6875 19.9999 20.6875C19.1405 20.6875 18.3563 19.8453 18.2811 18.8125C18.203 17.7383 18.9647 16.9375 19.9999 16.9375C21.035 16.9375 21.7968 17.7578 21.7186 18.8125Z" stroke="#FFFFFF" strokeWidth={0.5} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M20 21.9375C18.3008 21.9375 16.5762 22.875 16.2571 24.6445C16.2186 24.8578 16.3393 25.0625 16.5625 25.0625H23.4375C23.661 25.0625 23.7817 24.8578 23.7432 24.6445C23.4239 22.875 21.6993 21.9375 20 21.9375Z" stroke="#FFFFFF" strokeWidth={0.5} strokeMiterlimit={10} />
        <Rect x={12} y={31} width={16} height={3} rx={0.5} fill="#2D5B62" />
        <Rect x={14} y={35} width={12} height={2} rx={0.5} fill="#2D5B62" />
      </G>
      <Defs>
        <ClipPath id="clip0_3132_11307">
          <Rect width={40} height={40} rx={20} fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}

function PassportIcon() {
  return (
    <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
      <G clipPath="url(#clip_passport)">
        <Rect width={40} height={40} rx={20} fill="#2D5B62" />
        <Rect x={6} y={12} width={28} height={20} rx={2} fill="#FFFFFF" />
        <Rect x={19.5} y={12} width={1} height={20} fill="#164951" opacity={0.25} />
        <Rect x={9} y={15} width={5} height={6} rx={1} fill="#164951" />
        <Rect x={9} y={23} width={7} height={1.5} rx={0.75} fill="#164951" />
        <Rect x={9} y={26} width={5} height={1.5} rx={0.75} fill="#164951" />
        <Rect x={22} y={15} width={9} height={1.5} rx={0.75} fill="#164951" />
        <Rect x={22} y={19} width={7} height={1.5} rx={0.75} fill="#164951" />
        <Rect x={22} y={23} width={8} height={1.5} rx={0.75} fill="#164951" />
        <Rect x={22} y={27} width={5} height={1.5} rx={0.75} fill="#164951" />
      </G>
      <Defs>
        <ClipPath id="clip_passport">
          <Rect width={40} height={40} rx={20} fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}

const DOCS = [
  { id: "national_id", title: "National ID", sub: "Government-issued identity card" },
  { id: "passport", title: "Passport", sub: "Valid international passport" },
];

export default function ProofOfResidencyScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;
  const [selected, setSelected] = useState("national_id");
  const c = useColors();

  const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text },
    scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingBottom: 40, gap: 24 },
    descBlock: { gap: 8, alignItems: "center" },
    descTitle: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 20, color: c.text, textAlign: "center" },
    descSub: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: c.mutedForeground, lineHeight: 22, textAlign: "center" },
    docsGroup: { backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, overflow: "hidden" },
    docRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16, gap: 14, backgroundColor: c.card },
    docRowActive: { backgroundColor: TEAL },
    docIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.border, alignItems: "center", justifyContent: "center" },
    docIconWrapActive: { backgroundColor: CARD_TEAL },
    docTextBlock: { flex: 1 },
    docLabel: { fontFamily: "PlusJakartaSans_500Medium", fontSize: 14, color: c.text, marginBottom: 2 },
    docLabelActive: { color: WHITE },
    docSub: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: c.mutedForeground },
    docSubActive: { color: "rgba(255,255,255,0.65)" },
    radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: c.border, alignItems: "center", justifyContent: "center" },
    radioOuterActive: { borderColor: WHITE },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: WHITE },
    rowDivider: { height: 1, backgroundColor: c.border, marginHorizontal: 16 },
    footer: { paddingHorizontal: 24, paddingTop: 12, backgroundColor: c.background, borderTopWidth: 1, borderTopColor: c.border },
    continueBtn: { backgroundColor: TEAL, borderRadius: 12, paddingVertical: 18, alignItems: "center" },
    continueBtnText: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 16, color: WHITE },
  });

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => guardedBack("/(tabs)/profile")}>
          <BackArrow color={c.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Verification Method</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.descBlock}>
          <Text style={styles.descTitle}>Choose Verification Method</Text>
          <Text style={styles.descSub}>
            Select the type of government-issued ID you would like to verify your identity with.
          </Text>
        </View>

        <View style={styles.docsGroup}>
          {DOCS.map((doc, i) => {
            const isActive = selected === doc.id;
            return (
              <View key={doc.id}>
                <TouchableOpacity
                  style={[styles.docRow, isActive && styles.docRowActive]}
                  onPress={() => setSelected(doc.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.docIconWrap, isActive && styles.docIconWrapActive]}>
                    {doc.id === "national_id" ? <IdIcon /> : <PassportIcon />}
                  </View>
                  <View style={styles.docTextBlock}>
                    <Text style={[styles.docLabel, isActive && styles.docLabelActive]}>{doc.title}</Text>
                    <Text style={[styles.docSub, isActive && styles.docSubActive]}>{doc.sub}</Text>
                  </View>
                  <View style={[styles.radioOuter, isActive && styles.radioOuterActive]}>
                    {isActive && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
                {i < DOCS.length - 1 && <View style={[styles.rowDivider, isActive && { backgroundColor: "transparent" }]} />}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => router.push("/kyc/upload-id" as any)}
          activeOpacity={0.88}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

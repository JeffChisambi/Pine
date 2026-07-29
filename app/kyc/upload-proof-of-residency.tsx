/**
 * Upload Proof of Residency screen.
 *
 * Final step before KYC processing is triggered.
 * Accepts: JPEG, PNG, or PDF (utility bill / bank statement / tax document).
 * Size limit: 8 MB (enforced client-side; backend enforces 10 MB).
 * Single document only — prevents multi-upload abuse.
 *
 * Flow: upload-id → upload-id-selfie → selfie-camera → HERE → verify-success
 */
import { guardedBack } from "@/utils/navigation";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { useColors } from "@/hooks/useColors";
import { kycApi } from "../../services/api";

const TEAL  = "#164951";
const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

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

function PdfIcon() {
  return (
    <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
      <Rect x={4} y={2} width={22} height={30} rx={3} fill="#FEE2E2" />
      <Rect x={4} y={2} width={22} height={30} rx={3} stroke="#EF4444" strokeWidth={1.5} />
      <Path d="M10 14h10M10 19h7" stroke="#EF4444" strokeWidth={1.5} strokeLinecap="round" />
      <Rect x={16} y={1} width={10} height={10} rx={2} fill="#EF4444" />
      <Path d="M18 5h6M18 8h4" stroke="#fff" strokeWidth={1.2} strokeLinecap="round" />
      <Path d="M10 24h4" stroke="#EF4444" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

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
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();

  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileMime, setFileMime] = useState<string>("image/jpeg");
  const [isPdf, setIsPdf] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const c = useColors();

  const canContinue = uploaded && !uploading && !processing;

  /** Pick an image (JPEG / PNG) from gallery */
  const pickImage = async () => {
    if (uploading || processing) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    await doUpload(asset.uri, asset.fileName ?? "address_doc.jpg", "image/jpeg");
  };

  /** Pick a PDF from the document picker */
  const pickPdf = async () => {
    if (uploading || processing) return;

    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    if (asset.size && asset.size > MAX_SIZE_BYTES) {
      Alert.alert("File Too Large", "PDF must be smaller than 8 MB. Please compress it and try again.");
      return;
    }

    await doUpload(asset.uri, asset.name ?? "address_doc.pdf", "application/pdf");
  };

  const doUpload = async (uri: string, name: string, mime: string) => {
    if (!applicationId) {
      Alert.alert("Session Error", "Verification session not found. Please start again.");
      guardedBack("/(tabs)/profile");
      return;
    }

    setFileUri(uri);
    setFileName(name);
    setFileMime(mime);
    setIsPdf(mime === "application/pdf");
    setUploaded(false);
    setUploading(true);

    try {
      await kycApi.uploadProofOfResidence(applicationId, uri, name, mime);
      setUploaded(true);
    } catch (err: any) {
      setFileUri(null);
      setFileName(null);
      const msg = typeof err?.message === "string" ? err.message : "Could not upload document. Please try again.";
      Alert.alert("Upload Failed", msg);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!canContinue || !applicationId) return;

    setProcessing(true);
    try {
      const result = await kycApi.process(applicationId);
      router.replace({
        pathname: "/kyc/verify-success",
        params: { decision: result.decision, confidenceScore: String(result.confidenceScore) },
      } as any);
    } catch (err: any) {
      const msg = typeof err?.message === "string" ? err.message : "Submission failed. Please try again.";
      Alert.alert("Submission Failed", msg);
    } finally {
      setProcessing(false);
    }
  };

  const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text },
    scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingBottom: 40, gap: 20 },
    descBlock: { gap: 8, alignItems: "center" },
    descTitle: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 20, color: c.text, textAlign: "center" },
    descSub: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: c.mutedForeground, lineHeight: 22, textAlign: "center" },
    uploadSlot: {
      backgroundColor: c.card,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: c.border,
      borderStyle: "dashed",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 28,
      gap: 8,
      overflow: "hidden",
    },
    uploadSlotDone: { borderColor: GREEN, backgroundColor: "#F0FDF4", borderStyle: "solid" },
    uploadIconArea: { width: 56, height: 56, borderRadius: 28, backgroundColor: c.border, alignItems: "center", justifyContent: "center" },
    uploadLabel: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text },
    uploadLabelDone: { color: "#166534" },
    uploadHint: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: c.mutedForeground },
    orRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    orLine: { flex: 1, height: 1, backgroundColor: c.border },
    orText: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: c.mutedForeground },
    pdfBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderColor: "#EF4444", borderRadius: 10, paddingVertical: 14, paddingHorizontal: 20 },
    pdfBtnText: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: "#EF4444" },
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
        <TouchableOpacity style={styles.backBtn} onPress={() => guardedBack("/kyc/selfie-camera")}>
          <BackArrow color={c.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Proof of Address</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <DocIllustration />

        <View style={styles.descBlock}>
          <Text style={styles.descTitle}>Address Verification</Text>
          <Text style={styles.descSub}>
            Upload a recent utility bill (water or electricity), bank statement, or tax document showing your full name and residential address.
          </Text>
        </View>

        {/* Image upload slot */}
        <TouchableOpacity
          style={[styles.uploadSlot, uploaded && styles.uploadSlotDone]}
          onPress={pickImage}
          activeOpacity={0.8}
          disabled={uploading || processing}
        >
          {uploading ? (
            <ActivityIndicator size="large" color={TEAL} />
          ) : fileUri && uploaded && !isPdf ? (
            <Image source={{ uri: fileUri }} style={{ width: "90%", height: 110, borderRadius: 8 }} contentFit="cover" />
          ) : fileUri && uploaded && isPdf ? (
            <PdfIcon />
          ) : (
            <View style={styles.uploadIconArea}>
              <UploadIcon color={c.mutedForeground} />
            </View>
          )}
          <Text style={[styles.uploadLabel, uploaded && styles.uploadLabelDone]}>
            {uploading ? "Uploading…" : uploaded ? `✓ ${fileName ?? "Document uploaded"}` : "Upload Image"}
          </Text>
          <Text style={styles.uploadHint}>
            {uploading ? "Please wait" : uploaded ? "Tap to replace" : "JPG or PNG • Max 8 MB"}
          </Text>
        </TouchableOpacity>

        {/* OR divider + PDF button */}
        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or upload a PDF</Text>
          <View style={styles.orLine} />
        </View>

        <TouchableOpacity
          style={styles.pdfBtn}
          onPress={pickPdf}
          disabled={uploading || processing}
          activeOpacity={0.8}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Rect x={3} y={2} width={14} height={19} rx={2} stroke="#EF4444" strokeWidth={1.8} />
            <Path d="M7 8h6M7 12h4" stroke="#EF4444" strokeWidth={1.6} strokeLinecap="round" />
          </Svg>
          <Text style={styles.pdfBtnText}>Pick PDF Bill • Max 8 MB</Text>
        </TouchableOpacity>

        <View style={styles.tipBox}>
          <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
            <Circle cx={8} cy={8} r={7} stroke={TEAL} strokeWidth={1.5} />
            <Path d="M8 7v5M8 5v1" stroke={TEAL} strokeWidth={1.5} strokeLinecap="round" />
          </Svg>
          <Text style={styles.tipText}>
            Must be issued within the last 3 months. Ensure your full name and address are clearly visible.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
          onPress={handleSubmit}
          activeOpacity={canContinue ? 0.88 : 1}
          disabled={!canContinue}
        >
          {processing ? (
            <ActivityIndicator color={WHITE} />
          ) : (
            <Text style={styles.continueBtnText}>
              {canContinue ? "Submit Verification" : "Upload document to continue"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

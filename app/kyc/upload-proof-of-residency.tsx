/**
 * Upload Proof of Residency screen.
 *
 * Final step before KYC processing is triggered.
 * Accepts: JPEG or PNG photo of a utility bill / bank statement / tax doc.
 * Size limit: 8 MB (enforced client-side).
 * Single document only — prevents multi-upload abuse.
 *
 * NOTE: PDF support requires a custom dev client rebuild (expo-document-picker).
 * Until then, instruct users to photograph their document.
 *
 * Flow: upload-id -> selfie-camera -> HERE -> under-review
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
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { useColors } from "@/hooks/useColors";
import { kycApi } from "../../services/api";

const TEAL  = "#164951";
const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB client guard

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

function CameraIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={12} cy={13} r={4} stroke={color} strokeWidth={1.8} />
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
  const topPad = Platform.OS === "web" ? 48 : insets.top || 16;
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();

  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const c = useColors();

  const canContinue = uploaded && !uploading && !processing;

  const pickFromGallery = async () => {
    if (uploading || processing) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.4,   // Compress at pick time to reduce upload size.
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_SIZE_BYTES) {
      Alert.alert("File Too Large", "Image must be smaller than 8 MB. Please compress it and try again.");
      return;
    }
    await doUpload(asset.uri, asset.fileName ?? "address_doc.jpg", "image/jpeg");
  };

  const pickFromCamera = async () => {
    if (uploading || processing) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera access is required to photograph your document.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.4,   // Compress at capture time to reduce upload size.
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) return;
    await doUpload(result.assets[0].uri, "address_doc_camera.jpg", "image/jpeg");
  };

  const doUpload = async (uri: string, name: string, mime: string) => {
    if (!applicationId) {
      Alert.alert("Please Start Over", "Your verification session has expired. Please start again.");
      guardedBack("/(tabs)/profile");
      return;
    }

    setFileUri(uri);
    setFileName(name);
    setUploaded(false);
    setUploading(true);

    try {
      await kycApi.uploadProofOfResidence(applicationId, uri, name, mime);
      setUploaded(true);
    } catch (err: any) {
      setFileUri(null);
      setFileName(null);
      // Map HTTP status codes to friendly messages
      const status = err?.statusCode ?? err?.status;
      let msg = "Could not upload your document. Please try again.";
      if (status === 413) {
        msg = "Your image is too large. Please take a new photo or choose a smaller image.";
      } else if (status === 415) {
        msg = "This file type is not supported. Please upload a JPG or PNG photo.";
      } else if (status === 401 || status === 403) {
        msg = "Your session has expired. Please log in again.";
      } else if (status >= 500) {
        msg = "Something went wrong on our end. Please try again in a moment.";
      } else if (typeof err?.message === "string" && !err.message.includes("HTTP")) {
        msg = err.message;
      }
      Alert.alert("Upload Failed", msg);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!canContinue || !applicationId) return;

    setProcessing(true);
    try {
      // Trigger AI pipeline — but we always show "Under Review" to the user.
      // The final APPROVED/REJECTED decision is made by a human broker in
      // Kusata, not by the automated pipeline. This prevents users from
      // seeing a confusing automatic rejection immediately after submitting.
      await kycApi.process(applicationId);
      router.replace("/kyc/under-review" as any);
    } catch (err: any) {
      const status = err?.statusCode ?? err?.status;
      let msg = "Submission failed. Please try again.";
      if (status >= 500) {
        msg = "Something went wrong on our end. Your documents were saved — please try submitting again.";
      } else if (typeof err?.message === "string" && !err.message.includes("HTTP")) {
        msg = err.message;
      }
      Alert.alert("Submission Failed", msg);
    } finally {
      setProcessing(false);
    }
  };

  const styles = StyleSheet.create({
    root:           { flex: 1, backgroundColor: c.background },
    header:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingBottom: 16 },
    backBtn:        { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    headerTitle:    { fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text },
    scroll:         { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingBottom: 40, gap: 20 },
    descBlock:      { gap: 8, alignItems: "center" },
    descTitle:      { fontFamily: "PlusJakartaSans_700Bold", fontSize: 20, color: c.text, textAlign: "center" },
    descSub:        { fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: c.mutedForeground, lineHeight: 22, textAlign: "center" },
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
    uploadLabel:    { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text },
    uploadLabelDone: { color: "#166534" },
    uploadHint:     { fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: c.mutedForeground },
    orRow:          { flexDirection: "row", alignItems: "center", gap: 10 },
    orLine:         { flex: 1, height: 1, backgroundColor: c.border },
    orText:         { fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: c.mutedForeground },
    cameraBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderWidth: 1.5,
      borderColor: TEAL,
      borderRadius: 10,
      paddingVertical: 14,
      paddingHorizontal: 20,
    },
    cameraBtnText:  { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: TEAL },
    tipBox: {
      flexDirection: "row",
      gap: 10,
      backgroundColor: c.card,
      borderRadius: 10,
      padding: 14,
      alignItems: "flex-start",
      borderWidth: 1,
      borderColor: c.border,
    },
    tipText: { flex: 1, fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: TEAL, lineHeight: 20 },
    footer: {
      paddingHorizontal: 24,
      paddingTop: 12,
      backgroundColor: c.background,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    continueBtn:         { backgroundColor: TEAL, borderRadius: 12, paddingVertical: 18, alignItems: "center" },
    continueBtnDisabled: { backgroundColor: "#A0B8BC" },
    continueBtnText:     { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 16, color: WHITE },
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
            Upload or photograph a recent utility bill (water or electricity), bank statement, or tax document showing your full name and address.
          </Text>
        </View>

        {/* Gallery upload slot */}
        <TouchableOpacity
          style={[styles.uploadSlot, uploaded && styles.uploadSlotDone]}
          onPress={pickFromGallery}
          activeOpacity={0.8}
          disabled={uploading || processing}
        >
          {uploading ? (
            <ActivityIndicator size="large" color={TEAL} />
          ) : fileUri && uploaded ? (
            <Image source={{ uri: fileUri }} style={{ width: "90%", height: 110, borderRadius: 8 }} contentFit="cover" />
          ) : (
            <View style={styles.uploadIconArea}>
              <UploadIcon color={c.mutedForeground} />
            </View>
          )}
          <Text style={[styles.uploadLabel, uploaded && styles.uploadLabelDone]}>
            {uploading ? "Uploading…" : uploaded ? `✓ ${fileName ?? "Document uploaded"}` : "Choose from Gallery"}
          </Text>
          <Text style={styles.uploadHint}>
            {uploading ? "Please wait" : uploaded ? "Tap to replace" : "JPG or PNG • Max 8 MB"}
          </Text>
        </TouchableOpacity>

        {/* OR camera option */}
        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or take a photo</Text>
          <View style={styles.orLine} />
        </View>

        <TouchableOpacity
          style={styles.cameraBtn}
          onPress={pickFromCamera}
          disabled={uploading || processing}
          activeOpacity={0.8}
        >
          <CameraIcon color={TEAL} />
          <Text style={styles.cameraBtnText}>Open Camera</Text>
        </TouchableOpacity>

        <View style={styles.tipBox}>
          <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
            <Circle cx={8} cy={8} r={7} stroke={TEAL} strokeWidth={1.5} />
            <Path d="M8 7v5M8 5v1" stroke={TEAL} strokeWidth={1.5} strokeLinecap="round" />
          </Svg>
          <Text style={styles.tipText}>
            Must be issued within the last 3 months. Ensure your full name and address are clearly visible and legible.
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

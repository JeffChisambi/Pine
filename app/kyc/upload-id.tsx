import React, { useState, useEffect, useRef } from "react";
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
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Svg, { Path, Circle, Rect, G, Defs, ClipPath, Ellipse } from "react-native-svg";
import { kycApi } from "../../services/api";
import { useAuth } from "../../services/auth-context";

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

function CheckIcon() {
  return (
    <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
      <Circle cx={16} cy={16} r={14} fill={GREEN} />
      <Path d="M10 16l4 4 8-8" stroke={WHITE} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IdIllustration() {
  return (
    <View style={styles.heroContainer}>
      <Svg width={130} height={130} viewBox="0 0 130 130" fill="none">
        <Defs>
          <ClipPath id="clip0">
            <Rect width={130} height={130} rx={65} fill="white" />
          </ClipPath>
          <ClipPath id="clip1">
            <Rect x={16} y={33} width={46} height={50} rx={4} fill="white" />
          </ClipPath>
        </Defs>
        <Rect width={130} height={130} rx={65} fill="#164951" />
        <G clipPath="url(#clip0)">
          <Circle cx={108.875} cy={101.292} r={45.5} stroke="#2D5B62" strokeWidth={1.08333} />
          <Circle cx={79.625} cy={17.875} r={53.0833} stroke="#2D5B62" strokeWidth={1.08333} />
          <Circle cx={36.0417} cy={108.042} r={7.04167} fill="#2D5B62" />
        </G>
        <Rect x={6} y={23} width={118} height={85} rx={6} fill="#45B369" />
        <Rect x={70} y={35} width={44} height={13} rx={3} fill="white" />
        <Rect x={70} y={55} width={31} height={4} rx={1} fill="#164951" />
        <Rect x={70} y={67} width={23} height={4} rx={1} fill="#164951" />
        <Rect x={95} y={67} width={10} height={4} rx={1} fill="#164951" />
        <Rect x={70} y={79} width={21} height={4} rx={1} fill="#164951" />
        <Rect x={93} y={79} width={21} height={4} rx={1} fill="#164951" />
        <G clipPath="url(#clip1)">
          <Rect x={16} y={33} width={46} height={50} rx={4} fill="#FFFFFF" />
          <Path d="M41.87 69.57C41.86 69.57 41.86 69.57 41.86 69.57L41.84 69.55V65.7C41.84 65.7 41.84 65.69 41.85 65.68C44.62 64.98 47.04 63.33 48.65 61.01C50.25 58.69 50.95 55.88 50.6 53.09C50.24 50.31 48.88 47.74 46.74 45.88C44.6 44.03 41.85 43 39 43C36.15 43 33.4 44.03 31.26 45.88C29.13 47.74 27.75 50.31 27.4 53.09C27.05 55.88 27.74 58.69 29.35 61.01C30.96 63.33 33.37 64.98 36.14 65.67C36.14 65.67 36.15 65.69 36.16 65.7V69.54C36.16 69.55 36.16 69.55 36.15 69.55L36.14 69.57C36.13 69.57 36.13 69.57 36.13 69.57C35.52 69.54 26.01 69.41 26 86.97C26 86.98 26 86.98 26.01 86.99C26.01 87 26.02 87 26.03 87H51.97C51.97 87 51.98 87 51.98 87C51.98 87 51.99 86.99 51.99 86.99C52 86.98 52 86.97 52 86.97C51.98 69.41 42.48 69.54 41.87 69.57Z" fill="#164951" />
        </G>
        <Rect x={16} y={88} width={46} height={10} rx={2.16667} fill="white" />
      </Svg>
    </View>
  );
}

function UploadSlot({
  label,
  imageUri,
  uploading,
  onPress,
}: {
  label: string;
  imageUri: string | null;
  uploading: boolean;
  onPress: () => void;
}) {
  const uploaded = !!imageUri && !uploading;
  return (
    <TouchableOpacity
      style={[styles.uploadSlot, uploaded && styles.uploadSlotDone]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={uploading}
    >
      {uploading ? (
        <ActivityIndicator size="large" color={TEAL} />
      ) : imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="cover" />
      ) : (
        <View style={styles.uploadIconArea}>
          <UploadIcon color={MUTED} />
        </View>
      )}
      <Text style={[styles.uploadLabel, uploaded && styles.uploadLabelDone]}>
        {uploading ? "Uploading..." : uploaded ? "✓ Uploaded" : label}
      </Text>
      <Text style={styles.uploadHint}>
        {uploading ? "Please wait" : uploaded ? "Tap to replace" : "Tap to take photo or choose from gallery"}
      </Text>
    </TouchableOpacity>
  );
}

export default function UploadIdScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;
  const { user } = useAuth();

  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [frontUri, setFrontUri] = useState<string | null>(null);
  const [backUri, setBackUri] = useState<string | null>(null);
  const [frontUploading, setFrontUploading] = useState(false);
  const [backUploading, setBackUploading] = useState(false);
  const [starting, setStarting] = useState(true);
  const startedRef = useRef(false);

  // Start KYC application on mount
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        if (!user?.id) {
          Alert.alert("Error", "Please log in to start verification.");
          router.back();
          return;
        }
        const result = await kycApi.start();
        setApplicationId(result.applicationId);
      } catch (err: any) {
        console.error('[KYC Start Error]', JSON.stringify(err, null, 2));
        let msg = 'Failed to start verification. Please try again.';
        if (typeof err === 'string') msg = err;
        else if (typeof err?.message === 'string') msg = err.message;
        else if (err?.body?.error?.message) msg = String(err.body.error.message);
        Alert.alert("Error", msg);
        router.back();
      } finally {
        setStarting(false);
      }
    })();
  }, []);

  const pickAndUpload = async (side: "front" | "back") => {
    if (!applicationId) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [16, 10],
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const setUri = side === "front" ? setFrontUri : setBackUri;
    const setUploading = side === "front" ? setFrontUploading : setBackUploading;

    setUri(asset.uri);
    setUploading(true);

    try {
      const fileName = side === "front" ? "id_front.jpg" : "id_back.jpg";
      await kycApi.uploadId(applicationId, asset.uri, fileName);
    } catch (err: any) {
      setUri(null);
      const msg = typeof err?.message === 'string' ? err.message : 'Could not upload image. Please try again.';
      Alert.alert("Upload Failed", msg);
    } finally {
      setUploading(false);
    }
  };

  const canContinue = !!frontUri && !!backUri && !frontUploading && !backUploading;

  if (starting) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: topPad }]}>
        <ActivityIndicator size="large" color={TEAL} />
        <Text style={[styles.uploadHint, { marginTop: 12 }]}>Starting verification...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <BackArrow />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Photo ID</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <IdIllustration />

        <View style={styles.descBlock}>
          <Text style={styles.descTitle}>Photo ID Verification</Text>
          <Text style={styles.descSub}>
            Upload a clear photo of both sides of your National ID card.
          </Text>
        </View>

        <View style={styles.slotsContainer}>
          <UploadSlot
            label="Front of ID"
            imageUri={frontUri}
            uploading={frontUploading}
            onPress={() => pickAndUpload("front")}
          />
          <UploadSlot
            label="Back of ID"
            imageUri={backUri}
            uploading={backUploading}
            onPress={() => pickAndUpload("back")}
          />
        </View>

        <View style={styles.tipBox}>
          <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
            <Circle cx={8} cy={8} r={7} stroke={TEAL} strokeWidth={1.5} />
            <Path d="M8 7v5M8 5v1" stroke={TEAL} strokeWidth={1.5} strokeLinecap="round" />
          </Svg>
          <Text style={styles.tipText}>
            Ensure all 4 corners are visible, text is legible, and there are no glare or shadows.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
          onPress={() => canContinue && router.push({ pathname: "/kyc/upload-id-selfie", params: { applicationId } } as any)}
          activeOpacity={canContinue ? 0.88 : 1}
        >
          <Text style={styles.continueBtnText}>
            {canContinue ? "Continue" : "Upload both sides to continue"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WHITE },
  centered: { alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, backgroundColor: CARD_BG, borderRadius: 12, borderWidth: 1, borderColor: CARD_BORDER, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: DARK },
  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingBottom: 40, gap: 20 },
  heroContainer: { alignItems: "center", marginTop: 8, marginBottom: 4 },
  descBlock: { gap: 8, alignItems: "center" },
  descTitle: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 20, color: DARK, textAlign: "center" },
  descSub: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: MUTED, lineHeight: 22, textAlign: "center" },
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
    overflow: "hidden",
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
  previewImage: {
    width: "90%",
    height: 100,
    borderRadius: 8,
  },
  uploadLabel: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: DARK },
  uploadLabelDone: { color: "#166534" },
  uploadHint: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED },
  tipBox: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#EFF6F8",
    borderRadius: 10,
    padding: 14,
    alignItems: "flex-start",
  },
  tipText: { flex: 1, fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: TEAL, lineHeight: 20 },
  footer: { paddingHorizontal: 24, paddingTop: 12, backgroundColor: WHITE, borderTopWidth: 1, borderTopColor: CARD_BORDER },
  continueBtn: { backgroundColor: TEAL, borderRadius: 12, paddingVertical: 18, alignItems: "center" },
  continueBtnDisabled: { backgroundColor: "#A0B8BC" },
  continueBtnText: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 16, color: WHITE },
});

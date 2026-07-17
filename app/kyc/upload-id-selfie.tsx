import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Svg, { Path, Circle, Ellipse } from "react-native-svg";
import { kycApi } from "../../services/api";
import { useAuth } from "../../services/auth-context";

const TEAL = "#164951";
const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const DARK = "#111827";
const MUTED = "#9CA3AF";
const CARD_BG = "#F9FAFB";
const CARD_BORDER = "#F3F4F6";

function BackArrow() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M12.5 5.5L7.5 10l5 4.5" stroke={DARK} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FaceFrame({ captured, imageUri }: { captured: boolean; imageUri: string | null }) {
  const size = 220;
  return (
    <View style={[styles.faceFrameOuter, { width: size, height: size }]}>
      {/* Corner guides */}
      {[
        { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
        { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
        { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
        { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
      ].map((corner, idx) => (
        <View
          key={idx}
          style={[styles.corner, corner as any, { borderColor: captured ? GREEN : WHITE }]}
        />
      ))}
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.selfiePreview} contentFit="cover" />
      ) : (
        <Svg width={size} height={size} viewBox="0 0 220 220" fill="none">
          <Ellipse cx={110} cy={90} rx={42} ry={50} fill="rgba(255,255,255,0.15)" />
          <Path
            d="M30 200C30 160 65 140 110 140s80 20 80 60"
            fill="rgba(255,255,255,0.15)"
          />
        </Svg>
      )}
    </View>
  );
}

export default function UploadIdSelfieScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;
  const { user, refreshProfile } = useAuth();
  const params = useLocalSearchParams<{ applicationId: string }>();
  const applicationId = params.applicationId;

  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const takeSelfie = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
      cameraType: ImagePicker.CameraType.front,
    });

    if (result.canceled || !result.assets[0]) return;
    setSelfieUri(result.assets[0].uri);
  };

  const uploadAndProcess = async () => {
    if (!selfieUri || !applicationId) return;

    setUploading(true);
    try {
      // 1. Upload selfie
      await kycApi.uploadSelfie(applicationId, selfieUri);

      // 2. Trigger verification pipeline
      setUploading(false);
      setProcessing(true);
      const result = await kycApi.process(applicationId);

      // 3. Refresh profile so kycStatus updates
      await refreshProfile();

      // 4. Navigate to result screen
      router.replace({
        pathname: "/kyc/verify-success",
        params: {
          decision: result.decision,
          confidenceScore: String(result.confidenceScore),
        },
      } as any);
    } catch (err: any) {
      const msg = typeof err?.message === 'string' ? err.message : 'Something went wrong. Please try again.';
      Alert.alert("Verification Failed", msg);
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const captured = !!selfieUri;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <BackArrow />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Identity Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Camera viewfinder area */}
      <View style={styles.viewfinder}>
        <FaceFrame captured={captured} imageUri={selfieUri} />
        <Text style={styles.viewfinderHint}>
          {captured ? "Great photo!" : "Tap the button below to take a selfie"}
        </Text>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.descBlock}>
          <Text style={styles.descTitle}>Take a selfie</Text>
          <Text style={styles.descSub}>
            Make sure your face is clearly visible, well-lit, and looking directly at the camera. Remove glasses if you wear them.
          </Text>
        </View>

        <View style={styles.tipsRow}>
          {[
            { icon: "💡", text: "Good lighting" },
            { icon: "😐", text: "Neutral expression" },
            { icon: "👁", text: "Eyes open" },
          ].map((tip) => (
            <View key={tip.text} style={styles.tip}>
              <Text style={styles.tipEmoji}>{tip.icon}</Text>
              <Text style={styles.tipText}>{tip.text}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          {processing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color={TEAL} />
              <Text style={styles.processingText}>Verifying your identity...</Text>
              <Text style={styles.processingSubText}>This may take a moment</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.captureBtn, captured && styles.captureBtnDone]}
              onPress={() => {
                if (captured) {
                  uploadAndProcess();
                } else {
                  takeSelfie();
                }
              }}
              activeOpacity={0.88}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={WHITE} />
              ) : (
                <Text style={styles.captureBtnText}>
                  {captured ? "Submit & Verify" : "Take Selfie"}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {captured && !processing && !uploading && (
            <TouchableOpacity style={styles.retakeBtn} onPress={takeSelfie}>
              <Text style={styles.retakeBtnText}>Retake Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: TEAL },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingBottom: 16, zIndex: 10 },
  backBtn: { width: 40, height: 40, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, color: WHITE },
  viewfinder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  viewfinderHint: { fontFamily: "Poppins_500Medium", fontSize: 14, color: "rgba(255,255,255,0.7)" },
  faceFrameOuter: {
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 32,
    height: 32,
    borderColor: WHITE,
    zIndex: 2,
  },
  selfiePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
  bottomSheet: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  descBlock: { gap: 8, alignItems: "center", marginBottom: 16 },
  descTitle: { fontFamily: "Poppins_700Bold", fontSize: 20, color: DARK, textAlign: "center" },
  descSub: { fontFamily: "Poppins_400Regular", fontSize: 14, color: MUTED, lineHeight: 22, textAlign: "center" },
  tipsRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 20 },
  tip: { alignItems: "center", gap: 6 },
  tipEmoji: { fontSize: 24 },
  tipText: { fontFamily: "Poppins_400Regular", fontSize: 12, color: MUTED },
  footer: { gap: 12 },
  captureBtn: { backgroundColor: TEAL, borderRadius: 12, paddingVertical: 18, alignItems: "center" },
  captureBtnDone: { backgroundColor: GREEN },
  captureBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: WHITE },
  retakeBtn: { alignItems: "center", paddingVertical: 12 },
  retakeBtnText: { fontFamily: "Poppins_500Medium", fontSize: 14, color: TEAL },
  processingContainer: { alignItems: "center", gap: 12, paddingVertical: 16 },
  processingText: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: DARK },
  processingSubText: { fontFamily: "Poppins_400Regular", fontSize: 13, color: MUTED },
});

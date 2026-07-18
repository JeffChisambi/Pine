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
import Svg, { Path, Ellipse, Rect, G } from "react-native-svg";
import { kycApi } from "../../services/api";
import { useAuth } from "../../services/auth-context";

const TEAL        = "#164951";
const GREEN       = "#45B369";
const WHITE       = "#FFFFFF";
const DARK        = "#111827";
const MUTED       = "#6B7280";
const BG          = "#EAF3F4";   // light mint — mirrors the reference screenshot
const SCAN_TINT   = "rgba(69,179,105,0.18)";

// ─── Back arrow ───────────────────────────────────────────────────────────────
function BackArrow() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M12.5 5.5L7.5 10l5 4.5" stroke={DARK} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Face illustration ────────────────────────────────────────────────────────
// Matches the reference: octagonal outer ring, head oval, shoulder curve, scan band
function FaceIllustration({ size = 260 }: { size?: number }) {
  const cx = size / 2;
  const cy = size / 2;

  // Octagon points (flat-top, slightly wider than tall)
  const R = size * 0.42;
  const r = size * 0.30;
  const oct = Array.from({ length: 8 }, (_, i) => {
    const a = (Math.PI / 4) * i - Math.PI / 8;
    const rx = i % 2 === 0 ? R : R * 0.95;
    const ry = i % 2 === 0 ? R * 0.88 : R * 0.83;
    return `${cx + rx * Math.cos(a)},${cy + ry * Math.sin(a)}`;
  }).join(" ");

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      {/* Outer octagonal outline */}
      <Path
        d={`M ${oct} Z`}
        stroke={TEAL}
        strokeWidth={1.4}
        opacity={0.45}
        strokeLinejoin="round"
      />

      {/* Head oval */}
      <Ellipse
        cx={cx}
        cy={cy - size * 0.06}
        rx={size * 0.155}
        ry={size * 0.19}
        stroke={TEAL}
        strokeWidth={1.4}
        opacity={0.7}
      />

      {/* Shoulder / body arc */}
      <Path
        d={`M ${cx - size * 0.29} ${cy + size * 0.36}
            C ${cx - size * 0.29} ${cy + size * 0.12}
              ${cx - size * 0.14} ${cy + size * 0.09}
              ${cx} ${cy + size * 0.09}
            C ${cx + size * 0.14} ${cy + size * 0.09}
              ${cx + size * 0.29} ${cy + size * 0.12}
              ${cx + size * 0.29} ${cy + size * 0.36}`}
        stroke={TEAL}
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.7}
      />

      {/* Scan band — centred on head */}
      <Rect
        x={cx - size * 0.32}
        y={cy - size * 0.10}
        width={size * 0.64}
        height={size * 0.13}
        fill={SCAN_TINT}
        rx={4}
      />
      {/* Scan band top edge (brighter line) */}
      <Path
        d={`M ${cx - size * 0.32} ${cy - size * 0.04}
            Q ${cx} ${cy - size * 0.01}
              ${cx + size * 0.32} ${cy - size * 0.04}`}
        stroke={GREEN}
        strokeWidth={1.8}
        strokeLinecap="round"
        opacity={0.75}
      />
    </Svg>
  );
}

// ─── Corner bracket markers ───────────────────────────────────────────────────
function CornerBrackets({ size, color }: { size: number; color: string }) {
  const L = 28; // bracket arm length
  const T = 2.5;
  return (
    <>
      {/* TL */}
      <View style={[styles.corner, { top: 0, left: 0 }]}>
        <Svg width={L} height={L} viewBox={`0 0 ${L} ${L}`}>
          <Path d={`M ${L} ${T/2} H ${T/2} V ${L}`} stroke={color} strokeWidth={T} strokeLinecap="round" fill="none" />
        </Svg>
      </View>
      {/* TR */}
      <View style={[styles.corner, { top: 0, right: 0 }]}>
        <Svg width={L} height={L} viewBox={`0 0 ${L} ${L}`}>
          <Path d={`M 0 ${T/2} H ${L - T/2} V ${L}`} stroke={color} strokeWidth={T} strokeLinecap="round" fill="none" />
        </Svg>
      </View>
      {/* BL */}
      <View style={[styles.corner, { bottom: 0, left: 0 }]}>
        <Svg width={L} height={L} viewBox={`0 0 ${L} ${L}`}>
          <Path d={`M ${L} ${L - T/2} H ${T/2} V 0`} stroke={color} strokeWidth={T} strokeLinecap="round" fill="none" />
        </Svg>
      </View>
      {/* BR */}
      <View style={[styles.corner, { bottom: 0, right: 0 }]}>
        <Svg width={L} height={L} viewBox={`0 0 ${L} ${L}`}>
          <Path d={`M 0 ${L - T/2} H ${L - T/2} V 0`} stroke={color} strokeWidth={T} strokeLinecap="round" fill="none" />
        </Svg>
      </View>
    </>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function UploadIdSelfieScreen() {
  const insets   = useSafeAreaInsets();
  const topPad   = Platform.OS === "web" ? 48 : insets.top || 44;
  const { refreshProfile } = useAuth();
  const params   = useLocalSearchParams<{ applicationId: string }>();
  const applicationId = params.applicationId;

  const [selfieUri,  setSelfieUri]  = useState<string | null>(null);
  const [uploading,  setUploading]  = useState(false);
  const [processing, setProcessing] = useState(false);

  const captured = !!selfieUri;

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
      await kycApi.uploadSelfie(applicationId, selfieUri);
      setUploading(false);
      setProcessing(true);
      const result = await kycApi.process(applicationId);
      await refreshProfile();
      router.replace({
        pathname: "/kyc/verify-success",
        params: { decision: result.decision, confidenceScore: String(result.confidenceScore) },
      } as any);
    } catch (err: any) {
      const msg = typeof err?.message === "string" ? err.message : "Something went wrong. Please try again.";
      Alert.alert("Verification Failed", msg);
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const FRAME_SIZE = 280;
  const bracketColor = captured ? GREEN : TEAL;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <BackArrow />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify with Selfie</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Position your face within the frame,{"\n"}clear and well-lit.
      </Text>

      {/* Face frame */}
      <View style={styles.frameWrapper}>
        <View style={[styles.frameInner, { width: FRAME_SIZE, height: FRAME_SIZE }]}>
          <CornerBrackets size={FRAME_SIZE} color={bracketColor} />
          {selfieUri ? (
            <Image
              source={{ uri: selfieUri }}
              style={[styles.selfiePreview, { width: FRAME_SIZE - 32, height: FRAME_SIZE - 32 }]}
              contentFit="cover"
            />
          ) : (
            <FaceIllustration size={FRAME_SIZE - 24} />
          )}
        </View>
      </View>

      {/* Retake link when captured */}
      {captured && !processing && !uploading && (
        <TouchableOpacity style={styles.retakeBtn} onPress={takeSelfie} activeOpacity={0.7}>
          <Text style={styles.retakeBtnText}>Retake Photo</Text>
        </TouchableOpacity>
      )}

      {/* Processing state */}
      {processing && (
        <View style={styles.processingRow}>
          <ActivityIndicator size="small" color={TEAL} />
          <Text style={styles.processingText}>Verifying your identity…</Text>
        </View>
      )}

      {/* CTA button — pinned to bottom */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          style={[styles.cta, captured && { backgroundColor: GREEN }]}
          onPress={captured ? uploadAndProcess : takeSelfie}
          activeOpacity={0.88}
          disabled={uploading || processing}
        >
          {uploading ? (
            <ActivityIndicator color={WHITE} />
          ) : (
            <Text style={styles.ctaText}>{captured ? "Submit & Verify" : "Take Selfie"}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: WHITE,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: WHITE,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 17,
    color: DARK,
  },

  // Subtitle
  subtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    color: MUTED,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 20,
    paddingHorizontal: 40,
  },

  // Frame
  frameWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  frameInner: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  corner: {
    position: "absolute",
    zIndex: 2,
  },
  selfiePreview: {
    borderRadius: 16,
  },

  // Retake
  retakeBtn: {
    alignItems: "center",
    paddingVertical: 10,
  },
  retakeBtnText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 14,
    color: TEAL,
  },

  // Processing
  processingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 10,
  },
  processingText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 14,
    color: TEAL,
  },

  // Footer CTA
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  cta: {
    backgroundColor: TEAL,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
  },
  ctaText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 16,
    color: WHITE,
  },
});

import { guardedBack } from "@/utils/navigation";
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { kycApi } from "../../services/api";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/contexts/theme-context";

const TEAL    = "#164951";
const WHITE   = "#FFFFFF";
const BRACKET = "#3BA8A0";

const FRAME_SIZE = 300;

function BackArrow({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19l-7-7 7-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const BRACKET_LEN = 28;
const BRACKET_W   = 3;
const BRACKET_R   = 6;

function CornerBrackets({ size }: { size: number }) {
  const l = BRACKET_LEN;
  const w = BRACKET_W;
  const r = BRACKET_R;

  const corner = (pos: "tl" | "tr" | "bl" | "br") => {
    const base: any = { position: "absolute", width: l, height: l, borderColor: BRACKET, borderRadius: r };
    if (pos === "tl") return { ...base, top: 0,    left: 0,    borderTopWidth: w,    borderLeftWidth: w  };
    if (pos === "tr") return { ...base, top: 0,    right: 0,   borderTopWidth: w,    borderRightWidth: w };
    if (pos === "bl") return { ...base, bottom: 0, left: 0,    borderBottomWidth: w, borderLeftWidth: w  };
    return               { ...base, bottom: 0, right: 0,   borderBottomWidth: w, borderRightWidth: w };
  };

  return (
    <View style={{ position: "absolute", width: size, height: size }} pointerEvents="none">
      <View style={corner("tl")} />
      <View style={corner("tr")} />
      <View style={corner("bl")} />
      <View style={corner("br")} />
    </View>
  );
}

const DOTS = [
  { cx: 0.38, cy: 0.33, r: 4 }, { cx: 0.46, cy: 0.31, r: 3 }, { cx: 0.54, cy: 0.31, r: 3 },
  { cx: 0.62, cy: 0.33, r: 4 }, { cx: 0.50, cy: 0.44, r: 3 }, { cx: 0.42, cy: 0.58, r: 3 },
  { cx: 0.58, cy: 0.58, r: 3 }, { cx: 0.50, cy: 0.68, r: 4 }, { cx: 0.32, cy: 0.48, r: 3 },
  { cx: 0.68, cy: 0.48, r: 3 },
];

function ScanDots({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} style={{ position: "absolute" }} pointerEvents="none">
      {DOTS.map((d, i) => (
        <Circle key={i} cx={d.cx * size} cy={d.cy * size} r={d.r} fill={WHITE} opacity={0.9} />
      ))}
    </Svg>
  );
}

export default function SelfieCameraScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;
  const params = useLocalSearchParams<{ applicationId: string }>();
  const applicationId = params.applicationId;
  const c = useColors();
  const { isDark } = useTheme();

  const BG   = c.background;
  const MUTED = c.mutedForeground;

  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [uploading,  setUploading]  = useState(false);
  const [processing, setProcessing] = useState(false);

  // Guard: applicationId must be present — navigating directly to this screen
  // without going through upload-id would result in broken API calls.
  useEffect(() => {
    if (!applicationId) {
      Alert.alert(
        "Session Error",
        "Verification session not found. Please start the process again.",
        [{ text: "OK", onPress: () => guardedBack("/(tabs)/profile") }],
      );
    }
  }, [applicationId]);

  const handleCapture = async () => {
    if (!cameraRef.current || uploading || processing || !applicationId) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo?.uri) return;

      setUploading(true);
      await kycApi.uploadSelfie(applicationId, photo.uri);
      setUploading(false);

      // Navigate to proof-of-residence upload — processing happens after
      // all documents (ID front, ID back, selfie, address doc) are uploaded.
      router.push({
        pathname: "/kyc/upload-proof-of-residency",
        params: { applicationId },
      } as any);
    } catch (err: any) {
      const msg = typeof err?.message === "string" ? err.message : "Something went wrong. Please try again.";
      Alert.alert("Verification Failed", msg);
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };


  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: BG }} />;
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 16, paddingTop: topPad }}>
        <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 18, color: c.text, textAlign: "center" }}>Camera access needed</Text>
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: MUTED, textAlign: "center", lineHeight: 22 }}>
          Pine needs access to your camera to take your verification selfie.
        </Text>
        <TouchableOpacity style={{ backgroundColor: TEAL, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 40, marginTop: 8 }} onPress={requestPermission} activeOpacity={0.85}>
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 16, color: WHITE }}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const busy = uploading || processing;

  const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 4 },
    backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: c.text },
    subtitle: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: MUTED, textAlign: "center", lineHeight: 22, marginTop: 28, paddingHorizontal: 40 },
    frameOuter: { flex: 1, alignItems: "center", justifyContent: "center" },
    frame: { borderRadius: 16, overflow: "hidden", position: "relative", alignItems: "center", justifyContent: "center" },
    busyOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", gap: 12 },
    statusArea: { height: 64, alignItems: "center", justifyContent: "center", gap: 4 },
    statusLabel: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: MUTED },
    footer: { alignItems: "center", paddingTop: 8 },
    shutterRing: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: TEAL, alignItems: "center", justifyContent: "center" },
    shutterInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: TEAL },
  });

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => guardedBack("/(tabs)/profile")} activeOpacity={0.7} disabled={busy}>
          <BackArrow color={c.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Face recognition</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.subtitle}>Please look into the camera and hold still</Text>

      <View style={styles.frameOuter}>
        <View style={[styles.frame, { width: FRAME_SIZE, height: FRAME_SIZE }]}>
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={"front" as CameraType} />
          {!busy && <ScanDots size={FRAME_SIZE} />}
          <CornerBrackets size={FRAME_SIZE} />
          {busy && (
            <View style={styles.busyOverlay}>
              <ActivityIndicator size="large" color={WHITE} />
              <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 14, color: WHITE }}>
                {processing ? "Verifying…" : "Uploading…"}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Status area — shows a plain label while busy, empty otherwise */}
      <View style={styles.statusArea}>
        {processing && (
          <Text style={styles.statusLabel}>Verifying your face…</Text>
        )}
        {uploading && !processing && (
          <Text style={styles.statusLabel}>Uploading…</Text>
        )}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 32 }]}>
        <TouchableOpacity style={[styles.shutterRing, busy && { opacity: 0.5 }]} onPress={handleCapture} activeOpacity={0.8} disabled={busy}>
          <View style={styles.shutterInner} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

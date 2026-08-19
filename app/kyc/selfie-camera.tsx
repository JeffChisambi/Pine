import { guardedBack } from "@/utils/navigation";
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCameraFormat,
  useFrameProcessor,
  runAtTargetFps,
} from "react-native-vision-camera";
import { useFaceDetector, type Face } from "react-native-vision-camera-face-detector";
import { Worklets } from "react-native-worklets-core";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import Svg, { Path, Ellipse } from "react-native-svg";
import { kycApi, getErrorMessage, logHandledError } from "../../services/api";
import { useColors } from "@/hooks/useColors";

const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const DIM   = "rgba(9,14,18,0.74)";

// ─── Tuning knobs (verify on device) ──────────────────────────────────────────
const CENTER_YAW_MAX = 14;   // |yawAngle| below this = looking straight
const EYE_OPEN_MIN   = 0.4;  // require at least one eye open (basic anti-photo)
const DETECT_FPS     = 4;    // run face detection this many times / second
const STEADY_FRAMES  = 3;    // consecutive good detections before auto-capture

function BackArrow({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19l-7-7 7-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function SelfieCameraScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 16;
  const { width: W, height: H } = useWindowDimensions();
  const params = useLocalSearchParams<{ applicationId: string }>();
  const applicationId = params.applicationId;
  const c = useColors();

  const device = useCameraDevice("front");
  const { hasPermission, requestPermission } = useCameraPermission();
  // Capture at a modest resolution so the uploaded JPEG stays small (avoids the
  // backend's HTTP 413 "payload too large") while keeping enough facial detail
  // for the server-side match. Detection uses preview frames, so it's unaffected.
  const format = useCameraFormat(device, [{ photoResolution: { width: 1280, height: 720 } }]);
  const camera = useRef<Camera>(null);

  const [active, setActive] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [faceReady, setFaceReady] = useState(false);
  const [hint, setHint] = useState("");
  const [showManual, setShowManual] = useState(false);

  const busyRef = useRef(false);
  busyRef.current = uploading || capturing;
  const steadyRef = useRef(0);

  // Only run the camera while focused and not mid-upload.
  useFocusEffect(useCallback(() => {
    setActive(true);
    return () => setActive(false);
  }, []));

  useEffect(() => { if (!hasPermission) requestPermission(); }, [hasPermission]);

  useEffect(() => {
    if (!applicationId) {
      Alert.alert("Please Start Over", "Your verification session has expired. Please start again.",
        [{ text: "OK", onPress: () => guardedBack("/(tabs)/profile") }]);
    }
  }, [applicationId]);

  // Reveal a manual capture if detection can't complete (bad light, etc.).
  useEffect(() => {
    if (uploading) return;
    const t = setTimeout(() => setShowManual(true), 10000);
    return () => clearTimeout(t);
  }, [uploading]);

  // ── Oval geometry ─────────────────────────────────────────────────────────────
  const cx = W / 2, cy = H * 0.42;
  const ovalRx = Math.min(W * 0.34, 150);
  const ovalRy = ovalRx * 1.34;

  // ── Upload + capture ─────────────────────────────────────────────────────────
  const uploadSelfie = useCallback(async (uri: string) => {
    setUploading(true);
    try {
      await kycApi.uploadSelfie(applicationId, uri);
      router.push({ pathname: "/kyc/upload-proof-of-residency", params: { applicationId } } as any);
    } catch (err) {
      logHandledError("KYC Selfie", err);
      setUploading(false);
      setCapturing(false);
      steadyRef.current = 0;
      Alert.alert("Couldn't submit your selfie", getErrorMessage(err));
    }
  }, [applicationId]);

  const captureFinal = useCallback(async () => {
    if (!camera.current || busyRef.current) return;
    setCapturing(true);
    try {
      const photo = await camera.current.takePhoto({ flash: "off" });
      await uploadSelfie(`file://${photo.path}`);
    } catch (err) {
      logHandledError("KYC Selfie capture", err);
      setUploading(false);
      setCapturing(false);
      Alert.alert("Camera Unavailable", getErrorMessage(err));
    }
  }, [uploadSelfie]);

  // ── Face evaluation — a single straight-on selfie, no head turns ─────────────
  // Auto-captures once a lone, centered face with open eyes has been steady for
  // a few consecutive detections.
  const handleFaces = useCallback((faces: Face[]) => {
    if (busyRef.current) return;
    if (faces.length === 0) {
      steadyRef.current = 0;
      setFaceReady(false);
      setHint("Position your face in the frame");
      return;
    }
    if (faces.length > 1) {
      steadyRef.current = 0;
      setFaceReady(false);
      setHint("Only your face should be visible");
      return;
    }
    const f = faces[0];
    const yaw = f.yawAngle ?? 0;
    const eyesOpen = (f.leftEyeOpenProbability ?? 1) > EYE_OPEN_MIN || (f.rightEyeOpenProbability ?? 1) > EYE_OPEN_MIN;

    if (Math.abs(yaw) > CENTER_YAW_MAX) {
      steadyRef.current = 0;
      setFaceReady(false);
      setHint("Look straight at the camera");
      return;
    }
    if (!eyesOpen) {
      steadyRef.current = 0;
      setFaceReady(false);
      setHint("Keep your eyes open");
      return;
    }

    setFaceReady(true);
    setHint("");
    steadyRef.current += 1;
    if (steadyRef.current >= STEADY_FRAMES) {
      steadyRef.current = 0;
      captureFinal();
    }
  }, [captureFinal]);

  const { detectFaces } = useFaceDetector({ performanceMode: "fast", classificationMode: "all", landmarkMode: "none" });
  const runOnJsFaces = useMemo(() => Worklets.createRunOnJS(handleFaces), [handleFaces]);

  const frameProcessor = useFrameProcessor((frame) => {
    "worklet";
    runAtTargetFps(DETECT_FPS, () => {
      "worklet";
      const faces = detectFaces(frame);
      runOnJsFaces(faces);
    });
  }, [detectFaces, runOnJsFaces]);

  // ── Gates ────────────────────────────────────────────────────────────────────
  if (!hasPermission) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 16, paddingTop: topPad }}>
        <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 18, color: c.text, textAlign: "center" }}>Camera access needed</Text>
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: c.mutedForeground, textAlign: "center", lineHeight: 22 }}>
          Pine needs your camera to take a verification selfie.
        </Text>
        <TouchableOpacity style={{ backgroundColor: c.primary, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 40, marginTop: 8 }} onPress={requestPermission} activeOpacity={0.85}>
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 16, color: WHITE }}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 12, paddingTop: topPad }}>
        <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: c.text, textAlign: "center" }}>Front camera unavailable</Text>
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: c.mutedForeground, textAlign: "center", lineHeight: 21 }}>
          We couldn't access a front-facing camera on this device.
        </Text>
      </View>
    );
  }

  const title =
    uploading ? "Verifying…"
    : capturing ? "Hold still…"
    : "Center your face";
  const sub = hint || (
    uploading || capturing ? "Capturing your selfie"
    : "Fit your face inside the oval and look straight");
  const ovalColor = faceReady || uploading || capturing ? GREEN : WHITE;

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        format={format}
        isActive={active && !uploading}
        photo={true}
        frameProcessor={frameProcessor}
      />

      {/* Dim spotlight + oval face guide */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Path
          d={
            `M0 0 H${W} V${H} H0 Z ` +
            `M${cx - ovalRx} ${cy} ` +
            `a ${ovalRx} ${ovalRy} 0 1 0 ${ovalRx * 2} 0 ` +
            `a ${ovalRx} ${ovalRy} 0 1 0 ${-ovalRx * 2} 0 Z`
          }
          fill={DIM} fillRule="evenodd"
        />
        <Ellipse cx={cx} cy={cy} rx={ovalRx} ry={ovalRy} stroke={ovalColor} strokeWidth={3} fill="none" opacity={0.9} />
      </Svg>

      {/* Header */}
      <View style={{ position: "absolute", top: topPad, left: 0, right: 0, flexDirection: "row", alignItems: "center", paddingHorizontal: 16 }}>
        <TouchableOpacity onPress={() => guardedBack("/(tabs)/profile")} activeOpacity={0.7} disabled={uploading} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: "rgba(0,0,0,0.35)" }}>
          <BackArrow color={WHITE} />
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: "center", fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 16, color: WHITE }}>Face verification</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Coaching */}
      <View style={{ position: "absolute", top: cy + ovalRy + 34, left: 0, right: 0, alignItems: "center", paddingHorizontal: 32 }}>
        <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 20, color: WHITE, textAlign: "center" }}>{title}</Text>
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: "rgba(255,255,255,0.75)", textAlign: "center", marginTop: 8, lineHeight: 20 }}>{sub}</Text>
      </View>

      {uploading && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", gap: 14 }]}>
          <ActivityIndicator size="large" color={WHITE} />
          <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 15, color: WHITE }}>Submitting your selfie…</Text>
        </View>
      )}

      {showManual && !uploading && !capturing && (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: insets.bottom + 28, alignItems: "center" }}>
          <TouchableOpacity onPress={captureFinal} activeOpacity={0.85} style={{ width: 74, height: 74, borderRadius: 37, borderWidth: 4, borderColor: WHITE, alignItems: "center", justifyContent: "center" }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: WHITE }} />
          </TouchableOpacity>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 10, fontFamily: "PlusJakartaSans_400Regular" }}>Trouble detecting? Tap to capture</Text>
        </View>
      )}
    </View>
  );
}

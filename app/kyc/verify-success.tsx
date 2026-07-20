import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Path, Circle, Rect, G, Defs, ClipPath } from "react-native-svg";
import { useAuth } from "../../services/auth-context";
import { useColors } from "@/hooks/useColors";

const TEAL = "#164951";
const GREEN = "#45B369";
const WHITE = "#FFFFFF";

// ─── Illustration — untouched ─────────────────────────────────────────────────
function SuccessIllustration() {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", marginVertical: 8 }}>
      <Svg width={139} height={130} viewBox="0 0 139 130" fill="none">
        <Defs>
          <ClipPath id="sc0">
            <Rect width={130} height={130} rx={65} fill="white" />
          </ClipPath>
          <ClipPath id="sc1">
            <Rect x={16} y={33} width={46} height={50} rx={4} fill="white" />
          </ClipPath>
        </Defs>
        <Rect width={130} height={130} rx={65} fill="#164951" />
        <G clipPath="url(#sc0)">
          <Circle cx={108.875} cy={101.292} r={45.5} stroke="#2D5B62" strokeWidth={1.08333} />
          <Circle cx={79.625} cy={17.875} r={53.0833} stroke="#2D5B62" strokeWidth={1.08333} />
          <Circle cx={36.0417} cy={108.042} r={7.04167} fill="#2D5B62" />
        </G>
        <Rect x={6} y={23} width={118} height={85} rx={6} fill="#45B369" />
        <Rect x={70} y={35} width={44} height={13} rx={3} fill="#6AC287" />
        <Rect x={70} y={55} width={31} height={4} rx={1} fill="#164951" />
        <Rect x={70} y={67} width={23} height={4} rx={1} fill="#164951" />
        <Rect x={95} y={67} width={10} height={4} rx={1} fill="#164951" />
        <Path d="M76 43C76.2735 41.6667 77.2308 39 78.8718 39C80.9231 39 80.1026 41.5 82.1538 42C84.2051 42.5 84.2051 39.5 87.0769 39.5C89.9487 39.5 89.5385 42.5 92 42.5C94.4615 42.5 94.0513 39.5 96.9231 39.5C99.7949 39.5 101.026 43 103.077 43C105.128 43 106.359 39.5 108 39.5" stroke="#164951" strokeLinecap="round" />
        <Rect x={70} y={79} width={21} height={4} rx={1} fill="#164951" />
        <Rect x={93} y={79} width={21} height={4} rx={1} fill="#164951" />
        <Rect x={70} y={91} width={13.3333} height={4} rx={1} fill="#164951" />
        <Rect x={85.333} y={91} width={13.3333} height={4} rx={1} fill="#164951" />
        <Rect x={100.666} y={91} width={13.3333} height={4} rx={1} fill="#164951" />
        <G clipPath="url(#sc1)">
          <Rect x={16} y={33} width={46} height={50} rx={4} fill="#6AC287" />
          <Path d="M41.8694 69.5691C41.8628 69.5691 41.8602 69.5691 41.8576 69.5691C41.8536 69.5665 41.8483 69.5626 41.8457 69.5626C41.8457 69.56 41.8417 69.5548 41.8391 69.5509C41.8391 69.5483 41.8391 69.5457 41.8391 69.5392V65.701C41.8364 65.6958 41.8391 65.6867 41.8457 65.6841C41.8483 65.6776 41.8536 65.6724 41.8602 65.6724C44.622 64.9844 47.0364 63.3261 48.6452 61.011C50.2539 58.692 50.95 55.8774 50.5986 53.0928C50.2447 50.3056 48.875 47.7434 46.7366 45.8848C44.6022 44.0275 41.8483 43 38.9993 43C36.1477 43 33.3952 44.0275 31.2594 45.8848C29.125 47.7434 27.7514 50.3056 27.4001 53.0928C27.0461 55.8774 27.7421 58.692 29.3509 61.011C30.9596 63.3261 33.374 64.9844 36.1358 65.6724C36.1424 65.6724 36.1477 65.6776 36.1543 65.6841C36.157 65.6867 36.1596 65.6958 36.1596 65.701V69.5392C36.1596 69.5457 36.157 69.5483 36.157 69.5509C36.1543 69.5548 36.1543 69.56 36.1517 69.5626C36.1477 69.5626 36.1451 69.5665 36.1398 69.5691C36.1358 69.5691 36.1332 69.5691 36.1306 69.5691C35.5151 69.5431 26.0119 69.4078 26 86.9701C26 86.9792 26.0026 86.9844 26.0092 86.9909C26.0145 86.9961 26.0211 87 26.0291 87H51.9696C51.9723 87 51.9789 87 51.9815 86.9961C51.9841 86.9961 51.9881 86.9935 51.9908 86.9909C51.9934 86.9883 51.996 86.9844 51.996 86.9818C52 86.9792 52 86.9727 52 86.9701C51.9841 69.4078 42.481 69.5431 41.8694 69.5691Z" fill="#164951" />
        </G>
        <Rect x={16} y={88} width={46} height={10} rx={2.16667} fill="#6AC287" />
        <Path d="M20 95C20.3248 93.6667 21.4615 91 23.4103 91C25.8462 91 24.8718 93.5 27.3077 94C29.7436 94.5 29.7436 91.5 33.1538 91.5C36.5641 91.5 36.0769 94.5 39 94.5C41.9231 94.5 41.4359 91.5 44.8462 91.5C48.2564 91.5 49.7179 95 52.1538 95C54.5897 95 56.0513 91.5 58 91.5" stroke="#164951" strokeLinecap="round" />
        <Circle cx={117} cy={101} r={21} fill="#FFFFFF" stroke="#45B369" strokeWidth={2} />
        <Path d="M115.136 109H114.994C114.687 108.979 114.387 108.893 114.116 108.749C113.846 108.603 113.61 108.404 113.427 108.161L107.413 100.213C107.08 99.7701 106.94 99.2182 107.024 98.6746C107.107 98.1326 107.408 97.6432 107.86 97.3164C108.315 96.9912 108.882 96.8549 109.438 96.937C109.996 97.0175 110.498 97.3098 110.834 97.75L115.348 103.718C115.35 103.72 115.35 103.72 115.352 103.72C115.353 103.722 115.353 103.722 115.355 103.722C115.357 103.722 115.357 103.722 115.358 103.722C115.36 103.72 115.36 103.72 115.36 103.718L125.343 93.6326C125.734 93.2385 126.272 93.0102 126.835 93.0003C127.398 92.9905 127.944 93.1991 128.351 93.5801C128.755 93.9611 128.99 94.485 129 95.0336C129.01 95.5837 128.796 96.1142 128.405 96.5084L116.662 108.374C116.463 108.571 116.227 108.729 115.964 108.836C115.702 108.944 115.421 109 115.136 109Z" fill="#164951" />
      </Svg>
    </View>
  );
}

function StepItem({ label, c }: { label: string; c: ReturnType<typeof useColors> }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 }}>
      <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
        <Circle cx={8} cy={8} r={8} fill={GREEN} />
        <Path d="M4.5 8l2.5 2.5 4.5-5" stroke={WHITE} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 14, color: c.text }}>{label}</Text>
    </View>
  );
}

export default function VerifySuccessScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;
  const params = useLocalSearchParams<{ decision: string; confidenceScore: string }>();
  const { refreshProfile } = useAuth();
  const c = useColors();

  const decision = params.decision ?? "MANUAL_REVIEW";
  const isApproved = decision === "APPROVED";
  const isRejected = decision === "REJECTED";
  const isPending = !isApproved && !isRejected;

  const title = isApproved
    ? "Verification Approved!"
    : isRejected
      ? "Verification Unsuccessful"
      : "Verification Submitted!";

  const subtitle = isApproved
    ? "Your identity has been verified successfully. You can now access all features of Pine."
    : isRejected
      ? "We were unable to verify your identity. Please try again with clearer photos or contact support."
      : "Your documents have been received and are currently under review. You'll be notified once your identity is verified.";

  const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { flex: 1, paddingHorizontal: 24, paddingTop: 24, gap: 24, alignItems: "stretch" },
    textBlock: { gap: 10, alignItems: "center" },
    title: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 24, color: c.text, textAlign: "center" },
    subtitle: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: c.mutedForeground, textAlign: "center", lineHeight: 24 },
    stepsCard: { backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 16, gap: 2 },
    stepsTitle: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: c.mutedForeground, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
    stepDivider: { height: 1, backgroundColor: c.border, marginLeft: 28 },
    timeBox: { backgroundColor: "#FFFBEB", borderRadius: 10, padding: 14 },
    timeText: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: "#92400E" },
    footer: { paddingHorizontal: 24, paddingTop: 12, backgroundColor: c.background, borderTopWidth: 1, borderTopColor: c.border },
    doneBtn: { backgroundColor: TEAL, borderRadius: 12, paddingVertical: 18, alignItems: "center" },
    doneBtnText: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 16, color: WHITE },
  });

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.content}>
        <SuccessIllustration />

        <View style={styles.textBlock}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>
            {isApproved ? "Verification complete" : "Documents submitted"}
          </Text>
          <StepItem label="Photo ID (Front & Back)" c={c} />
          <View style={styles.stepDivider} />
          <StepItem label="Selfie Verification" c={c} />
        </View>

        {isPending && (
          <View style={styles.timeBox}>
            <Text style={styles.timeText}>⏱  Typical review time: 1–2 business days</Text>
          </View>
        )}

        {isApproved && (
          <View style={[styles.timeBox, { backgroundColor: "#F0FDF4" }]}>
            <Text style={[styles.timeText, { color: "#166534" }]}>✓  Your account is now fully verified</Text>
          </View>
        )}

        {isRejected && (
          <View style={[styles.timeBox, { backgroundColor: "#FEF2F2" }]}>
            <Text style={[styles.timeText, { color: "#991B1B" }]}>Please ensure photos are clear and try again</Text>
          </View>
        )}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.doneBtn, isRejected && { backgroundColor: "#DC2626" }]}
          onPress={async () => {
            await refreshProfile();
            router.replace("/(tabs)/profile" as any);
          }}
          activeOpacity={0.88}
        >
          <Text style={styles.doneBtnText}>
            {isRejected ? "Try Again" : "Done"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

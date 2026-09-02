import React, { useRef } from "react";
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import Svg, { Path } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

/**
 * 3-D Secure challenge screen.
 *
 * The card issuer — not Pine — decides what appears here (an OTP, a banking
 * app approval, a security question). We render the self-submitting HTML the
 * gateway produced and simply watch for the issuer to send the payer back to
 * our return URL.
 *
 * Nothing shown here is trusted: reaching the return URL only tells the app
 * the challenge is over. The server re-reads the real outcome from the
 * gateway before any money moves.
 */
export default function ThreeDSChallenge({
  visible,
  html,
  returnUrl,
  onFinished,
  onCancel,
}: {
  visible: boolean;
  html: string;
  returnUrl: string;
  /** The payer came back — ask the server what actually happened. */
  onFinished: () => void;
  /** The payer backed out before finishing. */
  onCancel: () => void;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const settled = useRef(false);

  // Reset the guard each time the sheet is opened for a new payment.
  React.useEffect(() => {
    if (visible) settled.current = false;
  }, [visible]);

  const finishOnce = () => {
    if (settled.current) return;
    settled.current = true;
    onFinished();
  };

  /** Fires before every navigation — the reliable place to spot the return. */
  const shouldLoad = (req: { url: string }) => {
    if (req.url.startsWith(returnUrl)) {
      finishOnce();
      return false; // no need to actually load our own placeholder page
    }
    return true;
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel} transparent={false}>
      <View style={{ flex: 1, backgroundColor: c.background, paddingTop: insets.top }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            paddingBottom: 10,
            borderBottomWidth: 1,
            borderBottomColor: c.border,
          }}
        >
          <TouchableOpacity
            onPress={onCancel}
            style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
            accessibilityLabel="Cancel verification"
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M18 6L6 18M6 6l12 12" stroke={c.text} strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_600SemiBold",
                fontSize: 15,
                color: c.text,
                textAlign: "center",
              }}
            >
              Verify with your bank
            </Text>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_400Regular",
                fontSize: 11,
                color: c.mutedForeground,
                textAlign: "center",
                marginTop: 1,
              }}
            >
              This step is provided by your card issuer
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <WebView
          originWhitelist={["*"]}
          source={{ html }}
          onShouldStartLoadWithRequest={shouldLoad}
          onNavigationStateChange={(nav) => {
            // Belt and braces: some issuers redirect in ways that skip the
            // request hook on Android.
            if (nav.url?.startsWith(returnUrl)) finishOnce();
          }}
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          startInLoadingState
          renderLoading={() => (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.background }}>
              <ActivityIndicator color={c.primary} />
            </View>
          )}
          style={{ flex: 1, backgroundColor: c.background }}
          // Card-issuer pages are third-party; keep the bridge minimal.
          thirdPartyCookiesEnabled={Platform.OS === "android"}
        />
      </View>
    </Modal>
  );
}

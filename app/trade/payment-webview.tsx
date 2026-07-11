import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { WebView, WebViewNavigation } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { paymentsApi } from "../../services/api";
import {
  readCachedAvailable,
  savePendingDeposit,
  useWalletQueryClient,
} from "../../services/wallet-queries";

const TEAL = "#164951";
const WHITE = "#FFFFFF";
const DARK = "#111827";
const MUTED = "#9CA3AF";

function BackIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={DARK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/**
 * Payment WebView — loads the PayChangu checkout URL.
 *
 * The backend redirects here to an HTTPS sentinel page after payment:
 *   .../payments/app-return?status=success|failed|cancelled&tx_ref=...
 * We intercept that HTTPS URL (reliable on Android, unlike a pine:// scheme
 * which the Android WebView drops with ERR_UNKNOWN_URL_SCHEME) and route:
 *   - success   → verify + navigate to success / home
 *   - failed    → show error and go back
 *   - cancelled → go back
 *
 * The legacy pine://payment/* deep links are still handled as a fallback.
 */
const APP_RETURN_PATH = "/payments/app-return";

/** Extract a query param from a URL string without needing a full URL parser. */
function getQueryParam(url: string, key: string): string {
  const match = url.match(new RegExp(`[?&]${key}=([^&#]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export default function PaymentWebViewScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;

  const params = useLocalSearchParams<{
    checkoutUrl?: string;
    txRef?: string;
    symbol?: string;
    amount?: string;
    purpose?: string;
  }>();

  const checkoutUrl = params.checkoutUrl ?? "";
  const txRef = params.txRef ?? "";
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const webviewRef = useRef<WebView>(null);
  // Guard so the outcome is routed only once (both nav handlers can see the URL)
  const handledRef = useRef(false);
  const qc = useWalletQueryClient();

  // Resolve the payment outcome and route the user accordingly.
  const handleOutcome = useCallback(
    async (status: string, resolvedTxRef: string) => {
      if (status === "success") {
        setVerifying(true);
        try {
          // Verify payment on backend
          const result = await paymentsApi.verify(resolvedTxRef);
          if (result.status === "success") {
            if (params.purpose === "wallet_deposit") {
              const amountNum = Number(params.amount) || 0;
              // Persist a pending-deposit record so Home can reconcile the
              // wallet balance even if the app is killed before it mounts.
              await savePendingDeposit({
                txRef: resolvedTxRef,
                amount: amountNum,
                prevAvailable: readCachedAvailable(qc),
                createdAt: Date.now(),
              });
              // Deposit: go to home with success indicator
              router.replace({
                pathname: "/(tabs)/" as any,
                params: {
                  depositSuccess: "true",
                  depositAmount: params.amount,
                  depositTxRef: resolvedTxRef,
                },
              });
            } else {
              // Stock purchase: show order success screen
              router.replace({
                pathname: "/trade/success" as any,
                params: {
                  txRef: resolvedTxRef,
                  amount: params.amount,
                  symbol: params.symbol,
                  type: "BUY",
                },
              });
            }
          } else {
            Alert.alert("Payment Pending", "Your payment is still being processed. Please check back shortly.");
            router.back();
          }
        } catch {
          Alert.alert("Verification Error", "Could not verify payment. Please check your wallet balance.");
          router.back();
        }
        return;
      }

      if (status === "failed") {
        Alert.alert("Payment Failed", "Your payment could not be processed. Please try again.");
        router.back();
        return;
      }

      // cancelled (or anything else) → just go back
      router.back();
    },
    [params.purpose, params.amount, params.symbol, qc],
  );

  // Match the outcome from an intercepted URL. Returns true if this URL was a
  // payment-outcome redirect (and therefore should NOT be loaded in the WebView).
  const interceptOutcomeUrl = useCallback(
    (url: string): boolean => {
      let status: string | null = null;

      // Primary: HTTPS sentinel page from the backend
      if (url.includes(APP_RETURN_PATH)) {
        status = getQueryParam(url, "status") || "cancelled";
      }
      // Fallback: legacy pine:// deep links
      else if (url.startsWith("pine://payment/success")) status = "success";
      else if (url.startsWith("pine://payment/failed")) status = "failed";
      else if (url.startsWith("pine://payment/cancelled")) status = "cancelled";

      if (status === null) return false;

      // Route the outcome only once, even if both nav handlers observe the URL
      if (!handledRef.current) {
        handledRef.current = true;
        handleOutcome(status, getQueryParam(url, "tx_ref") || txRef);
      }
      return true;
    },
    [txRef, handleOutcome],
  );

  // Intercept navigation to detect payment-outcome redirects
  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      interceptOutcomeUrl(navState.url);
    },
    [interceptOutcomeUrl],
  );

  // Intercept outcome URLs before they load in the WebView
  const handleShouldStartLoadWithRequest = useCallback(
    (request: { url: string }) => {
      // Returning true blocks the load only for outcome URLs we handle in-app
      return !interceptOutcomeUrl(request.url);
    },
    [interceptOutcomeUrl],
  );

  if (!checkoutUrl) {
    return (
      <View style={[styles.root, { paddingTop: topPad }]}>
        <Text style={styles.errorText}>No checkout URL provided.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.linkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              "Cancel Payment",
              "Are you sure you want to cancel this payment?",
              [
                { text: "Stay", style: "cancel" },
                { text: "Cancel", style: "destructive", onPress: () => router.back() },
              ],
            );
          }}
          style={styles.backBtn}
        >
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Payment</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Loading overlay */}
      {(loading || verifying) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={TEAL} />
          <Text style={styles.loadingText}>
            {verifying ? "Verifying payment..." : "Loading payment page..."}
          </Text>
        </View>
      )}

      {/* WebView */}
      <WebView
        ref={webviewRef}
        source={{ uri: checkoutUrl }}
        // Allow any scheme to reach our nav handlers instead of being dropped
        // by Android WebView (belt-and-suspenders for legacy pine:// redirects)
        originWhitelist={["*"]}
        style={{ flex: 1, opacity: loading ? 0 : 1 }}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        sharedCookiesEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: WHITE,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: DARK,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: MUTED,
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
    color: DARK,
    marginTop: 60,
  },
  linkText: {
    textAlign: "center",
    fontSize: 14,
    color: TEAL,
    marginTop: 16,
    fontWeight: "600",
  },
});

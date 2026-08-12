import {
  PlusJakartaSans_300Light,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import {
  Lora_400Regular,
  Lora_600SemiBold,
} from "@expo-google-fonts/lora";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../services/query-client";
import { Stack, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, View } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SystemUI from "expo-system-ui";
import Constants from "expo-constants";

import { LogBox } from "react-native";
import { AnimatedSplash } from "@/components/AnimatedSplash";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "../services/auth-context";
import { BalanceVisibilityProvider } from "@/contexts/balance-visibility";
import { ThemeProvider, useTheme } from "@/contexts/theme-context";
import { useColors } from "@/hooks/useColors";
import {
  configurePushNotifications,
  setupNotificationListeners,
} from "../services/push";

// Suppress non-actionable native warnings that appear in Expo Go on iOS.
LogBox.ignoreLogs([
  "If you want to change the appearance of status bar",
  "UIViewControllerBasedStatusBarAppearance",
]);

// Expo Go manages its own splash screen natively — calling these APIs inside
// Expo Go always rejects. Only call them in standalone / custom builds.
const isExpoGo = Constants.appOwnership === "expo";
if (!isExpoGo) {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}


/**
 * Route guard — redirects to login if not authenticated,
 * and to home if already authenticated and on auth screens.
 *
 * Flow on fresh install:  "" (onboarding) → login/signup → (tabs)
 * Flow on returning user: "" → /login  (onboarding skipped)
 * Flow on logged-in user: any auth/onboarding screen → (tabs)
 * Flow on logout:         (tabs) → /login  (never back to onboarding)
 *
 * NOTE: app/index.tsx maps to route "/" whose segment is "" (empty string),
 * not "index". The guard must NOT early-return on "" — that is the onboarding
 * screen and needs to be handled like any other route.
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isLoggedIn, user } = useAuth();
  const segments = useSegments();
  const [hasOnboarded, setHasOnboarded] = React.useState<boolean | null>(null);

  // Read the persistent onboarding flag once on mount.
  useEffect(() => {
    AsyncStorage.getItem("@pine_has_onboarded").then((val) => {
      setHasOnboarded(val === "true");
    });
  }, []);

  useEffect(() => {
    // Wait until the router has initialised and given us at least one segment.
    // Do NOT skip when segments[0] === "" — that is the onboarding index route.
    if ((segments.length as number) === 0) return;

    // Widened to string: at runtime the index route yields "" which the typed
    // route union doesn't include, making === "" comparisons type errors.
    const seg: string = segments[0];

    // Screens that belong to the unauthenticated / onboarding funnel.
    // "" is the segment for app/index.tsx (route "/").
    //
    // NOTE: phone-number / verify-code / verify-email / create-pin are NOT in
    // this list — they run AFTER registration (the user is already logged in),
    // so listing them here bounced freshly-registered users straight to the
    // tabs and silently skipped phone verification.
    const isOnAuthOrOnboardingScreen =
      seg === "" ||
      seg === "onboarding-2" ||
      seg === "onboarding-3" ||
      seg === "login" ||
      seg === "signup" ||
      seg === "forgot-password";

    // ── Mandatory transaction PIN ──────────────────────────────────────────
    // A trading PIN is required for every trade, so it is non-negotiable at
    // setup. Any logged-in user without a PIN is forced to /create-pin — this
    // catches users who reached the app before setting one (e.g. the gate
    // previously bounced freshly-registered users straight to the tabs). The
    // pre-PIN funnel screens are allowed so the flow can complete.
    const PRE_PIN_ALLOWED = [
      "signup", "create-pin", "verify-email", "phone-number", "verify-code",
    ];
    if (isLoggedIn && user && user.hasPinSet === false) {
      if (!PRE_PIN_ALLOWED.includes(seg)) {
        router.replace("/create-pin");
      }
      return; // don't run the tabs-bounce below until a PIN exists
    }

    // Fast path — Telegram-style: as soon as the cached session restore says
    // the user is logged in (a purely local check, no network), bounce them
    // off auth/onboarding screens. Waiting for the full `isLoading` (which
    // includes a server profile refresh) made the onboarding carousel visible
    // to returning users on slow networks.
    if (isLoggedIn && isOnAuthOrOnboardingScreen) {
      router.replace("/(tabs)");
      return;
    }

    // The remaining decisions concern logged-out users — for those, wait for
    // the auth restore and the onboarding flag to fully resolve.
    if (isLoading || hasOnboarded === null) return;

    const isOnProtectedScreen = !isOnAuthOrOnboardingScreen;

    if (!isLoggedIn && isOnProtectedScreen) {
      // Unauthenticated user tried to access a protected route → login.
      router.replace("/login");
    } else if (
      !isLoggedIn &&
      hasOnboarded &&
      (seg === "" || seg === "onboarding-2" || seg === "onboarding-3")
    ) {
      // Already completed onboarding in a previous session — skip straight to
      // login. Logout lands here too: hasOnboarded stays true and the user
      // ends up on login, never back on the onboarding carousel.
      router.replace("/login");
    }
    // Fresh install (!isLoggedIn && seg === "" && !hasOnboarded):
    // → stay on the onboarding carousel; no redirect needed.
  }, [isLoading, isLoggedIn, user?.hasPinSet, segments, hasOnboarded]);

  // Until the session restore and the onboarding flag have both resolved we
  // don't yet know where the user belongs — cover the navigator with a plain
  // white surface so signed-in users never see the onboarding carousel flash
  // before the redirect lands. The animated splash sits above this anyway, so
  // in practice the cover is invisible; it only matters on slow cold starts
  // where the restore outlives the splash animation.
  const resolved = !isLoading && hasOnboarded !== null;

  return (
    <>
      {children}
      {!resolved && (
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "#ffffff",
            zIndex: 9998,
            elevation: 9998,
          }}
        />
      )}
    </>
  );
}

function RootLayoutNav() {
  const c = useColors();
  const { isDark } = useTheme();

  useEffect(() => {
    // The native window can be visible for a frame while a stack screen is
    // being popped. Keep its fallback surface synchronized with the app theme.
    SystemUI.setBackgroundColorAsync(c.background).catch(() => {});
  }, [c.background]);

  useEffect(() => {
    // Set up foreground presentation + the Android notification channel once.
    // Guarded internally; a no-op when the native push module is absent.
    configurePushNotifications().catch(() => {});

    // Listen for notification taps (foreground, background, and cold start).
    const cleanup = setupNotificationListeners();
    return cleanup;
  }, []);

  // Drill-in "section" screens (notifications, profile sub-pages, treasury,
  // trade, stock, education, wallet, etc.) share one transition: the native
  // iOS-style right-edge push. The incoming screen slides in from the right
  // while the current screen stays visible beneath it until it is covered —
  // the behaviour we want — and it renders through react-native-screens'
  // normal card path, so there is no transparent-modal header-repaint bug.
  // Enabled in BOTH light and dark; any surface briefly exposed during the
  // slide is painted with c.background (see contentStyle + SystemUI above).
  const section = {
    headerShown: false,
    animation: "slide_from_right",
    animationDuration: 300,
  } as const;

  return (
    <AuthGate>
      <StatusBar
        style={isDark ? "light" : "dark"}
        backgroundColor={c.background}
        translucent={false}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          // Force card presentation globally — prevents react-native-screens
          // from ever creating RNSModalScreen shadow nodes on iOS New Arch,
          // which crash in the Expo Go build of react-native-screens 4.x.
          presentation: "card",
          contentStyle: { backgroundColor: c.background },
          statusBarStyle: isDark ? "light" : "dark",
          // NOTE: navigationBarColor / navigationBarTranslucent / statusBarTranslucent
          // are intentionally omitted — this app runs edge-to-edge (SDK 54 default),
          // where react-native-screens ignores them and warns. The system bars are
          // handled by the edge-to-edge config + per-screen safe-area padding.
          // Dark-mode transitions expose the native window surface on some
          // devices, so use an instantaneous transition there. Keep the
          // existing light-mode motion unchanged.
          animation: isDark ? "none" : "slide_from_right",
          animationDuration: 280,
        }}
      >
        {/* Auth / onboarding screens — fade so replacements feel seamless */}
        <Stack.Screen
          name="index"
          options={{ headerShown: false, gestureEnabled: false, animation: isDark ? "none" : "fade", animationDuration: 260 }}
        />
        <Stack.Screen
          name="login"
          options={{ headerShown: false, gestureEnabled: false, animation: isDark ? "none" : "fade", animationDuration: 240 }}
        />
        <Stack.Screen
          name="signup"
          options={{ headerShown: false, gestureEnabled: false, animation: isDark ? "none" : "fade", animationDuration: 240 }}
        />
        <Stack.Screen name="phone-number" options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen name="verify-code" options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen name="verify-email" options={{ headerShown: false, animation: "none", gestureEnabled: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen name="create-pin" options={{ headerShown: false, animation: "none" }} />

        {/* Tabs — fade so the jump from auth feels instant, not jarring */}
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, gestureEnabled: false, animation: isDark ? "none" : "fade", animationDuration: 300 }}
        />

        {/* Discovery screens — native slide-from-right (see `section`) */}
        <Stack.Screen name="stock-search" options={section} />
        <Stack.Screen name="stock/[ticker]" options={section} />
        <Stack.Screen name="education" options={section} />

        {/* Trade flow — native slide-from-right (see `section`) */}
        <Stack.Screen name="trade/buy" options={section} />
        <Stack.Screen name="trade/sell" options={section} />
        <Stack.Screen name="trade/exchange" options={section} />
        <Stack.Screen name="trade/payment" options={section} />
        <Stack.Screen name="trade/confirm" options={section} />
        <Stack.Screen
          name="trade/success"
          options={{ headerShown: false, animation: isDark ? "none" : "fade", animationDuration: 300 }}
        />
        <Stack.Screen
          name="trade/card-success"
          options={{ headerShown: false, animation: isDark ? "none" : "fade", animationDuration: 300, gestureEnabled: false }}
        />
        <Stack.Screen name="trade/history" options={section} />

        {/* Payment screens — same drill-in slide-from-right as every section */}
        <Stack.Screen name="payment-card" options={section} />

        {/* Wallet — native slide-from-right (see `section`) */}
        <Stack.Screen name="deposit" options={section} />
        <Stack.Screen name="withdraw" options={section} />

        {/* Profile sub-screens — native slide-from-right (see `section`) */}
        <Stack.Screen name="profile/notifications" options={section} />
        <Stack.Screen name="profile/personal-data" options={section} />
        <Stack.Screen name="profile/security" options={section} />
        <Stack.Screen name="profile/push-notifications" options={section} />
        <Stack.Screen name="settings/index" options={section} />
        <Stack.Screen name="settings/cards" options={section} />
        <Stack.Screen name="help/index" options={section} />
        <Stack.Screen name="help/report" options={section} />
        <Stack.Screen name="help/ticket" options={section} />

        {/* Treasury Bill flow — native slide-from-right (see `section`) */}
        <Stack.Screen name="treasury/index" options={section} />
        <Stack.Screen name="treasury/details" options={section} />
        <Stack.Screen name="treasury/calculator" options={section} />
        <Stack.Screen name="treasury/review" options={section} />
        <Stack.Screen name="treasury/processing" options={{ headerShown: false, animation: isDark ? "none" : "fade", animationDuration: 300, gestureEnabled: false }} />
        <Stack.Screen name="treasury/success" options={{ headerShown: false, animation: isDark ? "none" : "fade", animationDuration: 300, gestureEnabled: false }} />
        <Stack.Screen name="treasury/my-investments" options={section} />
        <Stack.Screen name="treasury/investment-detail" options={section} />
      </Stack>
    </AuthGate>
  );
}

function ThemedAppRoot({ children }: { children: React.ReactNode }) {
  const c = useColors();

  return <View style={{ flex: 1, backgroundColor: c.background }}>{children}</View>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_300Light,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    Lora_400Regular,
    Lora_600SemiBold,
  });

  const [fontTimeout, setFontTimeout] = React.useState(false);
  // The animated splash overlay owns the splash duration now; the plain white
  // native splash hides as soon as the JS tree can render beneath the overlay.
  const [animatedSplashDone, setAnimatedSplashDone] = React.useState(false);

  useEffect(() => {
    // Fallback: hide splash even if fonts never load (after 3.5 s)
    const timer = setTimeout(() => setFontTimeout(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  // Fallback: if the animation asset somehow never decodes, still reveal the
  // app once fonts are ready rather than sitting on the native splash.
  useEffect(() => {
    if (!isExpoGo && (fontsLoaded || fontError || fontTimeout)) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, fontTimeout]);

  const appReady = fontsLoaded || fontError || fontTimeout;

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <ThemedAppRoot>
          <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <BalanceVisibilityProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  {/* The animated splash covers everything, so the app tree can
                      wait for fonts underneath it without delaying the intro. */}
                  {appReady ? (
                    <KeyboardProvider>
                      <RootLayoutNav />
                    </KeyboardProvider>
                  ) : (
                    <View style={{ flex: 1, backgroundColor: "#ffffff" }} />
                  )}
                  {!animatedSplashDone && (
                    <AnimatedSplash
                      onFinish={() => setAnimatedSplashDone(true)}
                      onReady={() => {
                        if (!isExpoGo) SplashScreen.hideAsync().catch(() => {});
                      }}
                    />
                  )}
                </GestureHandlerRootView>
                </BalanceVisibilityProvider>
              </AuthProvider>
            </QueryClientProvider>
          </ErrorBoundary>
        </ThemedAppRoot>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

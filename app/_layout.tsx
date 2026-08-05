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
import { View } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SystemUI from "expo-system-ui";
import Constants from "expo-constants";

import { LogBox } from "react-native";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "../services/auth-context";
import { ThemeProvider, useTheme } from "@/contexts/theme-context";
import { useColors } from "@/hooks/useColors";
import { configurePushNotifications } from "../services/push";

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
  const { isLoading, isLoggedIn } = useAuth();
  const segments = useSegments();
  const [hasOnboarded, setHasOnboarded] = React.useState<boolean | null>(null);

  // Read the persistent onboarding flag once on mount.
  useEffect(() => {
    AsyncStorage.getItem("@pine_has_onboarded").then((val) => {
      setHasOnboarded(val === "true");
    });
  }, []);

  useEffect(() => {
    // Wait for auth loading and onboarding flag to resolve.
    if (isLoading || hasOnboarded === null) return;
    // Wait until the router has initialised and given us at least one segment.
    // Do NOT skip when segments[0] === "" — that is the onboarding index route.
    if (segments.length === 0) return;

    const seg = segments[0];

    // Screens that belong to the unauthenticated / onboarding funnel.
    // "" is the segment for app/index.tsx (route "/").
    const isOnAuthOrOnboardingScreen =
      seg === "" ||
      seg === "onboarding-2" ||
      seg === "onboarding-3" ||
      seg === "login" ||
      seg === "signup" ||
      seg === "phone-number" ||
      seg === "verify-code" ||
      seg === "forgot-password";

    const isOnProtectedScreen = !isOnAuthOrOnboardingScreen;

    if (isLoggedIn && isOnAuthOrOnboardingScreen) {
      // Already logged in — go straight to home.
      router.replace("/(tabs)");
    } else if (!isLoggedIn && isOnProtectedScreen) {
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
  }, [isLoading, isLoggedIn, segments, hasOnboarded]);

  return <>{children}</>;
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
        <Stack.Screen name="trade/payment-webview" options={section} />
        <Stack.Screen
          name="trade/success"
          options={{ headerShown: false, animation: isDark ? "none" : "fade", animationDuration: 300 }}
        />
        <Stack.Screen
          name="trade/card-success"
          options={{ headerShown: false, animation: isDark ? "none" : "fade", animationDuration: 300, gestureEnabled: false }}
        />
        <Stack.Screen name="trade/history" options={section} />

        {/* Payment screens */}
        <Stack.Screen
          name="payment-card"
          options={{ headerShown: false, animation: isDark ? "none" : "slide_from_bottom", animationDuration: 340 }}
        />

        {/* Wallet — native slide-from-right (see `section`) */}
        <Stack.Screen name="deposit" options={section} />
        <Stack.Screen name="withdraw" options={section} />

        {/* Profile sub-screens — native slide-from-right (see `section`) */}
        <Stack.Screen name="profile/notifications" options={section} />
        <Stack.Screen name="profile/personal-data" options={section} />
        <Stack.Screen name="profile/security" options={section} />
        <Stack.Screen name="profile/push-notifications" options={section} />

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
  // Track whether the minimum splash duration (3.5 s) has elapsed
  const [minSplashElapsed, setMinSplashElapsed] = React.useState(false);

  useEffect(() => {
    // Fallback: hide splash even if fonts never load (after 3.5 s)
    const timer = setTimeout(() => setFontTimeout(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  // Enforce a minimum 3.5-second splash duration
  useEffect(() => {
    const timer = setTimeout(() => setMinSplashElapsed(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isExpoGo && minSplashElapsed && (fontsLoaded || fontError || fontTimeout)) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, fontTimeout, minSplashElapsed]);

  if (!fontsLoaded && !fontError && !fontTimeout) return null;

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <ThemedAppRoot>
          <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <KeyboardProvider>
                    <RootLayoutNav />
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </AuthProvider>
            </QueryClientProvider>
          </ErrorBoundary>
        </ThemedAppRoot>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

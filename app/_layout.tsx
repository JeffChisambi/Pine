import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Poppins_700Bold } from "@expo-google-fonts/poppins";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "../services/auth-context";
import { ThemeProvider } from "@/contexts/theme-context";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      gcTime: 10 * 60 * 1000,
    },
  },
});

/**
 * Route guard — redirects to login if not authenticated,
 * and to home if already authenticated and on auth screens.
 *
 * Flow on fresh install:  index (onboarding) → login/signup → (tabs)
 * Flow on returning user: index → login  (onboarding skipped)
 * Flow on logged-in user: any auth screen → (tabs)
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isLoggedIn } = useAuth();
  const segments = useSegments();
  const [hasOnboarded, setHasOnboarded] = React.useState<boolean | null>(null);
  // Prevent the guard from running on the very first render before the
  // router has settled (segments[0] can be "" for a brief instant).
  const hasNavigated = useRef(false);

  // Check if user has completed onboarding before
  useEffect(() => {
    AsyncStorage.getItem("@pine_has_onboarded").then((val) => {
      setHasOnboarded(val === "true");
    });
  }, []);

  useEffect(() => {
    // Wait for auth loading and onboarding flag to resolve
    if (isLoading || hasOnboarded === null) return;
    // Wait until the router has settled on an actual segment
    if (segments.length === 0 || segments[0] === "") return;

    const seg = segments[0];

    const isOnAuthOrOnboardingScreen =
      seg === "login" ||
      seg === "signup" ||
      seg === "phone-number" ||
      seg === "verify-code" ||
      seg === "forgot-password" ||
      seg === "index";

    const isOnProtectedScreen = !isOnAuthOrOnboardingScreen;

    if (isLoggedIn && isOnAuthOrOnboardingScreen) {
      // Already logged in — skip straight to home
      router.replace("/(tabs)");
    } else if (!isLoggedIn && isOnProtectedScreen) {
      // Tried to access a protected route without being logged in → login
      router.replace("/login");
    } else if (!isLoggedIn && seg === "index" && hasOnboarded) {
      // User has completed onboarding before — skip onboarding, go to login
      router.replace("/login");
    }
    // Fresh install (!isLoggedIn && seg === "index" && !hasOnboarded):
    // → stay on the onboarding screen; no redirect needed.
  }, [isLoading, isLoggedIn, segments, hasOnboarded]);

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <AuthGate>
      <Stack
        screenOptions={{
          headerShown: false,
          navigationBarColor: "transparent",
          statusBarTranslucent: true,
          // Default: smooth right-slide for all push navigations
          animation: "slide_from_right",
          animationDuration: 280,
        }}
      >
        {/* Auth / onboarding screens — fade so replacements feel seamless */}
        <Stack.Screen
          name="index"
          options={{ headerShown: false, gestureEnabled: false, animation: "fade", animationDuration: 260 }}
        />
        <Stack.Screen
          name="login"
          options={{ headerShown: false, gestureEnabled: false, animation: "fade", animationDuration: 240 }}
        />
        <Stack.Screen
          name="signup"
          options={{ headerShown: false, gestureEnabled: false, animation: "fade", animationDuration: 240 }}
        />
        <Stack.Screen name="phone-number" options={{ headerShown: false, animationDuration: 260 }} />
        <Stack.Screen name="verify-code" options={{ headerShown: false, animationDuration: 260 }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false, animationDuration: 260 }} />
        <Stack.Screen name="create-pin" options={{ headerShown: false, animationDuration: 260 }} />

        {/* Tabs — fade so the jump from auth feels instant, not jarring */}
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, gestureEnabled: false, animation: "fade", animationDuration: 300 }}
        />

        {/* Discovery screens — slide in from right */}
        <Stack.Screen name="stock-search" options={{ headerShown: false, animationDuration: 260 }} />
        <Stack.Screen name="stock/[ticker]" options={{ headerShown: false, animationDuration: 260 }} />

        {/* Trade flow — bottom sheet style for a transactional feel */}
        <Stack.Screen
          name="trade/buy"
          options={{ headerShown: false, animation: "slide_from_bottom", animationDuration: 340 }}
        />
        <Stack.Screen
          name="trade/sell"
          options={{ headerShown: false, animation: "slide_from_bottom", animationDuration: 340 }}
        />
        <Stack.Screen
          name="trade/exchange"
          options={{ headerShown: false, animation: "slide_from_bottom", animationDuration: 340 }}
        />
        <Stack.Screen
          name="trade/payment"
          options={{ headerShown: false, animation: "slide_from_bottom", animationDuration: 320 }}
        />
        <Stack.Screen
          name="trade/confirm"
          options={{ headerShown: false, animation: "slide_from_bottom", animationDuration: 320 }}
        />
        <Stack.Screen
          name="trade/payment-webview"
          options={{ headerShown: false, animation: "slide_from_bottom", animationDuration: 320 }}
        />
        <Stack.Screen
          name="trade/success"
          options={{ headerShown: false, animation: "fade", animationDuration: 300 }}
        />
        <Stack.Screen name="trade/history" options={{ headerShown: false, animationDuration: 260 }} />

        {/* Profile sub-screens */}
        <Stack.Screen name="profile/notifications" options={{ headerShown: false, animationDuration: 260 }} />
        <Stack.Screen name="profile/personal-data" options={{ headerShown: false, animationDuration: 260 }} />
        <Stack.Screen name="profile/push-notifications" options={{ headerShown: false, animationDuration: 260 }} />
      </Stack>
    </AuthGate>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    Poppins_700Bold,
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
    if (minSplashElapsed && (fontsLoaded || fontError || fontTimeout)) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, fontTimeout, minSplashElapsed]);

  if (!fontsLoaded && !fontError && !fontTimeout) return null;

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <GestureHandlerRootView>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </AuthProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

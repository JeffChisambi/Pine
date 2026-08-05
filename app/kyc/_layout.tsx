import { Stack } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/contexts/theme-context";

export default function KycLayout() {
  const c = useColors();
  const { isDark } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: isDark ? "none" : "slide_from_right",
        contentStyle: { backgroundColor: c.background },
        statusBarStyle: isDark ? "light" : "dark",
        // navigationBarColor / navigationBarTranslucent / statusBarTranslucent
        // omitted — ignored (and warned about) under edge-to-edge (SDK 54).
      }}
    >
      {/* Terminal KYC screens: KYC is finished, so a swipe-back must not slip
          into the completed upload screens. Back is handled explicitly (button
          + hardware) to return to Profile. */}
      <Stack.Screen name="under-review" options={{ gestureEnabled: false }} />
      <Stack.Screen name="verify-success" options={{ gestureEnabled: false }} />
    </Stack>
  );
}

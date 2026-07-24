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
        navigationBarColor: c.background,
        statusBarStyle: isDark ? "light" : "dark",
        navigationBarTranslucent: isDark ? false : undefined,
        statusBarTranslucent: isDark ? false : true,
      }}
    />
  );
}

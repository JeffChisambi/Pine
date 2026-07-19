import { useTheme } from "@/contexts/theme-context";
import colors from "@/constants/colors";

/**
 * Returns the design tokens for the current color scheme.
 * Driven by the in-app ThemeProvider (profile toggle + AsyncStorage persistence).
 * Falls back to the light palette when the dark key is absent.
 */
export function useColors() {
  const { isDark } = useTheme();
  const palette = isDark ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}

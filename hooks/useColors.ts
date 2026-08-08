import { useMemo } from "react";
import { useTheme } from "@/contexts/theme-context";
import { buildPalette } from "@/constants/theme";

/**
 * Returns the design tokens for the current color scheme.
 *
 * Driven by the in-app ThemeProvider (profile dark-mode toggle) AND by the
 * broker-configured brand overrides fetched from the backend. Every screen
 * that reads its colors from here re-themes automatically when the broker
 * changes the app's colors in the dashboard "Mobile Themes" editor.
 */
export function useColors() {
  const { isDark, overrides } = useTheme();
  return useMemo(
    () => buildPalette(isDark ? "dark" : "light", overrides),
    [isDark, overrides],
  );
}

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { mobileThemeApi } from "@/services/api";
import type { BrandOverrides } from "@/constants/theme";

const THEME_KEY = "@pine_dark_mode";
const BRAND_KEY = "@pine_brand_theme";

type ThemeContextType = {
  isDark: boolean;
  toggleTheme: () => void;
  /** Broker-configured brand overrides (null → default Pine theme). */
  overrides: BrandOverrides | null;
  /** Re-fetch the active theme from the backend. */
  refreshTheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
  overrides: null,
  refreshTheme: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [overrides, setOverrides] = useState<BrandOverrides | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // 1) Hydrate both the dark-mode preference and the last-known broker theme
  //    from storage before first paint (avoids a flash of the wrong palette).
  useEffect(() => {
    Promise.all([AsyncStorage.getItem(THEME_KEY), AsyncStorage.getItem(BRAND_KEY)])
      .then(([darkVal, brandVal]) => {
        if (darkVal === "true") setIsDark(true);
        if (brandVal) {
          try { setOverrides(JSON.parse(brandVal)); } catch { /* ignore */ }
        }
      })
      .catch(() => {})
      .finally(() => setIsHydrated(true));
  }, []);

  // 2) After hydration, fetch the current broker theme from the backend and
  //    cache it. Non-blocking — the app already rendered with the cached theme.
  const refreshTheme = useCallback(async () => {
    try {
      const res = await mobileThemeApi.get();
      const next = res?.colors ?? null;
      setOverrides(next);
      if (next) await AsyncStorage.setItem(BRAND_KEY, JSON.stringify(next));
      else await AsyncStorage.removeItem(BRAND_KEY);
    } catch {
      // Offline / error → keep the cached theme.
    }
  }, []);

  useEffect(() => {
    if (isHydrated) refreshTheme();
  }, [isHydrated, refreshTheme]);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(THEME_KEY, String(next)).catch(() => {});
      return next;
    });
  };

  // Do not mount navigation with the light palette before a saved dark-mode
  // preference has been read. That first light render can become visible
  // during native navigation and look like a white flash.
  if (!isHydrated) return null;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, overrides, refreshTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

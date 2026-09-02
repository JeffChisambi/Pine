import React, { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Image, Platform, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

const LOGO = require("../assets/pine_assets/logos/g8 1.png");

/**
 * Covers the UI while the app is leaving the foreground.
 *
 * iOS photographs the screen as the app deactivates and shows that image in
 * the app switcher — so a balance or a half-typed card stays visible on a
 * borrowed or stolen phone. The OS gives apps no way to opt out, so the
 * standard defence is to paint over the UI before the snapshot is taken.
 *
 * Android needs none of this: FLAG_SECURE (set by enableScreenCaptureProtection)
 * already blanks the recents preview, so this renders nothing there.
 */
export default function PrivacyScreen() {
  const c = useColors();
  const [hidden, setHidden] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (Platform.OS !== "ios") return;

    const sub = AppState.addEventListener("change", (next) => {
      // 'inactive' is the moment iOS takes the switcher snapshot — cover it
      // then, and only uncover once we are fully active again.
      setHidden(next !== "active");
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  if (!hidden) return null;

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.cover, { backgroundColor: c.background }]}
      pointerEvents="none"
    >
      <Image source={LOGO} style={styles.logo} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    elevation: 9999,
  },
  logo: { width: 120, height: 120, opacity: 0.9 },
});

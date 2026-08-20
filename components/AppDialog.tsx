/**
 * AppDialog — the app's themed replacement for the system Alert popup.
 *
 * Design (see: rounded-triangle icon badge, centered copy, pill buttons):
 *   ┌──────────────────────────┐
 *   │          (icon)          │
 *   │        Bold title        │
 *   │    muted, centered text  │
 *   │  [ Cancel ]  [ Action ]  │
 *   └──────────────────────────┘
 *
 * Usage: mount <AppDialogHost/> once at the app root, then call
 * installAppAlert() — it swaps RN's Alert.alert for this dialog, so every
 * existing Alert.alert(...) call site in the app is re-skinned without
 * changes. The signature subset used by the app (title, message, buttons
 * with text/onPress/style) is fully supported; unknown options are ignored.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  AlertButton,
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

const RED = "#EF4444";
const WHITE = "#FFFFFF";

type DialogRequest = {
  title: string;
  message?: string;
  buttons: AlertButton[];
};

let enqueue: ((req: DialogRequest) => void) | null = null;

/** Themed drop-in for Alert.alert — falls back to the system alert until the host mounts. */
export function appAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
): void {
  const req: DialogRequest = {
    title,
    message,
    buttons: buttons && buttons.length > 0 ? buttons : [{ text: "OK" }],
  };
  if (enqueue) enqueue(req);
  else systemAlert(title, message, buttons);
}

// Keep a handle on the original implementation for the pre-mount fallback.
const systemAlert = Alert.alert.bind(Alert);

/** Replace RN's Alert.alert app-wide. Call once at the root. */
export function installAppAlert(): void {
  (Alert as { alert: typeof Alert.alert }).alert = appAlert as typeof Alert.alert;
}

/** Rounded-triangle warning badge (brand teal; red for destructive dialogs). */
function IconBadge({ color }: { color: string }) {
  return (
    <Svg width={56} height={56} viewBox="0 0 56 56" fill="none">
      <Path
        d="M23.1 8.9c2.2-3.7 7.6-3.7 9.8 0l14.6 24.9c2.2 3.8-.5 8.6-4.9 8.6H13.4c-4.4 0-7.1-4.8-4.9-8.6L23.1 8.9z"
        fill={color}
      />
      <Path d="M28 20v10" stroke={WHITE} strokeWidth={3.4} strokeLinecap="round" />
      <Path d="M28 36.5v.2" stroke={WHITE} strokeWidth={3.6} strokeLinecap="round" />
    </Svg>
  );
}

export function AppDialogHost() {
  const c = useColors();
  const [queue, setQueue] = useState<DialogRequest[]>([]);
  const current = queue[0] ?? null;

  const scale = useRef(new Animated.Value(0.92)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    enqueue = (req) => setQueue((q) => [...q, req]);
    return () => {
      enqueue = null;
    };
  }, []);

  useEffect(() => {
    if (current) {
      scale.setValue(0.92);
      fade.setValue(0);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, damping: 18, stiffness: 320, mass: 0.6, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 160, useNativeDriver: true }),
      ]).start();
    }
  }, [current, scale, fade]);

  const dismiss = useCallback((onPress?: () => void) => {
    setQueue((q) => q.slice(1));
    // Run the handler after state settles so a handler that opens another
    // dialog doesn't race the queue update.
    if (onPress) setTimeout(onPress, 0);
  }, []);

  if (!current) return null;

  const destructive = current.buttons.some((b) => b.style === "destructive");
  const badgeColor = destructive ? RED : c.primary;
  // Cancel-style buttons stay left, action buttons right — same order the
  // system alert uses, so existing call sites read identically.
  const ordered = [...current.buttons].sort(
    (a, b) => (a.style === "cancel" ? -1 : 0) - (b.style === "cancel" ? -1 : 0),
  );
  const stacked = ordered.length > 2;

  return (
    <Modal transparent statusBarTranslucent animationType="none" visible onRequestClose={() => dismiss()}>
      <Animated.View style={[styles.backdrop, { opacity: fade }]}>
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: c.background, transform: [{ scale }] },
          ]}
        >
          <View style={styles.badgeWrap}>
            <IconBadge color={badgeColor} />
          </View>

          <Text style={[styles.title, { color: c.text }]}>{current.title}</Text>
          {!!current.message && (
            <Text style={[styles.message, { color: c.mutedForeground }]}>{current.message}</Text>
          )}

          <View style={[styles.buttonRow, stacked && styles.buttonColumn]}>
            {ordered.map((btn, i) => {
              const isCancel = btn.style === "cancel";
              const isDestructive = btn.style === "destructive";
              return (
                <TouchableOpacity
                  key={`${btn.text}-${i}`}
                  activeOpacity={0.82}
                  onPress={() => dismiss(btn.onPress as (() => void) | undefined)}
                  style={[
                    styles.button,
                    stacked && styles.buttonStacked,
                    isCancel
                      ? { backgroundColor: c.card, borderWidth: 1, borderColor: c.border }
                      : { backgroundColor: isDestructive ? RED : c.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      { color: isCancel ? c.text : WHITE },
                    ]}
                  >
                    {btn.text ?? "OK"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(9,14,18,0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
  },
  card: {
    width: "100%",
    maxWidth: 330,
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 16,
  },
  badgeWrap: {
    marginBottom: 14,
  },
  title: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 17,
    textAlign: "center",
  },
  message: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
    alignSelf: "stretch",
  },
  buttonColumn: {
    flexDirection: "column",
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  buttonStacked: {
    flex: 0,
    alignSelf: "stretch",
  },
  buttonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14.5,
  },
});

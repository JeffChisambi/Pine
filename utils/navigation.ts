import { router } from "expo-router";

/**
 * Prevents double-tap navigation by ignoring presses within 600ms of the last one.
 * A single module-level timestamp is enough — only one navigation can be "in flight" at a time.
 */
let lastNavAt = 0;
let lastBackAt = 0;

export function guardedPush(push: () => void, delay = 600) {
  const now = Date.now();
  if (now - lastNavAt < delay) return;
  lastNavAt = now;
  push();
}

export function guardedBack(fallback: string = "/(tabs)", delay = 600) {
  const now = Date.now();
  if (now - lastBackAt < delay) return;
  lastBackAt = now;

  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback as any);
  }
}

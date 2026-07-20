/**
 * Prevents double-tap navigation by ignoring presses within 600ms of the last one.
 * A single module-level timestamp is enough — only one navigation can be "in flight" at a time.
 */
let lastNavAt = 0;

export function guardedPush(push: () => void, delay = 600) {
  const now = Date.now();
  if (now - lastNavAt < delay) return;
  lastNavAt = now;
  push();
}

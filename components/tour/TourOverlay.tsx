/**
 * Guided-tour overlay: dark backdrop with a rounded spotlight cut out around
 * the current target, a softly pulsing ring, a looped dashed arrow curving
 * from the step card to the target, and the card itself (title, one-liner,
 * step dots, Skip / Next / Done).
 *
 * Motion is deliberately un-bouncy: every transition is `withTiming` with an
 * ease-out curve (250-300ms). Continuous loops (dash travel, nudge, pulse) are
 * disabled when the OS "reduce motion" setting is on.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useTour, type TargetRect } from "./TourProvider";

const AnimatedPath = Animated.createAnimatedComponent(Path);

const BACKDROP = "rgba(8, 12, 16, 0.68)";
const PAD = 8; // breathing room between target and cutout edge
const CUTOUT_RADIUS = 16;
const CARD_MARGIN = 20;
const ARROW_GAP = 64; // vertical room reserved between card and cutout for the arrow
const EASE_OUT = Easing.out(Easing.cubic);
const STEP_MS = 280;
const MEASURE_RETRIES = 8;
const MEASURE_RETRY_MS = 140;

// ─── Path helpers (worklets) ─────────────────────────────────────────────────
function roundedRectPath(x: number, y: number, w: number, h: number, r: number): string {
  "worklet";
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  return (
    `M${x + rr},${y} H${x + w - rr} A${rr},${rr} 0 0 1 ${x + w},${y + rr} ` +
    `V${y + h - rr} A${rr},${rr} 0 0 1 ${x + w - rr},${y + h} ` +
    `H${x + rr} A${rr},${rr} 0 0 1 ${x},${y + h - rr} ` +
    `V${y + rr} A${rr},${rr} 0 0 1 ${x + rr},${y} Z`
  );
}

interface Pt { x: number; y: number }

/** Quadratic-bezier arrow with a bow perpendicular to the chord, plus arrowhead. */
function buildArrow(start: Pt, end: Pt): { d: string; head: string; length: number; dir: Pt } {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  // Bow away from the screen centre so the curve reads as a "sweep".
  const bowSign = dx >= 0 ? 1 : -1;
  const bow = Math.min(48, len * 0.28) * bowSign;
  const ctrl = { x: (start.x + end.x) / 2 + nx * bow, y: (start.y + end.y) / 2 + ny * bow };
  const d = `M${start.x},${start.y} Q${ctrl.x},${ctrl.y} ${end.x},${end.y}`;

  // Tangent at t = 1 for the arrowhead orientation.
  const tx = end.x - ctrl.x;
  const ty = end.y - ctrl.y;
  const tl = Math.hypot(tx, ty) || 1;
  const ux = tx / tl;
  const uy = ty / tl;
  const size = 9;
  const spread = 0.55; // ~31deg
  const leftX = end.x - size * (ux * Math.cos(spread) - uy * Math.sin(spread));
  const leftY = end.y - size * (uy * Math.cos(spread) + ux * Math.sin(spread));
  const rightX = end.x - size * (ux * Math.cos(spread) + uy * Math.sin(spread));
  const rightY = end.y - size * (uy * Math.cos(spread) - ux * Math.sin(spread));
  const head = `M${leftX},${leftY} L${end.x},${end.y} L${rightX},${rightY}`;

  // Approximate curve length (chord + a little for the bow) for dash sizing.
  const approxLen = len + Math.abs(bow) * 0.6;
  return { d, head, length: approxLen, dir: { x: ux, y: uy } };
}

// ─── Component ────────────────────────────────────────────────────────────────
export function TourOverlay() {
  const tour = useTour();
  const { active } = tour;
  const [mounted, setMounted] = useState(false);
  const rootOpacity = useSharedValue(0);

  useEffect(() => {
    if (active) {
      setMounted(true);
      rootOpacity.value = withTiming(1, { duration: 260, easing: EASE_OUT });
    } else if (mounted) {
      rootOpacity.value = withTiming(0, { duration: 220, easing: EASE_OUT }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: rootOpacity.value }));

  if (!mounted) return null;
  return (
    <Animated.View style={[StyleSheet.absoluteFill, rootStyle]} pointerEvents={active ? "auto" : "none"}>
      <TourScene />
    </Animated.View>
  );
}

function TourScene() {
  const tour = useTour();
  const { stepIndex, steps, reduceMotion, measureTarget, next, dismiss } = tour;
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  /**
   * The overlay's OWN size, not the window's. On Android the window height
   * excludes the system navigation bar, so painting the backdrop at that
   * height left the tab bar strip uncovered at the bottom. Measuring the
   * container we actually fill keeps the scrim edge-to-edge on every device.
   */
  const [box, setBox] = useState({ w: 0, h: 0 });
  const W = box.w || winW;
  const H = box.h || winH;

  const rootRef = useRef<View>(null);
  const [rect, setRect] = useState<TargetRect | null>(null);
  const [shownStep, setShownStep] = useState(stepIndex);
  const [cardH, setCardH] = useState(150);
  const firstLayout = useRef(true);
  const measureSeq = useRef(0);

  const step = steps[shownStep] ?? steps[0];
  const isLast = shownStep >= steps.length - 1;

  // Spotlight geometry (shared values so the cutout glides between steps).
  const sx = useSharedValue(W / 2);
  const sy = useSharedValue(H / 2);
  const sw = useSharedValue(0);
  const sh = useSharedValue(0);
  const spotOpacity = useSharedValue(0);

  // Card
  const cardY = useSharedValue(H / 2 - 75);
  const cardOpacity = useSharedValue(0);

  // Loops
  const pulse = useSharedValue(0);
  const dash = useSharedValue(0);
  const nudge = useSharedValue(0);
  const arrowOpacity = useSharedValue(0);
  const dirX = useSharedValue(0);
  const dirY = useSharedValue(-1);

  const timing = useCallback(
    (v: number, ms = STEP_MS) => withTiming(v, { duration: reduceMotion ? 0 : ms, easing: EASE_OUT }),
    [reduceMotion],
  );

  // ── Loops: pulse ring, dash travel, arrow nudge ────────────────────────────
  useEffect(() => {
    cancelAnimation(pulse);
    cancelAnimation(dash);
    cancelAnimation(nudge);
    if (reduceMotion) {
      pulse.value = 0;
      dash.value = 0;
      nudge.value = 0;
      return;
    }
    pulse.value = 0;
    pulse.value = withRepeat(withTiming(1, { duration: 1700, easing: Easing.out(Easing.quad) }), -1, false);
    dash.value = 0;
    dash.value = withRepeat(withTiming(-16, { duration: 720, easing: Easing.linear }), -1, false);
    nudge.value = 0;
    nudge.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 820, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 820, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(pulse);
      cancelAnimation(dash);
      cancelAnimation(nudge);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  // ── Measure the current step's target ──────────────────────────────────────
  const measureWithRetry = useCallback(
    async (targetId: (typeof steps)[number]["target"]): Promise<TargetRect | null> => {
      for (let i = 0; i < MEASURE_RETRIES; i++) {
        const r = await measureTarget(targetId);
        if (r) {
          // Convert window coords → overlay-local coords in case the overlay's
          // root isn't at the window origin (Android status bar quirks, etc).
          const offset = await new Promise<Pt>((resolve) => {
            const node = rootRef.current;
            if (!node) return resolve({ x: 0, y: 0 });
            let done = false;
            node.measureInWindow((x, y) => {
              if (done) return;
              done = true;
              resolve({ x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0 });
            });
            setTimeout(() => {
              if (!done) {
                done = true;
                resolve({ x: 0, y: 0 });
              }
            }, 200);
          });
          const local = { ...r, x: r.x - offset.x, y: r.y - offset.y };
          // Off-screen targets (e.g. scrolled away) fall back to a centred card.
          const visible = local.y + local.height > 0 && local.y < H && local.x + local.width > 0 && local.x < W;
          return visible ? local : null;
        }
        await new Promise((res) => setTimeout(res, MEASURE_RETRY_MS));
      }
      return null;
    },
    [measureTarget, H, W],
  );

  useEffect(() => {
    const seq = ++measureSeq.current;
    const target = steps[stepIndex]?.target;
    if (!target) return;

    // Fade the card + arrow out while we re-measure and swap content.
    if (!firstLayout.current) {
      cardOpacity.value = withTiming(0, { duration: reduceMotion ? 0 : 110, easing: EASE_OUT });
      arrowOpacity.value = withTiming(0, { duration: reduceMotion ? 0 : 90, easing: EASE_OUT });
    }

    let cancelled = false;
    (async () => {
      const r = await measureWithRetry(target);
      if (cancelled || seq !== measureSeq.current) return;
      setRect(r);
      setShownStep(stepIndex);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, measureWithRetry]);

  // ── Layout: place spotlight, card and arrow for the measured rect ─────────
  const layout = useMemo(() => {
    const cardX = CARD_MARGIN;
    const cardW = W - CARD_MARGIN * 2;
    const minTop = insets.top + 12;
    const maxBottom = H - Math.max(insets.bottom, 8) - 12;

    if (!rect) {
      const top = Math.max(minTop, Math.min((H - cardH) / 2, maxBottom - cardH));
      return { cardX, cardW, cardTop: top, below: true, arrow: null as null | ReturnType<typeof buildArrow>, cut: null as null | TargetRect };
    }

    const cut: TargetRect = {
      x: rect.x - PAD,
      y: rect.y - PAD,
      width: rect.width + PAD * 2,
      height: rect.height + PAD * 2,
    };
    const centerY = cut.y + cut.height / 2;
    const placeBelow = centerY < H * 0.5;

    let cardTop: number;
    if (placeBelow) {
      cardTop = cut.y + cut.height + ARROW_GAP;
      cardTop = Math.min(cardTop, maxBottom - cardH);
    } else {
      cardTop = cut.y - ARROW_GAP - cardH;
      cardTop = Math.max(cardTop, minTop);
    }
    cardTop = Math.max(minTop, Math.min(cardTop, maxBottom - cardH));

    // Arrow: from the card edge facing the target to the cutout edge.
    const targetCx = Math.max(cut.x + 18, Math.min(cut.x + cut.width - 18, cut.x + cut.width / 2));
    const cardCx = cardX + cardW / 2;
    // Start a little toward the target horizontally so the curve looks intentional.
    const startX = cardCx + (targetCx - cardCx) * 0.35;
    const start: Pt = placeBelow ? { x: startX, y: cardTop - 8 } : { x: startX, y: cardTop + cardH + 8 };
    const end: Pt = placeBelow
      ? { x: targetCx, y: cut.y + cut.height + 10 }
      : { x: targetCx, y: cut.y - 10 };
    const tooClose = Math.abs(end.y - start.y) < 28;
    const arrow = tooClose ? null : buildArrow(start, end);

    return { cardX, cardW, cardTop, below: placeBelow, arrow, cut };
  }, [rect, cardH, W, H, insets.top, insets.bottom]);

  // Drive shared values whenever layout changes.
  useEffect(() => {
    const { cut, cardTop, arrow } = layout;
    const first = firstLayout.current;
    firstLayout.current = false;

    if (cut) {
      if (first) {
        sx.value = cut.x; sy.value = cut.y; sw.value = cut.width; sh.value = cut.height;
      } else {
        sx.value = timing(cut.x); sy.value = timing(cut.y);
        sw.value = timing(cut.width); sh.value = timing(cut.height);
      }
      spotOpacity.value = timing(1);
    } else {
      // No target: shrink the cutout to nothing at the centre.
      const cx = W / 2; const cy = H / 2;
      if (first) { sx.value = cx; sy.value = cy; sw.value = 0; sh.value = 0; }
      else { sx.value = timing(cx); sy.value = timing(cy); sw.value = timing(0); sh.value = timing(0); }
      spotOpacity.value = timing(0);
    }

    if (first) cardY.value = cardTop;
    else cardY.value = timing(cardTop);
    cardOpacity.value = withTiming(1, { duration: reduceMotion ? 0 : 240, easing: EASE_OUT });

    if (arrow) {
      dirX.value = arrow.dir.x;
      dirY.value = arrow.dir.y;
      arrowOpacity.value = withTiming(1, { duration: reduceMotion ? 0 : 260, easing: EASE_OUT });
    } else {
      arrowOpacity.value = withTiming(0, { duration: reduceMotion ? 0 : 120, easing: EASE_OUT });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, timing]);

  // ── Animated props / styles ───────────────────────────────────────────────
  const backdropProps = useAnimatedProps(() => {
    const outer = `M0,0 H${W} V${H} H0 Z `;
    const inner = sw.value > 0.5 && sh.value > 0.5
      ? roundedRectPath(sx.value, sy.value, sw.value, sh.value, CUTOUT_RADIUS)
      : "";
    return { d: outer + inner };
  });

  const ringProps = useAnimatedProps(() => {
    // Ring breathes outward from the cutout edge and fades as it expands.
    const grow = 3 + pulse.value * 9;
    const x = sx.value - grow;
    const y = sy.value - grow;
    const w = sw.value + grow * 2;
    const h = sh.value + grow * 2;
    const opacity = spotOpacity.value * (reduceMotion ? 0.9 : 0.95 * (1 - pulse.value));
    return {
      d: sw.value > 0.5 ? roundedRectPath(x, y, w, h, CUTOUT_RADIUS + grow) : "",
      strokeOpacity: opacity,
    };
  });

  const edgeProps = useAnimatedProps(() => ({
    d: sw.value > 0.5 ? roundedRectPath(sx.value - 1, sy.value - 1, sw.value + 2, sh.value + 2, CUTOUT_RADIUS + 1) : "",
    strokeOpacity: spotOpacity.value,
  }));

  const dashProps = useAnimatedProps(() => ({ strokeDashoffset: dash.value }));

  const arrowStyle = useAnimatedStyle(() => ({
    opacity: arrowOpacity.value,
    transform: [
      { translateX: dirX.value * 5 * nudge.value },
      { translateY: dirY.value * 5 * nudge.value },
    ],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardY.value }],
  }));

  const onRootLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox((prev) =>
      Math.abs(prev.w - width) > 1 || Math.abs(prev.h - height) > 1
        ? { w: width, h: height }
        : prev,
    );
  }, []);

  const onCardLayout = useCallback((e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height);
    if (h > 0) setCardH((prev) => (Math.abs(prev - h) > 1 ? h : prev));
  }, []);

  const accent = c.accent;
  const arrowD = layout.arrow?.d ?? "";
  const headD = layout.arrow?.head ?? "";

  return (
    <View ref={rootRef} collapsable={false} onLayout={onRootLayout} style={StyleSheet.absoluteFill}>
      {/* Backdrop with the spotlight cut out (evenodd) + pulsing ring */}
      <Svg width={W} height={H} style={StyleSheet.absoluteFill} pointerEvents="none">
        <AnimatedPath animatedProps={backdropProps} fill={BACKDROP} fillRule="evenodd" />
        <AnimatedPath animatedProps={edgeProps} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
        <AnimatedPath animatedProps={ringProps} fill="none" stroke={accent} strokeWidth={2} />
      </Svg>

      {/* Curved, travelling dashed arrow */}
      {layout.arrow && (
        <Animated.View style={[StyleSheet.absoluteFill, arrowStyle]} pointerEvents="none">
          <Svg width={W} height={H}>
            <AnimatedPath
              d={arrowD}
              animatedProps={dashProps}
              fill="none"
              stroke={accent}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeDasharray="9 7"
            />
            <Path d={headD} fill="none" stroke={accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Animated.View>
      )}

      {/* Blocks touches on the backdrop (target area included) */}
      <View style={StyleSheet.absoluteFill} />

      {/* Step card */}
      <Animated.View
        onLayout={onCardLayout}
        style={[
          styles.card,
          {
            left: layout.cardX,
            width: layout.cardW,
            backgroundColor: c.card,
            borderColor: c.border,
          },
          cardStyle,
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.stepBadge, { backgroundColor: `${accent}22` }]}>
            <Text style={[styles.stepBadgeText, { color: accent }]}>
              {shownStep + 1}/{steps.length}
            </Text>
          </View>
          <TouchableOpacity onPress={dismiss} hitSlop={10} accessibilityRole="button" accessibilityLabel="Skip tour">
            <Text style={[styles.skip, { color: c.mutedForeground }]}>Skip</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.title, { color: c.text }]}>{step.title}</Text>
        <Text style={[styles.body, { color: c.mutedForeground }]}>{step.body}</Text>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {steps.map((s, i) => (
              <View
                key={s.id}
                style={[
                  styles.dot,
                  {
                    width: i === shownStep ? 18 : 6,
                    backgroundColor: i === shownStep ? accent : c.border,
                  },
                ]}
              />
            ))}
          </View>
          <TouchableOpacity
            onPress={next}
            activeOpacity={0.85}
            accessibilityRole="button"
            style={[styles.nextBtn, { backgroundColor: c.primary }]}
          >
            <Text style={styles.nextText}>{isLast ? "Done" : "Next"}</Text>
            {!isLast && (
              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                <Path d="M5 12h14M12 5l7 7-7 7" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    top: 0,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  stepBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  stepBadgeText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.3,
  },
  skip: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  title: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 17,
    lineHeight: 22,
    marginBottom: 4,
  },
  body: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 18,
    height: 40,
    ...(Platform.OS === "android" ? { elevation: 0 } : null),
  },
  nextText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
});

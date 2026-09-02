/**
 * First-run guided tour (coach marks / spotlight walkthrough).
 *
 * Screens register the on-screen elements the tour points at through
 * `useTourTarget(id)` (callback ref) or `<TourTarget id>` (wrapper View).
 * The provider keeps a registry of measurable nodes, owns the tour state
 * (active / step index), and persists the "completed" flag in AsyncStorage so
 * the walkthrough shows once per install. `<TourOverlay />` renders the
 * backdrop, spotlight, arrow and card and is mounted by the tabs layout so it
 * sits above every tab AND the tab bar.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AccessibilityInfo, type MeasureInWindowOnSuccessCallback } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { withTiming, Easing } from "react-native-reanimated";
import { tabBarHidden } from "@/contexts/tab-bar-visibility";

export const TOUR_COMPLETED_KEY = "@pine_tour_completed";

/** Ids of every element the tour can spotlight. */
export type TourTargetId =
  | "balance"
  | "deposit"
  | "trade"
  | "bell"
  | "tab-market"
  | "tab-portfolio"
  | "tab-profile";

export interface TourStep {
  id: string;
  target: TourTargetId;
  title: string;
  body: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "wallet",
    target: "balance",
    title: "Your wallet",
    body: "Your available balance lives here. Tap Deposit to fund it in minutes.",
  },
  {
    id: "market",
    target: "tab-market",
    title: "Browse the market",
    body: "See every stock listed on the MSE with live prices and movers.",
  },
  {
    id: "trade",
    target: "trade",
    title: "Buy your first shares",
    body: "Open Equity Trading, pick a company and place a buy order.",
  },
  {
    id: "portfolio",
    target: "tab-portfolio",
    title: "Track your portfolio",
    body: "Your holdings, returns and growth over time, all in one place.",
  },
  {
    id: "notifications",
    target: "bell",
    title: "Stay in the loop",
    body: "Order fills, deposits and price alerts land here.",
  },
  {
    id: "profile",
    target: "tab-profile",
    title: "Profile & security",
    body: "Manage your PIN, biometrics and account settings from Profile.",
  },
];

export interface TargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Anything with a `measureInWindow` (View, TouchableOpacity, ...). */
export interface Measurable {
  measureInWindow: (callback: MeasureInWindowOnSuccessCallback) => void;
}

/**
 * Anything may register under a TourTargetId or an ad-hoc string (e.g. every
 * tab registers as `tab-<name>` even though only some are tour steps).
 */
export type TourRegistrableId = TourTargetId | (string & {});

interface TourContextValue {
  active: boolean;
  stepIndex: number;
  steps: TourStep[];
  reduceMotion: boolean;
  /** Register/unregister a measurable node for a target id. */
  registerTarget: (id: TourRegistrableId, node: Measurable | null) => void;
  /** Measure a target in window coordinates. Resolves null when unregistered. */
  measureTarget: (id: TourRegistrableId) => Promise<TargetRect | null>;
  /** Start the tour from the first step (always, regardless of the flag). */
  start: () => void;
  /** Start only if this install has never completed/skipped the tour. */
  startIfFirstRun: () => Promise<void>;
  next: () => void;
  back: () => void;
  /** Skip / finish — marks the tour completed. */
  dismiss: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

/** Reset the persisted flag so the tour plays again on the next home visit. */
export async function resetTourCompleted(): Promise<void> {
  await AsyncStorage.removeItem(TOUR_COMPLETED_KEY);
}

/**
 * Module-level replay request. Screens outside the tabs layout (e.g. Help)
 * can't reach the provider, so they set this and navigate home; the home
 * screen's `startIfFirstRun()` on focus consumes it and starts the tour.
 */
let replayRequested = false;
export async function requestTourReplay(): Promise<void> {
  replayRequested = true;
  await resetTourCompleted().catch(() => {});
}

function measureNode(node: Measurable): Promise<TargetRect | null> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (r: TargetRect | null) => {
      if (settled) return;
      settled = true;
      resolve(r);
    };
    try {
      node.measureInWindow((x, y, width, height) => {
        if (!Number.isFinite(x) || !Number.isFinite(y) || width <= 0 || height <= 0) {
          done(null);
        } else {
          done({ x, y, width, height });
        }
      });
    } catch {
      done(null);
    }
    // Detached nodes never call back.
    setTimeout(() => done(null), 250);
  });
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const targets = useRef(new Map<string, Measurable>());
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => { if (mounted) setReduceMotion(v); })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const registerTarget = useCallback((id: TourRegistrableId, node: Measurable | null) => {
    if (node) targets.current.set(id, node);
    else targets.current.delete(id);
  }, []);

  const measureTarget = useCallback(async (id: TourRegistrableId) => {
    const node = targets.current.get(id);
    if (!node) return null;
    return measureNode(node);
  }, []);

  const start = useCallback(() => {
    startedRef.current = true;
    // Make sure the scroll-aware tab bar is on screen so tab targets measure.
    tabBarHidden.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) });
    setStepIndex(0);
    setActive(true);
  }, []);

  const startIfFirstRun = useCallback(async () => {
    if (replayRequested) {
      // "Show app tour" from Help: play again right away.
      replayRequested = false;
      setTimeout(start, 350);
      return;
    }
    if (startedRef.current) return;
    try {
      const done = await AsyncStorage.getItem(TOUR_COMPLETED_KEY);
      if (done === "1") return;
    } catch {
      // Storage unavailable — err on the side of showing nothing twice.
      return;
    }
    if (startedRef.current) return;
    // Give the home screen a frame or two to lay out before measuring.
    setTimeout(() => {
      if (!startedRef.current) start();
    }, 650);
  }, [start]);

  const dismiss = useCallback(() => {
    setActive(false);
    AsyncStorage.setItem(TOUR_COMPLETED_KEY, "1").catch(() => {});
  }, []);

  const next = useCallback(() => {
    setStepIndex((i) => {
      if (i >= TOUR_STEPS.length - 1) {
        // Finish on the last step.
        setTimeout(dismiss, 0);
        return i;
      }
      return i + 1;
    });
  }, [dismiss]);

  const back = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const value = useMemo<TourContextValue>(
    () => ({
      active,
      stepIndex,
      steps: TOUR_STEPS,
      reduceMotion,
      registerTarget,
      measureTarget,
      start,
      startIfFirstRun,
      next,
      back,
      dismiss,
    }),
    [active, stepIndex, reduceMotion, registerTarget, measureTarget, start, startIfFirstRun, next, back, dismiss],
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

/** Tour state + controls. Safe to call outside a provider (returns a no-op stub). */
export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (ctx) return ctx;
  return NOOP_TOUR;
}

const NOOP_TOUR: TourContextValue = {
  active: false,
  stepIndex: 0,
  steps: TOUR_STEPS,
  reduceMotion: false,
  registerTarget: () => {},
  measureTarget: async () => null,
  start: () => {},
  startIfFirstRun: async () => {},
  next: () => {},
  back: () => {},
  dismiss: () => {},
};

/**
 * Scroll-aware bottom tab bar visibility.
 *
 * A single Reanimated shared value drives the tab bar's slide animation:
 * 0 = fully visible, 1 = fully hidden. Screens with long scrolling content
 * (e.g. Market) call `useHideTabBarOnScroll()` and attach the returned
 * onScroll handler — scrolling down hides the bar, scrolling up (or reaching
 * the top) reveals it. The bar itself consumes `tabBarHidden` in an animated
 * style. Leaving the screen always restores the bar so other tabs are never
 * stuck bar-less.
 */
import { useCallback, useRef } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { makeMutable, withTiming, Easing } from "react-native-reanimated";
import { useFocusEffect } from "expo-router";

/** 0 = shown, 1 = hidden. Consumed by the tab bar's animated style. */
export const tabBarHidden = makeMutable(0);

function setHidden(hidden: boolean) {
  tabBarHidden.value = withTiming(hidden ? 1 : 0, {
    duration: 260,
    easing: Easing.out(Easing.cubic),
  });
}

/** Minimum scroll delta (px) before a direction change takes effect —
 *  filters out finger jitter and bounce. */
const DIRECTION_THRESHOLD = 12;

export function useHideTabBarOnScroll() {
  const lastY = useRef(0);
  const hiddenRef = useRef(false);

  // Whenever the screen loses focus (tab switch, navigation), restore the bar.
  useFocusEffect(
    useCallback(() => {
      return () => {
        hiddenRef.current = false;
        setHidden(false);
      };
    }, []),
  );

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const dy = y - lastY.current;

    // Always reveal near the top, regardless of direction.
    if (y < 24) {
      lastY.current = y;
      if (hiddenRef.current) {
        hiddenRef.current = false;
        setHidden(false);
      }
      return;
    }

    if (Math.abs(dy) < DIRECTION_THRESHOLD) return;
    lastY.current = y;

    const shouldHide = dy > 0;
    if (shouldHide !== hiddenRef.current) {
      hiddenRef.current = shouldHide;
      setHidden(shouldHide);
    }
  }, []);

  return onScroll;
}

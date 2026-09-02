/**
 * Register a rendered element as a guided-tour target.
 *
 *   const depositRef = useTourTarget("deposit");
 *   <TouchableOpacity ref={depositRef} ... />
 *
 * Returns a stable callback ref; attach it to any View-like component that
 * exposes `measureInWindow` (View, TouchableOpacity, Animated.View, ...).
 * Unmounting the element (ref called with null) unregisters it.
 */
import { useCallback, useEffect, useRef } from "react";
import { useTour, type Measurable, type TourRegistrableId } from "./TourProvider";

export function useTourTarget(id: TourRegistrableId): (node: Measurable | null) => void {
  const { registerTarget } = useTour();
  const registered = useRef(false);

  const ref = useCallback(
    (node: Measurable | null) => {
      registered.current = !!node;
      registerTarget(id, node);
    },
    [id, registerTarget],
  );

  // Belt-and-braces: some renderers skip the null callback on unmount.
  useEffect(() => {
    return () => {
      if (registered.current) registerTarget(id, null);
    };
  }, [id, registerTarget]);

  return ref;
}

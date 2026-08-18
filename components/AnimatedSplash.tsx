import { Image } from "expo-image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Dimensions, StyleSheet } from "react-native";

// The webp animation is nominally 2510 ms (134 frames, plays once and
// freezes on its final frame — loop count 1). Real devices play it slower
// than nominal when frames drop, so the hold is padded well past the
// nominal length; fast devices simply rest on the finished logo briefly.
// The overlay must NEVER lift before the animation has visually finished.
const ANIMATION_MS = 3400;
const FADE_MS = 350;

/**
 * Full-screen overlay that plays the Blender-rendered Pine logo build
 * animation once, then fades away. `onReady` fires when the first frame has
 * decoded — the caller uses it to hide the (plain white) native splash so the
 * handoff is seamless white-to-white with no blank gap.
 */
export function AnimatedSplash({
  onFinish,
  onReady,
}: {
  onFinish: () => void;
  onReady?: () => void;
}) {
  const opacity = useRef(new Animated.Value(1)).current;
  const finishedRef = useRef(false);
  const [loaded, setLoaded] = useState(false);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    Animated.timing(opacity, {
      toValue: 0,
      duration: FADE_MS,
      useNativeDriver: true,
    }).start(() => onFinish());
  }, [onFinish, opacity]);

  // Start the countdown once the first frame has decoded so slow devices
  // don't cut the animation short; hard fallback in case onLoad never fires.
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(finish, ANIMATION_MS);
    return () => clearTimeout(t);
  }, [loaded, finish]);

  // Bail-out for the decode-never-completes case ONLY. It must stand down the
  // moment the animation loads — as a fixed from-mount deadline it was killing
  // the splash mid-play (or before it started) whenever decode was slow, e.g.
  // streaming the asset from Metro in dev builds, so no animation was ever
  // seen. Once `loaded` is true the effect re-runs, clears the pending timer,
  // and the loaded-countdown above owns the finish.
  useEffect(() => {
    if (loaded) return;
    const fallback = setTimeout(finish, ANIMATION_MS + 4000);
    return () => clearTimeout(fallback);
  }, [loaded, finish]);

  const width = Dimensions.get("window").width;

  return (
    <Animated.View style={[styles.wrap, { opacity }]} pointerEvents="none">
      <Image
        source={require("../assets/pine_assets/animations/splash-animation.webp")}
        style={{ width: width * 0.82, aspectRatio: 4 / 3 }}
        contentFit="contain"
        cachePolicy="memory"
        priority="high"
        transition={0}
        onLoad={() => {
          setLoaded(true);
          onReady?.();
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    elevation: 9999,
  },
});

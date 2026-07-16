import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

interface PageTransitionProps {
  children: React.ReactNode;
  /** Vertical distance (dp) the screen travels upward on enter. Default: 18 */
  translateY?: number;
  /** Duration in ms. Default: 320 */
  duration?: number;
}

/**
 * Wraps a screen's content in a subtle fade-in + upward-slide entrance.
 * Drop this around the outermost View of any screen for a premium feel.
 *
 * Usage:
 *   import PageTransition from "@/components/PageTransition";
 *
 *   export default function MyScreen() {
 *     return (
 *       <PageTransition>
 *         <View style={styles.container}>...</View>
 *       </PageTransition>
 *     );
 *   }
 */
export default function PageTransition({
  children,
  translateY = 18,
  duration = 320,
}: PageTransitionProps) {
  const opacity = useSharedValue(0);
  const translate = useSharedValue(translateY);

  useEffect(() => {
    const easing = Easing.out(Easing.cubic);
    opacity.value = withTiming(1, { duration, easing });
    translate.value = withTiming(0, { duration, easing });
  }, []);

  const style = useAnimatedStyle(() => ({
    flex: 1,
    opacity: opacity.value,
    transform: [{ translateY: translate.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

const styles = StyleSheet.create({});

import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, TouchableOpacity } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";

const MUTED = "#9CA3AF";

function EyeOpenIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M1.667 10c0 0 3.333-5.833 8.333-5.833S18.333 10 18.333 10s-3.333 5.833-8.333 5.833S1.667 10 1.667 10z"
        stroke={MUTED}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={10} cy={10} r={2.5} stroke={MUTED} strokeWidth={1.5} />
    </Svg>
  );
}

function EyeClosedIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      {/* Upper arc */}
      <Path
        d="M2.5 6.5C4.5 8.5 7 10.417 10 10.417s5.5-1.917 7.5-3.917"
        stroke={MUTED}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Lashes */}
      <Line x1={10} y1={10.417} x2={10} y2={13} stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={14.5} y1={9.5} x2={15.667} y2={11.917} stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={5.5} y1={9.5} x2={4.333} y2={11.917} stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

interface Props {
  visible: boolean;
  onPress: () => void;
}

export default function AnimatedEyeButton({ visible, onPress }: Props) {
  const anim = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const openOpacity = anim;
  const closedOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <TouchableOpacity style={styles.btn} activeOpacity={0.7} onPress={onPress}>
      <Animated.View style={[styles.icon, { opacity: closedOpacity }]}>
        <EyeClosedIcon />
      </Animated.View>
      <Animated.View style={[styles.icon, StyleSheet.absoluteFillObject, { opacity: openOpacity }]}>
        <EyeOpenIcon />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 4,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    justifyContent: "center",
    alignItems: "center",
  },
});

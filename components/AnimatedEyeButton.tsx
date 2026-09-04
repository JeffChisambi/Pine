import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, TouchableOpacity } from "react-native";
import { EyeOpenIcon as EyeOpenGlyph, EyeClosedIcon as EyeClosedGlyph } from "@/components/icons/AppIcons";

const MUTED = "#9CA3AF";

function EyeOpenIcon() {
  return <EyeOpenGlyph color={MUTED} size={20} />;
}

function EyeClosedIcon() {
  return <EyeClosedGlyph color={MUTED} size={20} />;
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

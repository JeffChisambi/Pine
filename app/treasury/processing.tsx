import React, { useEffect, useRef, useState } from "react";
import { View, Text, Platform, Animated, Easing } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { useColors } from "@/hooks/useColors";
import { TBILL_OPTIONS, calculateReturns } from "./data";

const TEAL = "#164951";
const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";

const STEPS = [
  "Verifying wallet balance",
  "Validating investment",
  "Submitting order",
  "Sending to broker",
  "Completing order",
];

export default function TreasuryProcessing() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { id, amount } = useLocalSearchParams<{ id: string; amount: string }>();
  const bill = TBILL_OPTIONS.find((b) => b.id === id) ?? TBILL_OPTIONS[0];
  const numericAmount = Number(amount) || 0;
  const { earnings, maturityValue } = calculateReturns(numericAmount, bill.yieldPct, bill.duration);

  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Spinner animation
  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();
    return () => spin.stop();
  }, []);

  // Step progression
  useEffect(() => {
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      if (step < STEPS.length) {
        // Fade out, change text, fade in
        Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
          setCurrentStep(step);
          Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
        });
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setDone(true);
          setTimeout(() => {
            router.replace({
              pathname: "/treasury/success" as any,
              params: { id: bill.id, amount: String(numericAmount) },
            });
          }, 700);
        }, 400);
      }
    }, 900);
    return () => clearInterval(interval);
  }, []);

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const topPad = Platform.OS === "web" ? 44 : insets.top || 44;

  return (
    <View style={{ flex: 1, backgroundColor: c.background, alignItems: "center", justifyContent: "center", paddingTop: topPad }}>

      {/* Spinner or checkmark */}
      <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: TEAL + "15", alignItems: "center", justifyContent: "center", marginBottom: 32 }}>
        {done ? (
          <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
            <Circle cx={20} cy={20} r={20} fill={GREEN} />
            <Path d="M12 20.5l6 6 10-12" stroke={WHITE} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        ) : (
          <Animated.View style={{ transform: [{ rotate: spinInterpolate }] }}>
            <Svg width={44} height={44} viewBox="0 0 44 44" fill="none">
              <Circle cx={22} cy={22} r={18} stroke={c.border} strokeWidth={4} />
              <Path d="M22 4A18 18 0 0 1 40 22" stroke={TEAL} strokeWidth={4} strokeLinecap="round" />
            </Svg>
          </Animated.View>
        )}
      </View>

      {/* Current step text */}
      <Animated.Text style={{
        fontFamily: "PlusJakartaSans_600SemiBold",
        fontSize: 18,
        color: c.text,
        marginBottom: 8,
        opacity: fadeAnim,
        textAlign: "center",
      }}>
        {done ? "Order Complete!" : STEPS[currentStep]}
      </Animated.Text>
      <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: MUTED, textAlign: "center", lineHeight: 21, paddingHorizontal: 40 }}>
        {done ? "Your investment has been submitted successfully." : "Please wait while we process your investment..."}
      </Text>

      {/* Steps list */}
      <View style={{ marginTop: 40, gap: 0 }}>
        {STEPS.map((step, i) => {
          const isCompleted = i < currentStep || done;
          const isCurrent = i === currentStep && !done;
          return (
            <View key={step} style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 8, paddingHorizontal: 24 }}>
              <View style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: isCompleted ? GREEN : isCurrent ? TEAL : c.border,
                alignItems: "center",
                justifyContent: "center",
              }}>
                {isCompleted ? (
                  <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                    <Path d="M2.5 6l2.5 2.5 4.5-4.5" stroke={WHITE} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                ) : (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isCurrent ? WHITE : "transparent" }} />
                )}
              </View>
              <Text style={{
                fontFamily: isCompleted || isCurrent ? "PlusJakartaSans_600SemiBold" : "PlusJakartaSans_400Regular",
                fontSize: 14,
                color: isCompleted ? GREEN : isCurrent ? c.text : MUTED,
              }}>
                {step}
              </Text>
            </View>
          );
        })}
      </View>

    </View>
  );
}

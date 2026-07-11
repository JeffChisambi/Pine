import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TEAL = "#164951";
const DARK = "#111827";
const MUTED = "#9CA3AF";
const WHITE = "#FFFFFF";

export default function NewsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 44;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <Text style={styles.title}>News</Text>
      <Text style={styles.subtitle}>Market news coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: DARK,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: MUTED,
  },
});

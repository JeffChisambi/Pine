import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { LANGUAGE_LABEL, type LessonLanguage } from "@/content/lessons";

const GREEN = "#45B369";
const WHITE = "#FFFFFF";

/** English / Chichewa segmented switch. Shared with the lesson screen. */
export function LanguageToggle({ value, onChange, compact = false }: {
  value: LessonLanguage;
  onChange: (l: LessonLanguage) => void;
  /** Smaller pill for headers where space is tight. */
  compact?: boolean;
}) {
  const c = useColors();
  const options: LessonLanguage[] = ["en", "ny"];
  return (
    <View
      accessibilityRole="radiogroup"
      style={{
        flexDirection: "row",
        alignSelf: "flex-start",
        backgroundColor: c.secondary,
        borderRadius: 999,
        padding: 3,
      }}
    >
      {options.map((opt) => {
        const active = opt === value;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onChange(opt)}
            activeOpacity={0.8}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            style={{
              paddingHorizontal: compact ? 11 : 16,
              paddingVertical: compact ? 5 : 7,
              borderRadius: 999,
              backgroundColor: active ? GREEN : "transparent",
            }}
          >
            <Text style={{
              fontFamily: "PlusJakartaSans_600SemiBold",
              fontSize: compact ? 11 : 13,
              color: active ? WHITE : c.mutedForeground,
            }}>
              {LANGUAGE_LABEL[opt]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

import React, { useCallback } from "react";
import {
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useColors } from "@/hooks/useColors";
import { guardedBack, guardedPush } from "@/utils/navigation";
import { LESSONS, type LessonLanguage } from "@/content/lessons";
import { useLessonLanguage, useLessonProgress } from "@/hooks/useLessons";
import { LanguageToggle } from "@/components/education/LanguageToggle";

const GREEN = "#45B369";

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19l-7-7 7-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PlayIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24">
      <Path d="M6 4l14 8-14 8V4z" fill={GREEN} />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12l5 5L20 7" stroke={GREEN} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

const COPY = {
  en: {
    title: "Education",
    lessons: "Lessons",
    hint: "Complete in order to unlock",
    done: "Done",
    min: "min",
    progress: (n: number, total: number) => `${n} of ${total} completed`,
    disclaimer: "Educational content only · Not investment advice",
  },
  ny: {
    title: "Maphunziro",
    lessons: "Maphunziro",
    hint: "Maliza motsatana kuti utsegule lotsatira",
    done: "Wamaliza",
    min: "min",
    progress: (n: number, total: number) => `Wamaliza ${n} mwa ${total}`,
    disclaimer: "Maphunziro okha · Si uphungu wa ndalama",
  },
} satisfies Record<LessonLanguage, unknown>;

export default function EducationScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 16;
  const c = useColors();
  const { language, setLanguage } = useLessonLanguage();
  const { completed, isUnlocked, reload } = useLessonProgress();
  const t = COPY[language];

  // A finished lesson writes progress from its own screen; pick it up when
  // this one comes back into view.
  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>

      {/* ── Nav header ── */}
      <View style={{
        paddingTop: topPad,
        paddingHorizontal: 20,
        paddingBottom: 10,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: c.background,
      }}>
        <TouchableOpacity
          onPress={() => guardedBack("/(tabs)")}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{ width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" }}
        >
          <BackIcon color={c.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center", paddingRight: 40 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text }}>
            {t.title}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 48 }}
      >
        {/* ── Language ── */}
        <LanguageToggle value={language} onChange={setLanguage} />

        {/* ── Section heading ── */}
        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 24, marginBottom: 4 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text }}>
            {t.lessons}
          </Text>
          <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 12, color: GREEN }}>
            {t.progress(completed.size, LESSONS.length)}
          </Text>
        </View>
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: c.mutedForeground, marginBottom: 16 }}>
          {t.hint}
        </Text>

        {/* ── Lesson list ── */}
        <View style={{
          backgroundColor: c.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: c.border,
          overflow: "hidden",
        }}>
          {LESSONS.map((lesson, index) => {
            const unlocked = isUnlocked(lesson.id);
            const done = completed.has(lesson.id);
            return (
              <TouchableOpacity
                key={lesson.id}
                activeOpacity={unlocked ? 0.75 : 1}
                disabled={!unlocked}
                onPress={() => guardedPush(() => router.push(`/lesson/${lesson.id}` as any))}
                accessibilityRole="button"
                accessibilityState={{ disabled: !unlocked }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 15,
                  borderBottomWidth: index < LESSONS.length - 1 ? 1 : 0,
                  borderBottomColor: c.border,
                  opacity: unlocked ? 1 : 0.48,
                }}
              >
                {/* Number badge */}
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: unlocked ? `${GREEN}18` : c.secondary,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 14,
                  flexShrink: 0,
                }}>
                  {done ? <CheckIcon /> : (
                    <Text style={{
                      fontFamily: "PlusJakartaSans_700Bold",
                      fontSize: 13,
                      color: unlocked ? GREEN : c.mutedForeground,
                    }}>
                      {lesson.number}
                    </Text>
                  )}
                </View>

                {/* Title + duration */}
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontFamily: "PlusJakartaSans_600SemiBold",
                    fontSize: 14,
                    color: c.text,
                    lineHeight: 20,
                  }}>
                    {lesson.title[language]}
                  </Text>
                  <Text style={{
                    fontFamily: "PlusJakartaSans_400Regular",
                    fontSize: 12,
                    color: done ? GREEN : c.mutedForeground,
                    marginTop: 2,
                  }}>
                    {done ? t.done : `${lesson.minutes} ${t.min}`}
                  </Text>
                </View>

                {/* Status */}
                {unlocked ? (
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: `${GREEN}18`,
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <PlayIcon />
                  </View>
                ) : (
                  <View style={{ flexShrink: 0, width: 32, alignItems: "center" }}>
                    <LockIcon color={c.mutedForeground} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Disclaimer */}
        <Text style={{
          fontFamily: "PlusJakartaSans_400Regular",
          fontSize: 11,
          color: c.mutedForeground,
          lineHeight: 16,
          marginTop: 20,
          textAlign: "center",
          opacity: 0.7,
        }}>
          {t.disclaimer}
        </Text>

      </ScrollView>
    </View>
  );
}

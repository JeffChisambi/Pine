import React, { useCallback } from "react";
import {
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { G, Path } from "react-native-svg";
import { useColors } from "@/hooks/useColors";
import { guardedBack, guardedPush } from "@/utils/navigation";
import { LESSONS, type LessonLanguage } from "@/content/lessons";
import { useLessonLanguage, useLessonProgress } from "@/hooks/useLessons";
import { LanguageToggle } from "@/components/education/LanguageToggle";

const GREEN = "#45B369";

/** Where the course continues, beyond the lessons that ship in the app. */
const LEARN_MORE_URL = "https://investpine.online/";

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
    learnMore: "Learn more",
  },
  ny: {
    title: "Maphunziro",
    lessons: "Maphunziro",
    hint: "Maliza motsatana kuti utsegule lotsatira",
    done: "Wamaliza",
    min: "min",
    progress: (n: number, total: number) => `Wamaliza ${n} mwa ${total}`,
    disclaimer: "Maphunziro okha · Si uphungu wa ndalama",
    learnMore: "Phunzirani zambiri",
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
        {/* ── Language, and where the course continues ── */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <LanguageToggle value={language} onChange={setLanguage} />
          <TouchableOpacity
            onPress={() => Linking.openURL(LEARN_MORE_URL).catch(() => {})}
            activeOpacity={0.75}
            hitSlop={10}
            accessibilityRole="link"
            accessibilityLabel={`${t.learnMore}, opens investpine.online`}
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            {/* The source art sits at an offset, so the group shifts it back
                to the origin of the 32-unit box. */}
            <Svg width={15} height={15} viewBox="0 0 32 32" fill="none">
              <G transform="translate(-204 -671)">
                <Path
                  d="M231.596,694.829 C229.681,694.192 227.622,693.716 225.455,693.408 C225.75,691.675 225.907,689.859 225.957,688 L233.962,688 C233.783,690.521 232.936,692.854 231.596,694.829 L231.596,694.829 Z M223.434,700.559 C224.1,698.95 224.645,697.211 225.064,695.379 C226.862,695.645 228.586,696.038 230.219,696.554 C228.415,698.477 226.073,699.892 223.434,700.559 L223.434,700.559 Z M220.971,700.951 C220.649,700.974 220.328,701 220,701 C219.672,701 219.352,700.974 219.029,700.951 C218.178,699.179 217.489,697.207 216.979,695.114 C217.973,695.027 218.98,694.976 220,694.976 C221.02,694.976 222.027,695.027 223.022,695.114 C222.511,697.207 221.822,699.179 220.971,700.951 L220.971,700.951 Z M209.781,696.554 C211.414,696.038 213.138,695.645 214.936,695.379 C215.355,697.211 215.9,698.95 216.566,700.559 C213.927,699.892 211.586,698.477 209.781,696.554 L209.781,696.554 Z M208.404,694.829 C207.064,692.854 206.217,690.521 206.038,688 L214.043,688 C214.093,689.859 214.25,691.675 214.545,693.408 C212.378,693.716 210.319,694.192 208.404,694.829 L208.404,694.829 Z M208.404,679.171 C210.319,679.808 212.378,680.285 214.545,680.592 C214.25,682.325 214.093,684.141 214.043,686 L206.038,686 C206.217,683.479 207.064,681.146 208.404,679.171 L208.404,679.171 Z M216.566,673.441 C215.9,675.05 215.355,676.789 214.936,678.621 C213.138,678.356 211.414,677.962 209.781,677.446 C211.586,675.523 213.927,674.108 216.566,673.441 L216.566,673.441 Z M219.029,673.049 C219.352,673.027 219.672,673 220,673 C220.328,673 220.649,673.027 220.971,673.049 C221.822,674.821 222.511,676.794 223.022,678.886 C222.027,678.973 221.02,679.024 220,679.024 C218.98,679.024 217.973,678.973 216.979,678.886 C217.489,676.794 218.178,674.821 219.029,673.049 L219.029,673.049 Z M223.954,688 C223.9,689.761 223.74,691.493 223.439,693.156 C222.313,693.058 221.168,693 220,693 C218.832,693 217.687,693.058 216.562,693.156 C216.26,691.493 216.1,689.761 216.047,688 L223.954,688 L223.954,688 Z M216.047,686 C216.1,684.239 216.26,682.507 216.562,680.844 C217.687,680.942 218.832,681 220,681 C221.168,681 222.313,680.942 223.438,680.844 C223.74,682.507 223.9,684.239 223.954,686 L216.047,686 L216.047,686 Z M230.219,677.446 C228.586,677.962 226.862,678.356 225.064,678.621 C224.645,676.789 224.1,675.05 223.434,673.441 C226.073,674.108 228.415,675.523 230.219,677.446 L230.219,677.446 Z M231.596,679.171 C232.936,681.146 233.783,683.479 233.962,686 L225.957,686 C225.907,684.141 225.75,682.325 225.455,680.592 C227.622,680.285 229.681,679.808 231.596,679.171 L231.596,679.171 Z M220,671 C211.164,671 204,678.163 204,687 C204,695.837 211.164,703 220,703 C228.836,703 236,695.837 236,687 C236,678.163 228.836,671 220,671 L220,671 Z"
                  fill={GREEN}
                />
              </G>
            </Svg>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: GREEN }}>
              {t.learnMore}
            </Text>
          </TouchableOpacity>
        </View>

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

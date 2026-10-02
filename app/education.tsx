import React, { useCallback, useState } from "react";
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
import Svg, { Path, Polygon } from "react-native-svg";
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
    masterClass: "Master Class",
    masterClassBody:
      "The six lessons here are the groundwork. The Master Class goes further: " +
      "reading a company's results, judging what a share is worth, and building " +
      "a portfolio you can hold through a bad year.",
    masterClassCta: "Open the Master Class",
  },
  ny: {
    title: "Maphunziro",
    lessons: "Maphunziro",
    hint: "Maliza motsatana kuti utsegule lotsatira",
    done: "Wamaliza",
    min: "min",
    progress: (n: number, total: number) => `Wamaliza ${n} mwa ${total}`,
    disclaimer: "Maphunziro okha · Si uphungu wa ndalama",
    masterClass: "Master Class",
    masterClassBody:
      "Maphunziro asanu ndi limodzi pano ndi maziko. Master Class imapitiriza: " +
      "kuwerenga zotsatira za kampani, kudziwa mtengo weniweni wa sheya, ndi " +
      "kupanga portfolio yomwe mungakhale nayo ngakhale chaka chikakhala choipa.",
    masterClassCta: "Tsegulani Master Class",
  },
} satisfies Record<LessonLanguage, unknown>;

/** The graduation cap, from the supplied artwork. */
function GraduationIcon({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill="none">
      <Polygon
        points="445.055 384.794 445.055 221.864 418.805 234.989 418.805 384.777 401.301 429.785 462.551 429.785 445.055 384.794"
        fill={GREEN}
      />
      <Path
        d="M229.0648,306.3708l-107.7643-53.88v53.7754c0,36.2433,58.7634,65.625,131.25,65.625,72.4887,0,131.25-29.3817,131.25-65.625V252.49L276.0277,306.3741C257.5813,313.681,247.5133,313.6789,229.0648,306.3708Z"
        fill={GREEN}
      />
      <Path
        d="M264.2912,282.8969l186.5207-93.26c6.4579-3.2289,6.4579-8.5107,0-11.74l-186.5207-93.26c-6.4556-3.2289-17.0214-3.2289-23.4793,0l-186.5207,93.26c-6.4556,3.2289-6.4556,8.5107,0,11.74l186.5207,93.26C247.27,286.1258,257.8356,286.1258,264.2912,282.8969Z"
        fill={GREEN}
      />
    </Svg>
  );
}

function ChevronIcon({ color, up }: { color: string; up: boolean }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d={up ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * The Master Class, as a card that opens.
 *
 * Collapsed it is one line, so it does not compete with the lessons a learner
 * came here for. Opened it explains what the Master Class covers and offers
 * the link, which leaves the app — so the card says what it is before anyone
 * taps through to a browser.
 */
function MasterClassCard({ copy }: { copy: { masterClass: string; masterClassBody: string; masterClassCta: string } }) {
  const c = useColors();
  const [open, setOpen] = useState(false);

  return (
    <View
      style={{
        marginTop: 16,
        borderRadius: 16,
        backgroundColor: c.card,
        borderWidth: 1,
        borderColor: c.border,
        overflow: "hidden",
      }}
    >
      <TouchableOpacity
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingVertical: 16,
          gap: 12,
        }}
      >
        <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: c.text, flex: 1 }}>
          {copy.masterClass}
        </Text>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: c.background,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <GraduationIcon />
        </View>
        <ChevronIcon color={c.mutedForeground} up={open} />
      </TouchableOpacity>

      {open && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 18, marginTop: -4 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, lineHeight: 20, color: c.mutedForeground }}>
            {copy.masterClassBody}
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(LEARN_MORE_URL).catch(() => {})}
            activeOpacity={0.85}
            accessibilityRole="link"
            accessibilityLabel={`${copy.masterClassCta}, opens investpine.online`}
            style={{
              alignSelf: "flex-start",
              marginTop: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: GREEN,
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 9,
            }}
          >
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: "#FFFFFF" }}>
              {copy.masterClassCta}
            </Text>
            {/* Leaves the app, so it says so. */}
            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
              <Path d="M14 4h6v6M20 4l-8 8" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M19 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

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

        {/* ── Master Class ── */}
        <MasterClassCard copy={t} />

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

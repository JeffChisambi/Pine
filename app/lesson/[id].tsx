/**
 * One lesson, taught the way a person would teach it: a sentence or two
 * appears as if being typed, then a pause, then the next. Tapping the text
 * finishes the current segment instantly for anyone who reads faster than it
 * types. Finishing the last segment marks the lesson done and unlocks the next.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import { guardedBack } from "@/utils/navigation";
import { LESSONS, lessonById, type LessonLanguage } from "@/content/lessons";
import { useLessonLanguage, useLessonProgress } from "@/hooks/useLessons";
import { LanguageToggle } from "@/components/education/LanguageToggle";

const GREEN = "#45B369";
const WHITE = "#FFFFFF";

// Reading pace, not typing pace: fast enough that nobody waits on a word,
// slow enough that the eye follows it.
const CHAR_MS = 22;
const PUNCTUATION_PAUSE_MS = 180;

const COPY = {
  en: {
    continue: "Continue",
    finish: "Finish lesson",
    next: "Next lesson",
    back: "Back to lessons",
    tapToSkip: "Tap the text to show it all",
    lessonOf: (n: number, total: number) => `Lesson ${n} of ${total}`,
    complete: "Lesson complete",
    completeBody: "Well done. The next lesson is now open.",
    courseDone: "You have finished the course.",
  },
  ny: {
    continue: "Pitirizani",
    finish: "Maliza phunziro",
    next: "Phunziro lotsatira",
    back: "Bwererani ku maphunziro",
    tapToSkip: "Dinani mawu kuti muwone onse",
    lessonOf: (n: number, total: number) => `Phunziro ${n} mwa ${total}`,
    complete: "Phunziro lamaliza",
    completeBody: "Zabwino. Phunziro lotsatira latsegulidwa.",
    courseDone: "Mwamaliza maphunziro onse.",
  },
} satisfies Record<LessonLanguage, unknown>;

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19l-7-7 7-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12l5 5L20 7" stroke={GREEN} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Types `text` out; calls onDone when the whole string is showing. */
function useTypewriter(text: string, enabled: boolean, onDone: () => void) {
  const [shown, setShown] = useState(enabled ? "" : text);
  const [done, setDone] = useState(!enabled);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!enabled) {
      setShown(text);
      setDone(true);
      doneRef.current();
      return;
    }
    setShown("");
    setDone(false);
    let i = 0;
    const tick = () => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        setDone(true);
        doneRef.current();
        return;
      }
      const ch = text[i - 1];
      const pause = /[.!?]/.test(ch) ? PUNCTUATION_PAUSE_MS : /[,;:]/.test(ch) ? 90 : 0;
      timer.current = setTimeout(tick, CHAR_MS + pause);
    };
    timer.current = setTimeout(tick, 160);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [text, enabled]);

  const finishNow = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setShown(text);
    if (!done) {
      setDone(true);
      doneRef.current();
    }
  }, [text, done]);

  return { shown, done, finishNow };
}

function Caret({ visible, color }: { visible: boolean; color: string }) {
  const blink = useSharedValue(1);
  useEffect(() => {
    blink.value = withRepeat(withSequence(withTiming(0, { duration: 420 }), withTiming(1, { duration: 420 })), -1, false);
  }, [blink]);
  const style = useAnimatedStyle(() => ({ opacity: blink.value }));
  if (!visible) return null;
  return <Animated.Text style={[{ color, fontFamily: "PlusJakartaSans_400Regular", fontSize: 17 }, style]}>▍</Animated.Text>;
}

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = useMemo(() => lessonById(String(id)), [id]);
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 16;
  const c = useColors();
  const { language, setLanguage } = useLessonLanguage();
  const { markCompleted } = useLessonProgress();
  const t = COPY[language];

  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, []);

  // How many segments are on screen; the last one is the one being typed.
  const [revealed, setRevealed] = useState(1);
  const [typingDone, setTypingDone] = useState(false);
  const [finished, setFinished] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Switching language mid-lesson restarts the current segment in the new
  // language but keeps the place.
  useEffect(() => { setTypingDone(false); }, [language]);

  // "Next lesson" replaces the route in place, so the screen instance can
  // survive with the previous lesson's state. Start over for a new id.
  useEffect(() => {
    setRevealed(1);
    setTypingDone(false);
    setFinished(false);
  }, [id]);

  if (!lesson) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontFamily: "PlusJakartaSans_500Medium", color: c.mutedForeground }}>Lesson not found.</Text>
      </View>
    );
  }

  const total = lesson.segments.length;
  const isLastSegment = revealed >= total;
  const nextLesson = LESSONS.find((l) => l.number === lesson.number + 1);

  const advance = async () => {
    if (!typingDone) return;
    if (isLastSegment) {
      await markCompleted(lesson.id);
      setFinished(true);
      return;
    }
    setTypingDone(false);
    setRevealed((n) => n + 1);
  };

  const scrollToEnd = () => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* ── Header ── */}
      <View style={{ paddingTop: topPad, paddingHorizontal: 20, paddingBottom: 8, flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity
          onPress={() => guardedBack("/education")}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{ width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" }}
        >
          <BackIcon color={c.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 11, color: c.mutedForeground, letterSpacing: 0.6 }}>
            {t.lessonOf(lesson.number, LESSONS.length).toUpperCase()}
          </Text>
          <Text numberOfLines={1} style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: c.text, marginTop: 1 }}>
            {lesson.title[language]}
          </Text>
        </View>
      </View>

      {/* ── Progress + language ── */}
      <View style={{ paddingHorizontal: 20, marginTop: 6, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: c.secondary, overflow: "hidden" }}>
          <View style={{ width: `${Math.round(((finished ? total : revealed - (typingDone ? 0 : 1)) / total) * 100)}%`, height: "100%", backgroundColor: GREEN, borderRadius: 2 }} />
        </View>
        <LanguageToggle value={language} onChange={setLanguage} compact />
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 22, paddingBottom: 140 }}
        onContentSizeChange={scrollToEnd}
      >
        {lesson.segments.slice(0, revealed).map((seg, i) => {
          const isCurrent = i === revealed - 1 && !finished;
          return (
            <Segment
              key={`${i}-${language}`}
              heading={seg.heading?.[language]}
              text={seg.text[language]}
              typing={isCurrent && !reduceMotion}
              isCurrent={isCurrent}
              onDone={() => { if (isCurrent) setTypingDone(true); }}
              c={c}
            />
          );
        })}

        {finished && (
          <View style={{
            marginTop: 8,
            backgroundColor: `${GREEN}14`,
            borderRadius: 16,
            padding: 20,
            alignItems: "center",
            gap: 8,
          }}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: `${GREEN}22`, alignItems: "center", justifyContent: "center" }}>
              <CheckIcon />
            </View>
            <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 17, color: c.text, marginTop: 4 }}>{t.complete}</Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: c.mutedForeground, textAlign: "center", lineHeight: 19 }}>
              {nextLesson ? t.completeBody : t.courseDone}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Action ── */}
      <View style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        paddingHorizontal: 20, paddingTop: 12,
        paddingBottom: Math.max(insets.bottom, 16),
        backgroundColor: c.background,
        borderTopWidth: 1, borderTopColor: c.border,
        gap: 8,
      }}>
        {!finished ? (
          <>
            <TouchableOpacity
              onPress={advance}
              disabled={!typingDone}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ disabled: !typingDone }}
              style={{
                backgroundColor: GREEN,
                opacity: typingDone ? 1 : 0.35,
                borderRadius: 12, height: 50,
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: WHITE }}>
                {isLastSegment ? t.finish : t.continue}
              </Text>
            </TouchableOpacity>
            {!typingDone && (
              <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: c.mutedForeground, textAlign: "center" }}>
                {t.tapToSkip}
              </Text>
            )}
          </>
        ) : (
          <>
            {nextLesson && (
              <TouchableOpacity
                onPress={() => router.replace(`/lesson/${nextLesson.id}` as any)}
                activeOpacity={0.85}
                accessibilityRole="button"
                style={{ backgroundColor: GREEN, borderRadius: 12, height: 50, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: WHITE }}>{t.next}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => guardedBack("/education")}
              activeOpacity={0.8}
              accessibilityRole="button"
              style={{ height: 46, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: nextLesson ? c.mutedForeground : GREEN }}>{t.back}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

function Segment({ heading, text, typing, isCurrent, onDone, c }: {
  heading?: string;
  text: string;
  typing: boolean;
  isCurrent: boolean;
  onDone: () => void;
  c: ReturnType<typeof useColors>;
}) {
  const { shown, done, finishNow } = useTypewriter(text, typing, onDone);
  return (
    <Pressable onPress={finishNow} disabled={done} style={{ marginBottom: 22, opacity: isCurrent ? 1 : 0.62 }}>
      {!!heading && (
        <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 12, color: GREEN, letterSpacing: 0.8, marginBottom: 6 }}>
          {heading.toUpperCase()}
        </Text>
      )}
      <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 17, color: c.text, lineHeight: 28 }}>
        {shown}
        <Caret visible={isCurrent && !done} color={GREEN} />
      </Text>
    </Pressable>
  );
}

/**
 * Lesson progress and language, kept on the device.
 *
 * Lessons unlock in order: lesson N is open once lessons 1..N-1 are done.
 * Progress lives in AsyncStorage, not on the server, because a course is a
 * private thing and nothing about the account depends on it.
 */
import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LESSONS, type LessonLanguage } from "@/content/lessons";

const COMPLETED_KEY = "@pine_lessons_completed";
const LANGUAGE_KEY = "@pine_lessons_language";

export function useLessonProgress() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(COMPLETED_KEY);
      const ids: unknown = raw ? JSON.parse(raw) : [];
      setCompleted(new Set(Array.isArray(ids) ? ids.filter((x) => typeof x === "string") : []));
    } catch {
      setCompleted(new Set());
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Read-merge-write against storage, not against this hook's state: the
  // lesson screen has its own instance, and writing from a copy that had not
  // loaded yet would wipe every other lesson's progress.
  const markCompleted = useCallback(async (id: string) => {
    let ids: string[] = [];
    try {
      const raw = await AsyncStorage.getItem(COMPLETED_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      ids = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
    } catch {
      ids = [];
    }
    if (!ids.includes(id)) ids.push(id);
    await AsyncStorage.setItem(COMPLETED_KEY, JSON.stringify(ids)).catch(() => {});
    setCompleted(new Set(ids));
  }, []);

  const isUnlocked = useCallback(
    (id: string) => {
      const index = LESSONS.findIndex((l) => l.id === id);
      if (index <= 0) return true;
      return LESSONS.slice(0, index).every((l) => completed.has(l.id));
    },
    [completed],
  );

  return { loaded, completed, markCompleted, isUnlocked, reload };
}

export function useLessonLanguage() {
  const [language, setLanguageState] = useState<LessonLanguage>("en");

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY)
      .then((v) => { if (v === "en" || v === "ny") setLanguageState(v); })
      .catch(() => {});
  }, []);

  const setLanguage = useCallback((lang: LessonLanguage) => {
    setLanguageState(lang);
    AsyncStorage.setItem(LANGUAGE_KEY, lang).catch(() => {});
  }, []);

  return { language, setLanguage };
}

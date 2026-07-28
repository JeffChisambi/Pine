import React from "react";
import {
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useColors } from "@/hooks/useColors";
import { guardedBack } from "@/utils/navigation";

const GREEN = "#45B369";
const WHITE = "#FFFFFF";

type Colors = ReturnType<typeof useColors>;

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

function LockIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

const LESSONS = [
  { number: 1, title: "What Is a Stock?",                duration: "3 min", unlocked: true  },
  { number: 2, title: "How the Stock Exchange Works",    duration: "4 min", unlocked: false },
  { number: 3, title: "Reading Stock Prices",            duration: "3 min", unlocked: false },
  { number: 4, title: "Market Indices Explained",        duration: "5 min", unlocked: false },
  { number: 5, title: "Buy, Sell & Hold",                duration: "4 min", unlocked: false },
  { number: 6, title: "Building Your First Portfolio",   duration: "6 min", unlocked: false },
];

const STATS = [
  { label: "Lessons",  value: "6"        },
  { label: "Duration", value: "25 min"   },
  { label: "Level",    value: "Beginner" },
];

export default function EducationScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 44;
  const c = useColors();

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>

      {/* ── Nav header ── */}
      <View style={{
        paddingTop: topPad + 8,
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
            Education
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
      >

        {/* ── Hero card ── */}
        <View style={{
          backgroundColor: "#0D3540",
          borderRadius: 20,
          padding: 24,
          marginBottom: 28,
        }}>
          {/* Badge */}
          <View style={{
            alignSelf: "flex-start",
            backgroundColor: "rgba(69,179,105,0.18)",
            borderRadius: 6,
            paddingHorizontal: 9,
            paddingVertical: 4,
            marginBottom: 14,
          }}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 10, color: GREEN, letterSpacing: 1.4 }}>
              FUNDAMENTALS COURSE
            </Text>
          </View>

          {/* Title */}
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 26, color: WHITE, lineHeight: 33, marginBottom: 8 }}>
            Market{"\n"}Fundamentals
          </Text>

          {/* Subtitle */}
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: "rgba(255,255,255,0.52)", lineHeight: 19, marginBottom: 22 }}>
            Build a confident foundation before you make your first investment.
          </Text>

          {/* Stats row */}
          <View style={{ flexDirection: "row", gap: 24 }}>
            {STATS.map((stat) => (
              <View key={stat.label}>
                <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: WHITE }}>{stat.value}</Text>
                <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: "rgba(255,255,255,0.42)", marginTop: 2 }}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 20 }} />

          {/* CTA */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={{
              backgroundColor: GREEN,
              borderRadius: 12,
              height: 48,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: WHITE }}>
              Begin Course
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Section heading ── */}
        <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text, marginBottom: 4 }}>
          Lessons
        </Text>
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: c.mutedForeground, marginBottom: 16 }}>
          Complete in order to unlock
        </Text>

        {/* ── Lesson list ── */}
        <View style={{
          backgroundColor: c.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: c.border,
          overflow: "hidden",
        }}>
          {LESSONS.map((lesson, index) => (
            <TouchableOpacity
              key={lesson.number}
              activeOpacity={lesson.unlocked ? 0.75 : 1}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 15,
                borderBottomWidth: index < LESSONS.length - 1 ? 1 : 0,
                borderBottomColor: c.border,
                opacity: lesson.unlocked ? 1 : 0.48,
              }}
            >
              {/* Number badge */}
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: lesson.unlocked ? `${GREEN}18` : c.secondary,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
                flexShrink: 0,
              }}>
                <Text style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  fontSize: 13,
                  color: lesson.unlocked ? GREEN : c.mutedForeground,
                }}>
                  {lesson.number}
                </Text>
              </View>

              {/* Title + duration */}
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontFamily: "PlusJakartaSans_600SemiBold",
                  fontSize: 14,
                  color: c.text,
                  lineHeight: 20,
                }}>
                  {lesson.title}
                </Text>
                <Text style={{
                  fontFamily: "PlusJakartaSans_400Regular",
                  fontSize: 12,
                  color: c.mutedForeground,
                  marginTop: 2,
                }}>
                  {lesson.duration}
                </Text>
              </View>

              {/* Status */}
              {lesson.unlocked ? (
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
          ))}
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
          Educational content only · Not investment advice
        </Text>

      </ScrollView>
    </View>
  );
}

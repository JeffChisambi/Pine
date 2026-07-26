import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";
import Svg, { Circle, Path } from "react-native-svg";

import { EDUCATION_ICON_SVG } from "@/constants/EducationIconSvg";
import { useColors } from "@/hooks/useColors";
import { guardedBack } from "@/utils/navigation";

const TEAL = "#164951";
const GREEN = "#45B369";
const MUTED = "#9CA3AF";
const WHITE = "#FFFFFF";

type Colors = ReturnType<typeof useColors>;

type LearningPath = {
  id: string;
  label: string;
  title: string;
  description: string;
  lessons: string;
  Icon: React.ComponentType<{ color: string }>;
};

type Topic = {
  category: string;
  title: string;
  description: string;
  Icon: React.ComponentType<{ color: string }>;
};

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19l-7-7 7-7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BookIcon({ color }: { color: string }) {
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Path d="M4 5.5v16M8 7h8M8 11h8" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

function ChartIcon({ color }: { color: string }) {
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
      <Path d="M4 19.5V4.5M4 19.5h16" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Path
        d="m7 15 3.2-3.4 2.8 2.1L18 8.5"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M15.5 8.5H18v2.5" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ShieldIcon({ color }: { color: string }) {
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.75 20 6.5v5.1c0 4.5-3.15 8.65-8 9.65-4.85-1-8-5.15-8-9.65V6.5l8-3.75Z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Path d="m8.5 12 2.2 2.2 4.8-5" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WalletIcon({ color }: { color: string }) {
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 1 4 17.5v-11Z"
        stroke={color}
        strokeWidth={1.7}
      />
      <Path d="M4 7h14.5A2.5 2.5 0 0 1 21 9.5v5H16a2.5 2.5 0 0 1 0-5h5" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
      <Circle cx={16} cy={12} r={0.8} fill={color} />
    </Svg>
  );
}

const LEARNING_PATHS: LearningPath[] = [
  {
    id: "foundations",
    label: "START HERE",
    title: "Investment foundations",
    description: "Learn the essentials before you make your first move.",
    lessons: "4 lessons · 12 min",
    Icon: BookIcon,
  },
  {
    id: "portfolio",
    label: "BUILD SKILL",
    title: "Build your portfolio",
    description: "Turn your goals into a balanced investment plan.",
    lessons: "5 lessons · 18 min",
    Icon: ChartIcon,
  },
  {
    id: "risk",
    label: "INVEST SMART",
    title: "Manage risk with confidence",
    description: "Understand volatility and make decisions that fit you.",
    lessons: "3 lessons · 10 min",
    Icon: ShieldIcon,
  },
];

const TOPICS: Topic[] = [
  {
    category: "BASICS",
    title: "How shares work",
    description: "The simple guide to owning a piece of a company.",
    Icon: ChartIcon,
  },
  {
    category: "PLANNING",
    title: "Set an investing goal",
    description: "Match your investments to the life you are building.",
    Icon: WalletIcon,
  },
  {
    category: "RISK",
    title: "Diversification explained",
    description: "Why spreading your money can help smooth the ride.",
    Icon: ShieldIcon,
  },
];

function SectionHeading({
  eyebrow,
  title,
  c,
}: {
  eyebrow: string;
  title: string;
  c: Colors;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text
        style={{
          fontFamily: "PlusJakartaSans_600SemiBold",
          fontSize: 11,
          letterSpacing: 1.1,
          color: GREEN,
          marginBottom: 5,
        }}
      >
        {eyebrow}
      </Text>
      <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 21, color: c.text }}>
        {title}
      </Text>
    </View>
  );
}

export default function EducationScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 44;
  const c = useColors();
  const [selectedPath, setSelectedPath] = useState(LEARNING_PATHS[0].id);
  const selected = LEARNING_PATHS.find((path) => path.id === selectedPath) ?? LEARNING_PATHS[0];

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View
        style={{
          paddingTop: topPad + 8,
          paddingHorizontal: 20,
          paddingBottom: 10,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
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
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        <View
          style={{
            backgroundColor: TEAL,
            borderRadius: 20,
            minHeight: 208,
            padding: 22,
            overflow: "hidden",
            marginBottom: 30,
          }}
        >
          <View style={{ width: "63%", zIndex: 1 }}>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_600SemiBold",
                fontSize: 11,
                letterSpacing: 1.1,
                color: "rgba(255,255,255,0.66)",
                marginBottom: 9,
              }}
            >
              PINE EDUCATION
            </Text>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                fontSize: 24,
                lineHeight: 31,
                color: WHITE,
                marginBottom: 9,
              }}
            >
              Invest with{"\n"}more confidence.
            </Text>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_400Regular",
                fontSize: 12,
                lineHeight: 18,
                color: "rgba(255,255,255,0.72)",
              }}
            >
              Clear, practical lessons to help you make informed decisions.
            </Text>
          </View>
          <View
            style={{
              position: "absolute",
              right: -4,
              bottom: 0,
              opacity: 0.98,
            }}
          >
            <SvgXml xml={EDUCATION_ICON_SVG} width={164} height={120} />
          </View>
          <View
            style={{
              position: "absolute",
              width: 190,
              height: 190,
              borderRadius: 95,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.18)",
              right: -82,
              top: -68,
            }}
          />
        </View>

        <SectionHeading eyebrow="YOUR NEXT STEP" title="Choose a learning path" c={c} />
        <View
          style={{
            backgroundColor: c.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: c.border,
            padding: 16,
            marginBottom: 12,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: `${GREEN}22`,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 13,
            }}
          >
            <selected.Icon color={GREEN} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: c.text }}>
              Continue with {selected.title}
            </Text>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_400Regular",
                fontSize: 12,
                color: c.mutedForeground,
                marginTop: 4,
              }}
            >
              {selected.lessons}
            </Text>
            <View style={{ height: 5, backgroundColor: c.secondary, borderRadius: 3, marginTop: 11, overflow: "hidden" }}>
              <View style={{ width: "28%", height: "100%", backgroundColor: GREEN, borderRadius: 3 }} />
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingBottom: 3 }}
        >
          {LEARNING_PATHS.map((path) => {
            const isSelected = path.id === selectedPath;
            return (
              <TouchableOpacity
                key={path.id}
                activeOpacity={0.85}
                onPress={() => setSelectedPath(path.id)}
                style={{
                  width: 204,
                  minHeight: 154,
                  padding: 15,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: isSelected ? GREEN : c.border,
                  backgroundColor: isSelected ? `${GREEN}12` : c.card,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 13 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: isSelected ? `${GREEN}25` : c.secondary, alignItems: "center", justifyContent: "center" }}>
                    <path.Icon color={isSelected ? GREEN : c.text} />
                  </View>
                  {isSelected && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: GREEN }} />}
                </View>
                <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 10, letterSpacing: 0.8, color: GREEN, marginBottom: 5 }}>
                  {path.label}
                </Text>
                <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, lineHeight: 19, color: c.text }}>
                  {path.title}
                </Text>
                <Text numberOfLines={2} style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, lineHeight: 16, color: c.mutedForeground, marginTop: 5 }}>
                  {path.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={{ marginTop: 30 }}>
          <SectionHeading eyebrow="QUICK READS" title="Build your investing toolkit" c={c} />
          <View
            style={{
              backgroundColor: c.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: c.border,
              overflow: "hidden",
            }}
          >
            {TOPICS.map((topic, index) => (
              <View
                key={topic.title}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 15,
                  borderBottomWidth: index < TOPICS.length - 1 ? 1 : 0,
                  borderBottomColor: c.border,
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${TEAL}18`, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                  <topic.Icon color={c.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 10, letterSpacing: 0.8, color: GREEN, marginBottom: 4 }}>
                    {topic.category}
                  </Text>
                  <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text }}>
                    {topic.title}
                  </Text>
                  <Text numberOfLines={1} style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: c.mutedForeground, marginTop: 3 }}>
                    {topic.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View
          style={{
            marginTop: 24,
            padding: 16,
            borderRadius: 14,
            backgroundColor: c.secondary,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <BookIcon color={GREEN} />
          <Text style={{ flex: 1, marginLeft: 11, fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, lineHeight: 18, color: c.mutedForeground }}>
            Education is for information only and is not investment advice.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
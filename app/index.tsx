import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ─── Colours ─────────────────────────────────────────────── */
const TEAL          = "#164951";
const WHITE         = "#FFFFFF";
const DARK          = "#111827";
const MUTED_DARK    = "#6B7280";

/* ─── Slide 1 sub-components ───────────────────────────────────── */
function Slide1Illustration() {
  return (
    <Image
      source={require("../assets/pine_assets/assets/img1.png")}
      style={s.slide1Image}
      contentFit="contain"
    />
  );
}

/* ─── Slide 2 sub-component ───────────────────────────────── */
function Slide2Illustration() {
  return (
    <Image
      source={require("../assets/pine_assets/assets/img_2.png")}
      style={s.slide2Image}
      contentFit="contain"
    />
  );
}

/* ─── Slide data ────────────────────────────────────────────── */
const SLIDES = [
  {
    Illustration: Slide1Illustration,
    headline: "The easiest way to invest",
    description: "Buy and sell stocks, track your portfolio performance, and grow your wealth all in one place.",
  },
  {
    Illustration: Slide2Illustration,
    headline: "Real-Time Market Data",
    description: "Monitor live stock prices, track market trends, and make smarter investment decisions with powerful analytics.",
  },
];

/* ─── Main screen ──────────────────────────────────────────── */
export default function OnboardingScreen() {
  const insets   = useSafeAreaInsets();
  const topPad   = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad= Platform.OS === "web" ? 34 : Math.max(insets.bottom, 12);
  const { width, height }  = useWindowDimensions();
  const isLargeScreen = height > 800;
  const illustrationH = Math.min(height * 0.35, 320);

  const [activeSlide, setActiveSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setActiveSlide(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const markOnboardedAndGoToLogin = async () => {
    await AsyncStorage.setItem("@pine_has_onboarded", "true");
    router.replace("/login");
  };

  const handleNext = () => {
    if (activeSlide < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeSlide + 1, animated: true });
    } else {
      markOnboardedAndGoToLogin();
    }
  };

  return (
    <View style={[s.container, { paddingTop: topPad, paddingBottom: bottomPad }]}>

      {/* ── Top bar ── */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.skipBtn} activeOpacity={0.7} onPress={markOnboardedAndGoToLogin}>
          <Text style={s.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* ── Swipeable content ── */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        keyExtractor={(_, index) => index.toString()}
        style={{ flex: 1 }}
        renderItem={({ item }) => (
          <View style={{ width, flex: 1, justifyContent: "center" }}>
            <View style={[s.illustrationWrap, { height: illustrationH }]}>
              <item.Illustration />
            </View>
            <View style={s.textSection}>
              <Text style={[s.headline, isLargeScreen && { fontSize: 30 }]}>{item.headline}</Text>
              <Text style={s.description}>{item.description}</Text>
            </View>
          </View>
        )}
      />

      {/* ── Bottom Controls ── */}
      <View style={s.bottomContainer}>
        <View style={s.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                s.dot,
                {
                  width: activeSlide === i ? 20 : 8,
                  backgroundColor: activeSlide === i ? TEAL : "#EBECEF",
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={s.nextBtn} activeOpacity={0.85} onPress={handleNext}>
          <Text style={s.nextBtnText}>{activeSlide === SLIDES.length - 1 ? "Get Started" : "Next"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },

  /* Top bar */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    height: 44,
  },
  skipBtn: {
    borderWidth: 1,
    borderColor: "#EBECEF",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  skipText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
    color: TEAL,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },

  /* Animated wrapper */
  animatedContent: {
    flex: 1,
  },

  /* Illustration */
  illustrationWrap: {
    width: "100%",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  /* ── Slide 1 image ── */
  slide1Image: {
    width: "100%",
    height: "100%",
  },

  /* ── Slide 2 image ── */
  slide2Image: {
    width: "100%",
    height: "100%",
  },

  /* Text section */
  textSection: {
    paddingHorizontal: 28,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
    paddingBottom: 16,
  },
  headline: {
    fontSize: 28,
    fontFamily: "PlusJakartaSans_700Bold",
    color: DARK,
    lineHeight: 36,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_400Regular",
    color: MUTED_DARK,
    lineHeight: 22,
    textAlign: "center",
  },

  /* Bottom Controls */
  bottomContainer: {
    paddingHorizontal: 28,
    paddingBottom: 20,
    gap: 32,
  },
  nextBtn: {
    height: 56,
    borderRadius: 12,
    backgroundColor: TEAL,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtnText: {
    color: WHITE,
    fontSize: 16,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },

  /* Dots */
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});

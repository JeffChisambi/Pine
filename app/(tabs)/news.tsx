import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
// expo-image: disk+memory caching, fast decode, graceful transitions — fixes
// slow/flaky remote news images that the plain RN Image had no cache for.
import { Image } from "expo-image";
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
  interpolateColor,
  interpolate,
} from "react-native-reanimated";
import { TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Circle } from "react-native-svg";
import { ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useNews } from "@/hooks/useNews";
import { API_BASE_URL } from "@/services/api";

// ─── Brand tokens ───────────────────────────────────────────────────────────────
const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";
const MUTED2 = "#6B7280";
const RED   = "#EF4770";

// ─── Types ──────────────────────────────────────────────────────────────────────
type Metric = { label: string; value: string; up?: boolean };
type NewsItem = {
  id: string;
  category: string;
  title: string;
  summary: string;
  body: string[];
  metrics?: Metric[];
  time: string;
  source: string;
  image: any;
  featured?: boolean;
};

const CATEGORIES = ["All", "Banking", "Markets", "Insurance"];

// News is loaded from the backend (DB-driven) via useNews() — see below.
// The NewsItem shape above matches the API's ApiNewsItem (image is a URL string).

// ─── Helper ─────────────────────────────────────────────────────────────────────
// News hero images are always served by the same backend the app talks to.
// A stored URL can be unreachable from the device when the backend baked it
// from a misconfigured APP_URL (e.g. http://localhost:3000/... — "localhost"
// on a phone is the phone itself) or when it is a relative path. In those
// cases resolve it against our own API origin so it actually loads. Genuine
// external URLs (pasted CDN / publisher links) are left untouched.
const API_ORIGIN = API_BASE_URL.replace(/\/v1\/?$/, "");

function resolveImageUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("/")) return `${API_ORIGIN}${url}`;
  const loopback = url.match(
    /^https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::\d+)?(\/.*)?$/i,
  );
  if (loopback) return `${API_ORIGIN}${loopback[1] ?? ""}`;
  return url;
}

function imgSrc(image: any) {
  return typeof image === "string" ? { uri: resolveImageUrl(image) } : image;
}

// ─── Icons ──────────────────────────────────────────────────────────────────────
function SearchIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
        stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
      />
      <Path d="M21 21L16.65 16.65" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={GREEN} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19l-7-7 7-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}


// ─── Featured card ──────────────────────────────────────────────────────────────
function FeaturedCard({ item, onPress, c }: { item: NewsItem; onPress: () => void; c: ReturnType<typeof useColors> }) {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={{
        marginHorizontal: 20,
        borderRadius: 20,
        backgroundColor: c.card,
        borderWidth: 1,
        borderColor: c.border,
        overflow: "hidden",
        marginBottom: 12,
      }}
    >
      {/* Cover image — clipped by card's overflow: hidden */}
      <Image
        source={imgSrc(item.image)}
        style={{ width: "100%", height: 192, backgroundColor: c.border }}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={150}
      />

      {/* Content */}
      <View style={{ padding: 16, gap: 10 }}>
        {/* Meta row */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}>{item.time}</Text>
        </View>

        {/* Title */}
        <Text
          style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: c.text, lineHeight: 24 }}
          numberOfLines={3}
        >
          {item.title}
        </Text>

        {/* Footer */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED, flexShrink: 1 }} numberOfLines={1}>{item.source}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: GREEN }}>Read more</Text>
            <ChevronRightIcon />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── News card (list row — flat style matching market stock rows) ────────────
function NewsCard({ item, onPress, isLast, c }: { item: NewsItem; onPress: () => void; isLast?: boolean; c: ReturnType<typeof useColors> }) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 24,
        paddingVertical: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: c.border,
        gap: 14,
      }}
    >
      {/* Thumbnail */}
      <Image
        source={imgSrc(item.image)}
        style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: c.border, flexShrink: 0, borderWidth: 1, borderColor: c.border }}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={150}
      />

      {/* Content */}
      <View style={{ flex: 1, gap: 4 }}>
        <Text
          style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: c.text, lineHeight: 19 }}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: MUTED }}>{item.time}</Text>
          <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: MUTED }} />
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: MUTED2, flexShrink: 1 }} numberOfLines={1}>
            {item.source}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Detail modal ───────────────────────────────────────────────────────────────
function DetailModal({ item, onClose }: { item: NewsItem; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { width } = useWindowDimensions();

  const translateX = useSharedValue(width);

  useEffect(() => {
    translateX.value = withSpring(0, { damping: 22, stiffness: 220, mass: 0.8 });
  }, []);

  const handleClose = () => {
    translateX.value = withTiming(width, {
      duration: 260,
      easing: Easing.in(Easing.cubic),
    }, () => runOnJS(onClose)());
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const topPad = Platform.OS === "web" ? 44 : insets.top || 16;

  return (
    <ReAnimated.View
      style={[
        StyleSheet.absoluteFillObject,
        { zIndex: 999, backgroundColor: c.background, paddingTop: topPad },
        animatedStyle,
      ]}
    >
      {/* Back header */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        paddingTop: 12,
        paddingHorizontal: 20,
        paddingBottom: 12,
        gap: 14,
      }}>
        <TouchableOpacity
          onPress={handleClose}
          activeOpacity={0.7}
          style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
        >
          <BackIcon color={c.text} />
        </TouchableOpacity>
        <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 16, color: c.text, flex: 1 }} numberOfLines={1}>
          Article
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        {/* Hero image */}
        <View style={{ paddingHorizontal: 20 }}>
          <Image
            source={imgSrc(item.image)}
            style={{ width: "100%", height: 220, borderRadius: 16, backgroundColor: c.card }}
            contentFit="cover"
        cachePolicy="memory-disk"
        transition={150}
          />
        </View>

        {/* Meta */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, marginTop: 18, flexWrap: "wrap" }}>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}>{item.time}</Text>
          <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: MUTED }} />
          <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 12, color: c.text }}>{item.source}</Text>
        </View>

        {/* Title */}
        <Text style={{
          fontFamily: "PlusJakartaSans_700Bold",
          fontSize: 20, color: c.text, lineHeight: 30,
          paddingHorizontal: 20, marginTop: 14,
        }}>
          {item.title}
        </Text>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: c.border, marginHorizontal: 20, marginVertical: 20 }} />

        {/* Body paragraphs */}
        <View style={{ paddingHorizontal: 20, gap: 14 }}>
          {item.body.map((para, i) => (
            <Text key={i} style={{
              fontFamily: "PlusJakartaSans_400Regular",
              fontSize: 14, color: c.text, lineHeight: 23,
            }}>
              {para}
            </Text>
          ))}
        </View>
      </ScrollView>
    </ReAnimated.View>
  );
}

// ─── Category pill ──────────────────────────────────────────────────────────────
// Animated: the fill/border/text colors cross-fade and the pill gives a tiny
// spring "pop" when it becomes active, so switching categories feels alive.
function CategoryPill({
  label,
  active,
  onPress,
  c,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  c: ReturnType<typeof useColors>;
}) {
  const prog = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    prog.value = withTiming(active ? 1 : 0, { duration: 180, easing: Easing.out(Easing.cubic) });
  }, [active]);

  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(prog.value, [0, 1], [c.card, c.primary]),
    borderColor: interpolateColor(prog.value, [0, 1], [c.border, c.primary]),
  }));
  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(prog.value, [0, 1], [c.text, WHITE]),
  }));

  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress}>
      <ReAnimated.View style={[{ paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, borderWidth: 1 }, pillStyle]}>
        <ReAnimated.Text style={[{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, lineHeight: 18 }, textStyle]}>
          {label}
        </ReAnimated.Text>
      </ReAnimated.View>
    </TouchableOpacity>
  );
}

// ─── Screen ─────────────────────────────────────────────────────────────────────
export default function NewsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 16;
  const c = useColors();
  const [activeCategory, setActiveCategory] = useState("All");
  const [selected, setSelected] = useState<NewsItem | null>(null);

  // ── Expanding search ──
  const { width: screenW } = useWindowDimensions();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchProg = useSharedValue(0);
  const searchInputRef = React.useRef<TextInput>(null);

  const openSearch = () => {
    setSearchOpen(true);
    searchProg.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
    setTimeout(() => searchInputRef.current?.focus(), 160);
  };
  const closeSearch = () => {
    setQuery("");
    searchInputRef.current?.blur();
    searchProg.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) }, (done) => {
      if (done) runOnJS(setSearchOpen)(false);
    });
  };

  // The pill grows from its 40px circle into a full-width search bar while
  // the screen title fades and slides away beneath it.
  const searchBarStyle = useAnimatedStyle(() => ({
    width: interpolate(searchProg.value, [0, 1], [40, screenW - 40]),
    borderRadius: 20,
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(searchProg.value, [0, 0.5], [1, 0]),
    transform: [{ translateX: interpolate(searchProg.value, [0, 1], [0, -16]) }],
  }));
  const searchContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(searchProg.value, [0.4, 1], [0, 1]),
  }));

  // DB-driven: news comes from the backend (filtered server-side by category).
  const { data, isLoading, isError, refetch, isFetching } = useNews(activeCategory);

  const filtered: NewsItem[] = useMemo(() => {
    const items = (data ?? []).map((n) => ({ ...n, summary: n.summary ?? "" }));
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.summary.toLowerCase().includes(q) ||
        n.source.toLowerCase().includes(q) ||
        n.category.toLowerCase().includes(q),
    );
  }, [data, query]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {selected && <DetailModal item={selected} onClose={() => setSelected(null)} />}

      {/* Header — matches Market screen pattern exactly */}
      <View style={{
        paddingTop: topPad,
        paddingHorizontal: 20,
        paddingBottom: 10,
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 40 }}>
          <ReAnimated.Text
            style={[{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 24, color: c.text }, titleStyle]}
            numberOfLines={1}
          >
            Market News
          </ReAnimated.Text>
          {/* Search — a 40px circle that springs open into a full-width bar */}
          <ReAnimated.View
            style={[
              {
                position: "absolute",
                right: 0,
                height: 40,
                backgroundColor: c.card,
                overflow: "hidden",
                flexDirection: "row",
                alignItems: "center",
              },
              searchBarStyle,
            ]}
          >
            {searchOpen ? (
              <ReAnimated.View style={[{ flex: 1, flexDirection: "row", alignItems: "center", paddingLeft: 14, paddingRight: 4 }, searchContentStyle]}>
                <SearchIcon color={MUTED} />
                <TextInput
                  ref={searchInputRef}
                  style={{ flex: 1, marginLeft: 10, fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: c.text, padding: 0 }}
                  placeholder="Search headlines, sources, topics…"
                  placeholderTextColor={MUTED}
                  value={query}
                  onChangeText={setQuery}
                  returnKeyType="search"
                />
                <TouchableOpacity onPress={closeSearch} hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }} style={{ width: 36, height: 40, alignItems: "center", justifyContent: "center" }}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path d="M18 6L6 18M6 6l12 12" stroke={c.text} strokeWidth={2} strokeLinecap="round" />
                  </Svg>
                </TouchableOpacity>
              </ReAnimated.View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={openSearch}
                style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
              >
                <SearchIcon color={c.text} />
              </TouchableOpacity>
            )}
          </ReAnimated.View>
        </View>
      </View>

      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 2 }}
        style={{ flexGrow: 0, flexShrink: 0, marginBottom: 16 }}
      >
        {CATEGORIES.map((cat) => (
          <CategoryPill
            key={cat}
            label={cat}
            active={cat === activeCategory}
            onPress={() => setActiveCategory(cat)}
            c={c}
          />
        ))}
      </ScrollView>

      {/* News feed */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {isLoading && (
          <View style={{ paddingTop: 60, alignItems: "center" }}>
            <ActivityIndicator color={c.primary} />
          </View>
        )}

        {!isLoading && isError && (
          <View style={{ paddingTop: 60, alignItems: "center", paddingHorizontal: 40 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 14, color: MUTED, textAlign: "center" }}>
              Couldn't load news.
            </Text>
            <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 12 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: GREEN }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <View style={{ paddingTop: 60, alignItems: "center", paddingHorizontal: 40 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 14, color: MUTED, textAlign: "center" }}>
              No news yet. Check back soon.
            </Text>
          </View>
        )}

        {featured && (
          <FeaturedCard item={featured} onPress={() => setSelected(featured)} c={c} />
        )}

        {rest.length > 0 && (
          <>
            {/* "Latest" section header — matches Market section header pattern */}
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              marginTop: 8,
              marginBottom: 12,
            }}>
              <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text }}>
                Latest
              </Text>
            </View>

            {rest.map((item, idx) => (
              <NewsCard
                key={item.id}
                item={item}
                onPress={() => setSelected(item)}
                isLast={idx === rest.length - 1}
                c={c}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

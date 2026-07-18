import React, { useEffect } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { Tabs } from "expo-router";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";

const TEAL = "#164951";
const MUTED = "#9CA3AF";
const WHITE = "#FFFFFF";

function HomeIcon({ color }: { color: string }) {
  const active = color === TEAL;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.04 6.81994L14.28 2.78994C12.71 1.68994 10.3 1.74994 8.78999 2.91994L3.77999 6.82994C2.77999 7.60994 1.98999 9.20994 1.98999 10.4699V17.3699C1.98999 19.9199 4.05999 21.9999 6.60999 21.9999H17.39C19.94 21.9999 22.01 19.9299 22.01 17.3799V10.5999C22.01 9.24994 21.14 7.58994 20.04 6.81994ZM12.75 17.9999C12.75 18.4099 12.41 18.7499 12 18.7499C11.59 18.7499 11.25 18.4099 11.25 17.9999V14.9999C11.25 14.5899 11.59 14.2499 12 14.2499C12.41 14.2499 12.75 14.5899 12.75 14.9999V17.9999Z"
        fill={active ? color : "none"}
        stroke={active ? "none" : color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MarketIcon({ color }: { color: string }) {
  const active = color === TEAL;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z"
        fill={active ? color : "none"}
        stroke={active ? "none" : color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15.5 18.5C16.6 18.5 17.5 17.6 17.5 16.5V7.5C17.5 6.4 16.6 5.5 15.5 5.5C14.4 5.5 13.5 6.4 13.5 7.5V16.5C13.5 17.6 14.39 18.5 15.5 18.5Z"
        fill={active ? WHITE : "none"}
        stroke={active ? "none" : color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.5 18.5C9.6 18.5 10.5 17.6 10.5 16.5V13C10.5 11.9 9.6 11 8.5 11C7.4 11 6.5 11.9 6.5 13V16.5C6.5 17.6 7.39 18.5 8.5 18.5Z"
        fill={active ? WHITE : "none"}
        stroke={active ? "none" : color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PortfolioIcon({ color }: { color: string }) {
  const active = color === TEAL;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13.7694 2.88037C14.3625 2.43754 15.2983 2.3403 16.91 2.80908C18.9167 3.40138 20.5984 5.08455 21.1903 7.09131V7.09229C21.6682 8.7016 21.5604 9.63045 21.1063 10.2114L21.0995 10.2202C20.8305 10.5801 20.4415 10.7974 19.9872 10.9243C19.5291 11.0522 19.035 11.0796 18.6005 11.0796H15.7303C14.7251 11.0796 14.0505 10.7969 13.618 10.314C13.1764 9.82062 12.91 9.03338 12.91 7.86963V5.38037C12.91 4.45885 13.0376 3.42728 13.7694 2.88037Z"
        fill={active ? color : "none"}
        stroke={color}
        strokeWidth={active ? 0 : 1}
      />
      <Path
        d="M18.91 13.3601C18.65 13.0601 18.27 12.8902 17.88 12.8902H14.3C12.54 12.8902 11.11 11.4601 11.11 9.70015V6.12015C11.11 5.73015 10.94 5.35015 10.64 5.09015C10.35 4.83015 9.95002 4.71015 9.57002 4.76015C7.22002 5.06015 5.06002 6.35015 3.65002 8.29015C2.23002 10.2401 1.71002 12.6201 2.16002 15.0001C2.81002 18.4401 5.56002 21.1902 9.01002 21.8402C9.56002 21.9502 10.11 22.0002 10.66 22.0002C12.47 22.0002 14.22 21.4401 15.71 20.3502C17.65 18.9402 18.94 16.7801 19.24 14.4302C19.29 14.0401 19.17 13.6501 18.91 13.3601Z"
        fill={active ? color : "none"}
        stroke={active ? "none" : color}
        strokeWidth={1}
      />
    </Svg>
  );
}

function NewsIcon({ color }: { color: string }) {
  const active = color === TEAL;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z"
        fill={active ? color : "none"}
        stroke={active ? "none" : color}
        strokeWidth={1.5}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14.5 4.5V6.5C14.5 7.6 15.4 8.5 16.5 8.5H18.5"
        stroke={active ? WHITE : color}
        strokeWidth={1.5}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 13H12"
        stroke={active ? WHITE : color}
        strokeWidth={1.5}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 17H16"
        stroke={active ? WHITE : color}
        strokeWidth={1.5}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ProfileIcon({ color }: { color: string }) {
  const active = color === TEAL;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12.1601 10.87C12.0601 10.86 11.9401 10.86 11.8301 10.87C9.45006 10.79 7.56006 8.84 7.56006 6.44C7.56006 3.99 9.54006 2 12.0001 2C14.4501 2 16.4401 3.99 16.4401 6.44C16.4301 8.84 14.5401 10.79 12.1601 10.87Z"
        fill={active ? color : "none"}
        stroke={active ? "none" : color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7.15997 14.56C4.73997 16.18 4.73997 18.82 7.15997 20.43C9.90997 22.27 14.42 22.27 17.17 20.43C19.59 18.81 19.59 16.17 17.17 14.56C14.43 12.73 9.91997 12.73 7.15997 14.56Z"
        fill={active ? color : "none"}
        stroke={active ? "none" : color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TabLabel({ label, color }: { label: string; color: string }) {
  return <Text style={[styles.tabLabel, { color }]}>{label}</Text>;
}

// ─── Animated custom tab bar ──────────────────────────────────────────────────

const VISIBLE_TABS = 5; // Home, Market, Portfolio, News, Profile

interface TabItemConfig {
  name: string;
  label: string;
  Icon: React.ComponentType<{ color: string }>;
}

const TAB_ITEMS: TabItemConfig[] = [
  { name: "index", label: "Home", Icon: HomeIcon },
  { name: "market", label: "Market", Icon: MarketIcon },
  { name: "portfolio", label: "Portfolio", Icon: PortfolioIcon },
  { name: "news", label: "News", Icon: NewsIcon },
  { name: "profile", label: "Profile", Icon: ProfileIcon },
];

function AnimatedTabItem({
  item,
  isFocused,
  onPress,
  onLongPress,
  tabWidth,
}: {
  item: TabItemConfig;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  tabWidth: number;
}) {
  const scale = useSharedValue(1);
  const labelOpacity = useSharedValue(isFocused ? 1 : 0.55);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1.12 : 1, {
      damping: 14,
      stiffness: 180,
    });
    labelOpacity.value = withTiming(isFocused ? 1 : 0.55, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
  }, [isFocused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.tabItem, { width: tabWidth }]}
      activeOpacity={0.7}
    >
      <Animated.View style={iconStyle}>
        <item.Icon color={isFocused ? TEAL : MUTED} />
      </Animated.View>
      <Animated.View style={labelStyle}>
        <Text style={[styles.tabLabel, { color: isFocused ? TEAL : MUTED }]}>
          {item.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const TAB_CONTENT_HEIGHT = 56;
  const tabBarHeight = TAB_CONTENT_HEIGHT + insets.bottom;
  const tabWidth = width / VISIBLE_TABS;

  // Map route index → visible tab index (skip hidden "news" tab)
  const visibleRoutes = state.routes.filter(
    (r) => descriptors[r.key]?.options?.href !== null
  );
  const focusedVisibleIndex = visibleRoutes.findIndex(
    (r) => r.key === state.routes[state.index].key
  );

  // Sliding indicator — springs to the centre of the focused tab
  const indicatorX = useSharedValue(focusedVisibleIndex * tabWidth);

  useEffect(() => {
    indicatorX.value = withSpring(focusedVisibleIndex * tabWidth, {
      damping: 18,
      stiffness: 200,
      mass: 0.8,
    });
  }, [focusedVisibleIndex, tabWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View
      style={[
        styles.tabBar,
        {
          height: tabBarHeight,
          paddingBottom: insets.bottom > 0 ? insets.bottom : Platform.OS === "ios" ? 0 : 8,
        },
      ]}
    >
      {/* Sliding teal indicator dot */}
      <Animated.View
        style={[styles.indicatorTrack, indicatorStyle, { width: tabWidth }]}
        pointerEvents="none"
      >
        <View style={styles.indicatorDot} />
      </Animated.View>

      {/* Tab items */}
      {TAB_ITEMS.map((item, visibleIndex) => {
        const route = state.routes.find((r) => {
          const routeName = r.name;
          // "(tabs)" uses "index" as the home route name
          return routeName === item.name;
        });
        if (!route) return null;

        const isFocused = state.index === state.routes.indexOf(route);

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: "tabLongPress", target: route.key });
        };

        return (
          <AnimatedTabItem
            key={item.name}
            item={item}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
            tabWidth={tabWidth}
          />
        );
      })}
    </View>
  );
}

// ─── Tab layout ───────────────────────────────────────────────────────────────

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="market" options={{ title: "Market" }} />
      <Tabs.Screen name="portfolio" options={{ title: "Portfolio" }} />
      <Tabs.Screen name="news" options={{ title: "News" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: WHITE,
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    paddingTop: 8,
    position: "relative",
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 4,
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: "Poppins_500Medium",
    marginTop: 2,
  },
  indicatorTrack: {
    position: "absolute",
    top: 0,
    left: 0,
    alignItems: "center",
  },
  indicatorDot: {
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: TEAL,
  },
});



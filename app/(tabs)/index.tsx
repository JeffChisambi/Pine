import React, { useState, useEffect, useCallback, useRef } from "react";
import { guardedPush } from "@/utils/navigation";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Image,
  ImageSourcePropType,
  RefreshControl,
} from "react-native";
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useAuth } from "../../services/auth-context";
import { NotificationsPanel } from "@/components/ProfilePanels";
import {
  useWalletBalance,
  useWalletQueryClient,
  reconcileDepositCredit,
  setOptimisticBalance,
  loadPendingDeposit,
  clearPendingDeposit,
  savePendingDeposit,
  invalidateWalletBalance,
  WALLET_BALANCE_QUERY_KEY,
} from "../../services/wallet-queries";
import { useBalanceVisibility } from "../../contexts/balance-visibility";
import Svg, {
  Path,
  Circle,
  Rect,
  G,
  Defs,
  ClipPath,
  Text as SvgText,
} from "react-native-svg";
import { EyeOpenIcon, EyeClosedIcon, CompareIcon } from "@/components/icons/AppIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/contexts/theme-context";
import { useUnreadCount } from "@/hooks/useNotifications";
import { PRACTICE_MODE } from "@/constants/practice";

// ─── Static brand tokens ────────────────────────────────────────────────────────
const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";
const MUTED2 = "#6B7280";
/** Set once the user chooses never to see the virtual-money reminder again. */
const VIRTUAL_NOTICE_KEY = "@pine_virtual_notice_hidden";
const RED = "#EF4770";

type Colors = ReturnType<typeof useColors>;

// ─── Notification bell ─────────────────────────────────────────────────────────
// Shows the REAL unread count (was a hardcoded, always-on red dot).
function NotificationIcon() {
  const c = useColors();
  const { data: unread = 0 } = useUnreadCount();
  return (
    <View style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path d="M12.02 2.91C8.71 2.91 6.02 5.6 6.02 8.91V11.8C6.02 12.41 5.76 13.34 5.45 13.86L4.3 15.77C3.59 16.95 4.08 18.26 5.38 18.7C9.69 20.14 14.34 20.14 18.65 18.7C19.86 18.3 20.39 16.87 19.73 15.77L18.58 13.86C18.28 13.34 18.02 12.41 18.02 11.8V8.91C18.02 5.61 15.32 2.91 12.02 2.91Z" stroke={c.text} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" />
        <Path d="M13.87 3.2C13.56 3.11 13.24 3.04 12.91 3C11.95 2.88 11.03 2.95 10.17 3.2C10.46 2.46 11.18 1.94 12.02 1.94C12.86 1.94 13.58 2.46 13.87 3.2Z" stroke={c.text} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M15.02 19.06C15.02 20.71 13.67 22.06 12.02 22.06C11.2 22.06 10.44 21.72 9.9 21.18C9.36 20.64 9.02 19.88 9.02 19.06" stroke={c.text} strokeWidth={1.5} strokeMiterlimit={10} />
      </Svg>
      {unread > 0 && (
        // Ring drawn as an outer wrapper (not borderWidth on the pill itself)
        // so the border never eats into the pill's content box and skew the
        // digit centering. The pill grows horizontally for 2-digit and "99+"
        // counts while staying a perfect circle for single digits.
        <View
          style={{
            position: "absolute", top: 2, right: 0,
            borderRadius: 11, padding: 1.5, backgroundColor: c.background,
          }}
        >
          <View
            style={{
              minWidth: 18, height: 18, borderRadius: 9,
              paddingHorizontal: unread > 9 ? 4 : 0,
              backgroundColor: RED,
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                fontSize: 10,
                lineHeight: 13,
                color: "#FFFFFF",
                textAlign: "center",
                textAlignVertical: "center",
                includeFontPadding: false,
              }}
            >
              {unread > 99 ? "99+" : unread}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? <EyeOpenIcon color={WHITE} size={22} /> : <EyeClosedIcon color={WHITE} size={22} />;
}

function ArrowCircleUp({ color = GREEN, size = 13 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 13 13">
      <Path d="M6.5 12.833C10.09 12.833 13 9.924 13 6.333C13 2.743 10.09 -0.167 6.5 -0.167C2.91 -0.167 0 2.743 0 6.333C0 9.924 2.91 12.833 6.5 12.833ZM4.132 6.241L6.191 4.182C6.36 4.013 6.64 4.013 6.809 4.182L8.868 6.241C9.037 6.41 9.037 6.69 8.868 6.859C8.699 7.028 8.419 7.028 8.25 6.859L6.5 5.109L4.75 6.859C4.581 7.028 4.301 7.028 4.132 6.859C3.963 6.69 3.963 6.41 4.132 6.241Z" fill={color} />
    </Svg>
  );
}

function ArrowCircleDown({ color = RED, size = 13 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 13 13" style={{ transform: [{ rotate: "180deg" }] }}>
      <Path d="M6.5 12.833C10.09 12.833 13 9.924 13 6.333C13 2.743 10.09 -0.167 6.5 -0.167C2.91 -0.167 0 2.743 0 6.333C0 9.924 2.91 12.833 6.5 12.833ZM4.132 6.241L6.191 4.182C6.36 4.013 6.64 4.013 6.809 4.182L8.868 6.241C9.037 6.41 9.037 6.69 8.868 6.859C8.699 7.028 8.419 7.028 8.25 6.859L6.5 5.109L4.75 6.859C4.581 7.028 4.301 7.028 4.132 6.859C3.963 6.69 3.963 6.41 4.132 6.241Z" fill={color} />
    </Svg>
  );
}

function AddCircleIcon({ color = WHITE }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Path d="M10 18.333C14.602 18.333 18.333 14.602 18.333 10C18.333 5.398 14.602 1.667 10 1.667C5.398 1.667 1.667 5.398 1.667 10C1.667 14.602 5.398 18.333 10 18.333Z" stroke={color} strokeWidth={1.5} fill="none" />
      <Path d="M6.667 10H13.333" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M10 13.333V6.667" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function EquityTradingIcon() {
  // The glyph is a solid green mark; on the dark card that green goes muddy,
  // so it inverts to white the way the market screen's icons do.
  const { isDark } = useTheme();
  const G = isDark ? WHITE : "#1EA84E";
  return (
    <Svg width={34} height={34} viewBox="0 0 747 732" fill="none">
      <Path d="M589.28 366.321C604.202 364.939 616.771 371.661 626.783 382.168C639.152 374.6 651.444 370.165 666.161 372.357C677.37 374.028 687.448 380.104 694.152 389.237C700.608 398.151 702.446 408.604 700.878 419.374C698.314 437.016 684.895 445.692 672.063 455.952L643.412 479.083C632.74 487.738 622.136 496.48 611.599 505.299C603.469 512.083 593.869 520.275 585.304 526.395C573.527 534.816 559.987 542.691 547.633 550.324L496.565 582.132C490.186 586.027 483.868 590.017 477.609 594.106C473.484 596.783 469.33 599.478 465.212 602.104C442.831 616.379 415.424 619.986 389.837 613.378C383.844 611.831 377.33 610.442 371.198 609.092L308.138 595.123C297.175 592.665 284.138 589.207 273.151 587.435C247.661 583.321 241.216 588.886 222.506 602.447L223.228 603.373C230.733 613.119 234.876 625.089 227.286 636.078C222.447 643.084 213.187 648.778 206.241 653.84C196.059 661.124 185.967 668.531 175.969 676.066C172.607 678.576 170.309 680.279 165.786 679.717C160.441 679.05 158.547 671.303 161.188 667.466C163.607 663.954 169.9 659.949 173.543 657.305L193.941 642.461C198.968 638.864 212.635 630.242 214.903 624.217C216.073 621.11 210.788 614.326 208.651 611.335L131.653 503.147C124.944 493.774 118.312 484.346 111.757 474.863C107.971 469.425 104.144 463.794 100.086 458.549C98.694 456.751 97.3196 456.401 95.23 455.675C87.9015 458.173 78.9765 465.862 72.456 470.676C66.0711 475.319 59.7187 480.009 53.3995 484.743C49.8122 487.468 46.0258 490.601 42.1919 492.931C40.5757 493.858 38.609 494.332 36.7831 494.273C31.6952 494.109 29.7731 489.28 30.2541 484.802C30.5483 482.059 31.8874 480.21 34.0654 478.55C44.5573 470.57 55.2122 462.812 65.8461 455.022C71.9019 450.667 79.2147 444.795 85.7258 441.454C88.7703 439.893 94.6161 439.226 98.0593 439.744C109.096 441.403 112.259 447.556 118.436 455.554C118.543 455.441 119.07 454.883 119.16 454.807C128.279 446.746 137.593 438.821 146.653 430.699C157.778 420.723 168.814 410.088 181.073 401.546C205.601 384.452 236.426 376.763 266.101 377.164C282.961 377.394 302.016 380.02 317.851 385.947C330.878 390.823 342.576 398.654 354.897 404.829C377.027 415.916 408.837 416.431 433.461 416.919C435.08 415.785 436.743 414.72 438.421 413.677C448.605 407.349 458.562 400.685 468.611 394.146L486.458 382.628C490.54 380.009 495.208 376.873 499.534 374.79C504.436 372.47 509.671 370.939 515.051 370.253C530.771 368.225 541.199 373.674 553.126 382.912C567.144 374.819 572.181 368.2 589.28 366.321ZM189.458 415.818C173.654 427.551 159.834 441.527 144.866 454.26C139.103 459.165 133.871 464.26 127.857 468.878C134.805 478.244 141.459 488.08 148.235 497.6L191.738 558.669C198.657 568.378 205.713 579.035 212.957 588.438C217.563 585.553 221.283 582.245 226.292 579.283C247.638 566.657 262.634 568.331 285.253 573.532L347.96 587.482L376.655 593.865C391.653 597.18 407.611 601.272 422.861 599.631C442.123 597.556 449.141 592.596 464.719 582.847L520.507 547.622C538.971 536.198 557.792 525.187 575.697 512.911C583.561 507.517 591.104 500.911 598.49 494.81C608.922 486.169 619.393 477.584 629.913 469.053L660.387 444.343C666.508 439.379 673.354 434.12 678.818 428.784C687.313 420.494 687.01 402.473 677.797 394.693C671.687 389.536 665.957 387.814 658.166 387.851C654.114 388.194 648.354 388.96 644.758 390.944C633.316 397.268 622.118 405.686 611.114 412.896L526.555 469.013C523.028 483.084 518.304 493.767 505.093 501.688C499.326 505.12 492.874 507.239 486.196 507.9C477.307 508.855 463.355 508.385 454.003 508.352L402.505 508.33L360.085 508.315C355.982 508.319 351.488 508.323 347.502 508.352C339.754 508.407 333.126 508.808 333.921 498.709C334.346 493.303 338.663 491.987 343.51 491.677C354.447 491.567 365.472 491.735 376.458 491.702L454.014 491.695C462.502 491.695 484.069 492.494 491.258 490.021C499.596 487.099 506.063 480.41 508.7 471.978C510.94 464.662 510.148 456.751 506.508 450.022C497.805 433.762 482.796 434.776 466.842 434.185C461.097 433.974 455.327 433.952 449.586 433.799C436.911 433.438 424.24 432.891 411.579 432.161C384.592 430.731 362.794 429.269 339.054 414.972C333.276 411.496 326.936 408.14 320.879 405.146C283.151 388.15 235.125 389.295 198.928 409.807C197.051 410.869 191.102 414.363 189.458 415.818ZM496.514 421.136C501.373 418.429 509.769 412.678 514.602 409.318C522.688 403.698 531.665 398.07 539.613 392.476C532.037 387.672 528.13 386.538 519.103 386.753C506.45 387.544 500.895 392.61 490.616 399.329C481.151 405.518 471.46 411.368 462.487 418.302C470.07 418.32 477.467 418.199 485.025 418.987C489.165 419.21 492.593 419.64 496.514 421.136ZM531.957 445.561L613.744 391.607C606.062 384.9 600.299 382.694 589.893 383.088C577.488 384.583 567.322 393.577 557.153 400.262C542.144 410.135 527.561 421.154 512.355 430.706C518.373 437.723 521.62 441.659 524.629 450.729L531.957 445.561Z" fill={G}/>
      <Path d="M417.445 28.8906C506.8 22.0062 584.805 88.8809 591.644 178.232C598.483 267.582 531.563 345.548 442.204 352.341C352.909 359.13 275.006 292.274 268.172 202.988C261.338 113.701 328.158 35.77 417.445 28.8906ZM428.767 336.328C509.211 336.995 574.997 272.387 575.781 191.947C576.565 111.508 512.049 45.6305 431.608 44.7297C350.998 43.827 284.951 108.5 284.166 189.106C283.38 269.712 348.154 335.66 428.767 336.328Z" fill={G}/>
      <Path d="M384.738 221.902C385.927 218.157 388.586 212.043 390.107 208.132C394.994 195.602 400.083 183.15 405.36 170.779C408.942 162.253 412.586 153.927 415.665 145.094C417.517 139.776 425.232 141.761 429.477 141.354C431.192 141.19 434.467 141.384 435.711 142.567C436.528 146.469 436.273 155.731 436.269 160.228L436.262 189.309L436.273 222.294C436.273 227.846 436.535 236.577 435.871 241.721C434.197 243.77 424.677 242.783 422.121 242.388C421.654 236.588 421.898 227.245 421.891 221.226C421.785 205.381 422.018 189.535 422.584 173.7C422.762 169.85 422.828 165.995 422.777 162.141C419.633 169.239 416.624 177.179 413.684 184.427L399.171 219.865C396.468 226.464 393.893 233.076 391.07 239.627C389.056 244.304 384.296 243.073 379.949 242.617C378.129 239.906 374.029 229.246 372.46 225.474L354.748 182.261C352.539 176.914 348.764 166.783 346.122 162.026C346.566 165.271 346.612 170.262 346.735 173.606C347.02 181.173 347.227 188.743 347.356 196.314C347.523 206.085 347.57 215.858 347.497 225.63C347.497 228.45 349.006 242.555 344.94 242.866C342.422 243.059 335.537 243.273 333.496 241.752C333.078 240.283 333.002 237.755 333 236.214C332.979 215.919 332.998 195.613 333.002 175.319L333.012 154.445C333.014 151.05 332.973 147.517 333.086 144.118C333.12 143.089 333.942 142.284 334.643 141.571C339.731 141.325 346.472 141.296 351.535 141.557C353.672 144.516 359.436 159.654 361.286 164.145C369.309 183.314 377.125 202.567 384.738 221.902Z" fill={G}/>
      <Path d="M459.814 141.561C463.943 141.382 468.272 141.227 472.376 141.698C473.361 146.401 473.061 156.166 473.061 161.38V191.519L501.8 158.169C505.086 154.384 513.559 144.027 517.232 141.48C520.526 141.445 529.754 141.033 532.22 142.088L532.457 142.721C531.899 144.966 516.215 162.139 513.286 165.505C507.756 171.86 500.979 179.8 495.234 185.953C503.394 197.377 512.432 209.075 520.869 220.38C525.03 225.956 532.012 234.781 535.78 240.862C536.075 241.338 535.863 241.473 535.608 242.026C532.967 243.602 525.355 242.954 522.087 242.739C520.723 242.649 519.581 241.594 518.72 240.572C514.701 235.8 510.845 230.403 507.118 225.382L485.299 195.895C482.133 199.585 475.6 206.167 473.113 209.623C472.923 220.084 473.547 231.394 472.551 241.786C472.445 242.89 466.368 242.858 465.471 242.857C462.63 242.852 458.089 243.363 458.493 239.148C458.493 232.794 458.483 226.296 458.483 220.022L458.479 181.729V156.838C458.472 152.571 458.442 148.18 458.475 143.904C458.483 142.709 459.041 142.401 459.814 141.561Z" fill={G}/>
    </Svg>
  );
}

function ImportIcon({ color = WHITE }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M7.76666 9.7334L9.9 11.8667L12.0333 9.7334" stroke={color} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9.90002 3.33325V11.8083" stroke={color} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16.6666 10.1499C16.6666 13.8332 14.1666 16.8166 9.99998 16.8166C5.83331 16.8166 3.33331 13.8332 3.33331 10.1499" stroke={color} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TrashIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke={WHITE} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const REVEAL_WIDTH = 88;

interface WatchCardProps {
  logoImg: ImageSourcePropType;
  symbol: string;
  name: string;
  type: string;
  price: string;
  change: string;
  positive: boolean;
  onDelete?: () => void;
  c: Colors;
}

function SwipeableWatchCard({ logoImg, symbol, name, type, price, change, positive, onDelete, c }: WatchCardProps) {
  const translateX = useSharedValue(0);
  const isOpen = useSharedValue(false);

  const dismiss = useCallback(() => {
    translateX.value = withTiming(0, { duration: 200 });
    isOpen.value = false;
  }, []);

  const open = useCallback(() => {
    translateX.value = withTiming(-REVEAL_WIDTH, { duration: 200 });
    isOpen.value = true;
  }, []);

  const collapse = useCallback(() => {
    translateX.value = withTiming(-500, { duration: 220 }, () => {
      runOnJS(onDelete ?? (() => {}))();
    });
  }, [onDelete]);

  const pan = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .failOffsetY([-10, 10])
    .onUpdate((e) => {
      const base = isOpen.value ? -REVEAL_WIDTH : 0;
      translateX.value = Math.min(0, Math.max(-REVEAL_WIDTH, base + e.translationX));
    })
    .onEnd((e) => {
      const base = isOpen.value ? -REVEAL_WIDTH : 0;
      const projected = base + e.translationX + e.velocityX * 0.12;
      if (projected < -REVEAL_WIDTH / 2) {
        runOnJS(open)();
      } else {
        runOnJS(dismiss)();
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => {
    const progress = interpolate(translateX.value, [-REVEAL_WIDTH, 0], [1, 0], Extrapolation.CLAMP);
    return {
      opacity: progress,
      transform: [{ scale: interpolate(progress, [0, 1], [0.7, 1], Extrapolation.CLAMP) }],
    };
  });

  return (
    <View style={{ marginBottom: 12, borderRadius: 16, overflow: "hidden" }}>
      {/* Red layer fills full width — no gap as the card slides away */}
      <View style={{
        position: "absolute", left: 0, right: 0, top: 0, bottom: 0,
        backgroundColor: "#EF4770", alignItems: "flex-end", justifyContent: "center",
        paddingRight: REVEAL_WIDTH / 2 - 16,
      }}>
        <ReAnimated.View style={[{ alignItems: "center" }, buttonStyle]}>
          <TouchableOpacity onPress={collapse} activeOpacity={0.75}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{ alignItems: "center" }}>
            <TrashIcon />
            <Text style={{ color: WHITE, fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 11, marginTop: 5, letterSpacing: 0.2 }}>Remove</Text>
          </TouchableOpacity>
        </ReAnimated.View>
      </View>

      <GestureDetector gesture={pan}>
        {/* Animated card — background fills corners so they never bleed */}
        <ReAnimated.View style={[cardStyle, {
          backgroundColor: c.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: c.border,
        }]}>
          <TouchableOpacity activeOpacity={1} onPress={() => {
            if (isOpen.value) { dismiss(); } else { guardedPush(() => router.push(`/stock/${symbol}`)); }
          }}>
            <View style={{
              height: 77,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1, marginRight: 12 }}>
                <View style={{
                  width: 44, height: 44, borderRadius: 22, backgroundColor: c.background,
                  borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center", overflow: "hidden",
                }}>
                  {logoImg ? (
                    <Image source={logoImg} style={{ width: 40, height: 40, borderRadius: 20 }} resizeMode="contain" />
                  ) : (
                    <View style={{ width: 40, height: 40, backgroundColor: c.primary, alignItems: "center", justifyContent: "center", borderRadius: 20 }}>
                      <Text style={{ color: WHITE, fontFamily: "PlusJakartaSans_700Bold", fontSize: 11 }}>{symbol.slice(0, 3)}</Text>
                    </View>
                  )}
                </View>
                <View style={{ gap: 3, flex: 1 }}>
                  <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: c.text }}>{symbol}</Text>
                  <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }} numberOfLines={1}>
                    {name}<Text style={{ color: MUTED }}> · </Text>{type}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: c.text }}>{price}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                  <View style={{ width: 12, height: 12, alignItems: "center", justifyContent: "center" }}>
                    {positive ? <ArrowCircleUp color={GREEN} size={12} /> : <ArrowCircleDown size={12} />}
                  </View>
                  <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 12, lineHeight: 12, color: positive ? GREEN : RED }}>{change}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </ReAnimated.View>
      </GestureDetector>
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 16;
  const { visible: balanceVisible, requestToggle: requestBalanceToggle } = useBalanceVisibility();
  const [showNotifications, setShowNotifications] = useState(false);
  const c = useColors();

  const searchParams = useLocalSearchParams<{
    depositSuccess?: string;
    depositAmount?: string;
    depositTxRef?: string;
  }>();
  const [depositToast, setDepositToast] = useState<{ visible: boolean; amount: string }>({ visible: false, amount: "" });

  /**
   * A one-line reminder that the money here is not real.
   *
   * It shows itself for a few seconds on arriving at the home screen, then
   * leaves on its own. The cross dismisses it for now; "Hide" means never
   * again, which is remembered on the device so a returning user is not told
   * the same thing every morning.
   */
  const [virtualNotice, setVirtualNotice] = useState(false);
  const virtualNoticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissVirtualNotice = useCallback(() => {
    if (virtualNoticeTimer.current) clearTimeout(virtualNoticeTimer.current);
    setVirtualNotice(false);
  }, []);

  const hideVirtualNoticeForGood = useCallback(() => {
    dismissVirtualNotice();
    AsyncStorage.setItem(VIRTUAL_NOTICE_KEY, "1").catch(() => {});
  }, [dismissVirtualNotice]);

  useFocusEffect(
    useCallback(() => {
      if (!PRACTICE_MODE) return;
      let cancelled = false;
      AsyncStorage.getItem(VIRTUAL_NOTICE_KEY)
        .then((hidden) => {
          if (cancelled || hidden) return;
          setVirtualNotice(true);
          virtualNoticeTimer.current = setTimeout(() => setVirtualNotice(false), 7000);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
        if (virtualNoticeTimer.current) clearTimeout(virtualNoticeTimer.current);
      };
    }, []),
  );
  const toastShownRef = useRef(false);

  const { user } = useAuth();
  const userFirstName = user?.firstName ?? null;
  const currentDate = new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  const qc = useWalletQueryClient();
  const { data: walletBalance, refetch: refetchBalance } = useWalletBalance();

  // Pull-to-refresh — refetch the wallet balance and let dependent home queries
  // revalidate, matching the swipe-down-to-refresh gesture users expect.
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchBalance();
    } finally {
      setRefreshing(false);
    }
  }, [refetchBalance]);
  // Always render a number. A brand-new account (or the brief pre-load window)
  // shows "K 0" rather than a dash.
  const totalBalance = `K ${Number(walletBalance?.availableBalance ?? walletBalance?.balance ?? 0).toLocaleString()}`;

  const reconcileRef = useRef(false);
  const reconcilingRef = useRef(false);

  useEffect(() => {
    if (reconcileRef.current) return;
    const fromNav = searchParams.depositSuccess === "true" && !!searchParams.depositAmount;
    reconcileRef.current = true;
    (async () => {
      let amount: number | null = null;
      let txRef: string | undefined;
      let prevAvailable: number | null = null;
      const pending = await loadPendingDeposit();
      if (fromNav) {
        amount = Number(String(searchParams.depositAmount).replace(/,/g, "")) || 0;
        txRef = searchParams.depositTxRef ?? pending?.txRef;
        if (pending && (!txRef || pending.txRef === txRef)) { prevAvailable = pending.prevAvailable; }
      } else {
        if (!pending) return;
        amount = pending.amount; txRef = pending.txRef; prevAvailable = pending.prevAvailable;
      }
      if (!amount || amount <= 0) { reconcileRef.current = false; return; }
      if (fromNav && !toastShownRef.current) {
        toastShownRef.current = true;
        setDepositToast({ visible: true, amount: String(searchParams.depositAmount) });
        setTimeout(() => setDepositToast({ visible: false, amount: "" }), 4000);
      }
      if (prevAvailable === null) {
        const cached = walletBalance;
        prevAvailable = Number(cached?.availableBalance ?? cached?.balance ?? 0);
        if (txRef) { await savePendingDeposit({ txRef, amount, prevAvailable, createdAt: Date.now() }); }
      }
      await qc.cancelQueries({ queryKey: WALLET_BALANCE_QUERY_KEY });
      reconcilingRef.current = true;
      const revertOptimistic = setOptimisticBalance(qc, amount);
      const outcome = await reconcileDepositCredit(qc, { expectedIncrement: amount, prevAvailable });
      reconcilingRef.current = false;
      if (outcome.status === "reflected") {
        await clearPendingDeposit();
      } else {
        // Server never confirmed the credit — drop the optimistic overlay and
        // refetch the authoritative value. The persisted pending-deposit
        // record survives, so reconciliation resumes on the next mount.
        revertOptimistic();
        await invalidateWalletBalance(qc).catch(() => {});
      }
    })().catch(() => {});
  }, [searchParams.depositSuccess, searchParams.depositAmount, searchParams.depositTxRef, walletBalance, qc]);

  useFocusEffect(useCallback(() => {
    if (!reconcilingRef.current) { refetchBalance(); }
  }, [refetchBalance]));



  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {showNotifications && <NotificationsPanel onClose={() => setShowNotifications(false)} />}
      {/* Themed header */}
      <View style={{ backgroundColor: c.background, paddingHorizontal: 20, paddingBottom: 12, paddingTop: topPad }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <View>
            <Text style={{ fontSize: 20, color: c.text, lineHeight: 28 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_400Regular" }}>Hi, </Text>
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}>{userFirstName ?? "Welcome"}</Text>
            </Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED2, lineHeight: 20, marginTop: 2 }}>{currentDate}</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={() => setShowNotifications(true)}>
            <NotificationIcon />
          </TouchableOpacity>
        </View>

        {/* Balance card */}
        <View style={{ backgroundColor: GREEN, borderRadius: 16, padding: 20, gap: 28 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 12, color: WHITE, opacity: 0.8, letterSpacing: 1, marginBottom: 4 }}>{PRACTICE_MODE ? "VIRTUAL BALANCE" : "AVAILABLE BALANCE"}</Text>
              <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 34, color: WHITE, letterSpacing: -0.5 }} adjustsFontSizeToFit numberOfLines={1}>
                {balanceVisible ? (totalBalance ?? "—") : "K  ••••••"}
              </Text>
            </View>
            <TouchableOpacity onPress={requestBalanceToggle} activeOpacity={0.7} style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" }}>
              <EyeIcon visible={balanceVisible} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity style={{ flex: 1, backgroundColor: WHITE, borderRadius: 12, height: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }} activeOpacity={0.85} onPress={() => guardedPush(() => router.push("/deposit"))}>
              <AddCircleIcon color={GREEN} />
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: GREEN }}>Top up</Text>
            </TouchableOpacity>
            {/* Practice money cannot be withdrawn, so the second action is
                the practice-only comparison tool instead. */}
            {PRACTICE_MODE ? (
              <TouchableOpacity style={{ flex: 1, borderRadius: 12, height: 48, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.25)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }} activeOpacity={0.85} onPress={() => guardedPush(() => router.push("/compare" as any))}>
                <CompareIcon color={WHITE} size={20} />
                <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: WHITE }}>Compare</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={{ flex: 1, borderRadius: 12, height: 48, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.25)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }} activeOpacity={0.85} onPress={() => guardedPush(() => router.push("/withdraw" as any))}>
                <ImportIcon color={WHITE} />
                <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: WHITE }}>Withdraw</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Deposit toast */}
      {depositToast.visible && (
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: GREEN, marginHorizontal: 20, marginTop: 12, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
            <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
              <Circle cx={10} cy={10} r={10} fill={WHITE} />
              <Path d="M6 10l3 3 5-5" stroke={GREEN} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 14, color: WHITE, lineHeight: 20 }}>Top up successful!</Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 17 }}>MK {depositToast.amount} has been added to your wallet.</Text>
          </View>
          <TouchableOpacity onPress={() => setDepositToast({ visible: false, amount: "" })} hitSlop={12}>
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
              <Path d="M4 4l8 8M12 4l-8 8" stroke={WHITE} strokeWidth={1.5} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        </View>
      )}

      {virtualNotice && (
        <View
          accessibilityRole="alert"
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            backgroundColor: c.card,
            borderWidth: 1,
            borderColor: c.border,
            marginHorizontal: 20,
            marginTop: 12,
            borderRadius: 14,
            paddingVertical: 12,
            paddingHorizontal: 14,
            gap: 10,
          }}
        >
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: `${GREEN}22`, alignItems: "center", justifyContent: "center", marginTop: 1 }}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d="M12 8v5" stroke={GREEN} strokeWidth={2} strokeLinecap="round" />
              <Path d="M12 16.5v.01" stroke={GREEN} strokeWidth={2} strokeLinecap="round" />
              <Circle cx={12} cy={12} r={9} stroke={GREEN} strokeWidth={1.6} />
            </Svg>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: c.text, lineHeight: 18 }}>
              This is virtual money
            </Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: c.mutedForeground, lineHeight: 17, marginTop: 2 }}>
              It is added instantly, cannot be withdrawn, and is only for learning how trading works.
            </Text>
            <TouchableOpacity onPress={hideVirtualNoticeForGood} hitSlop={10} style={{ alignSelf: "flex-start", marginTop: 8 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 12, color: c.primary }}>
                Hide this
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={dismissVirtualNotice} hitSlop={12} accessibilityRole="button" accessibilityLabel="Dismiss">
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
              <Path d="M4 4l8 8M12 4l-8 8" stroke={c.mutedForeground} strokeWidth={1.5} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        </View>
      )}

      {/* White/dark sheet */}
      <View style={{ flex: 1, backgroundColor: c.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: 12, overflow: "hidden" }}>
        {/* Everything fits on a phone now that bonds and the course bullets
            are gone, so this does not scroll in practice: flexGrow lets the
            content fill the sheet instead of ending early, and the Android
            overscroll glow is off so there is no hint of movement. It stays a
            ScrollView rather than a plain View for two reasons — pull to
            refresh, and a short screen or large font setting can still make
            the content taller than the sheet. */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} colors={[c.primary]} />}
        >
          <View style={{ backgroundColor: c.background, paddingHorizontal: 20, paddingTop: 24 }}>
            {/* Invest section */}
            <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text, marginBottom: 4 }}>Invest</Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED2, marginBottom: 16 }}>Choose what to invest</Text>

            {/* Stocks card */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => guardedPush(() => router.push("/stock-search" as any))}
              style={{
                borderRadius: 16,
                backgroundColor: c.card,
                borderWidth: 1,
                borderColor: c.border,
                marginBottom: 0,
                overflow: "hidden",
              }}
            >
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingVertical: 16,
              }}>
                <View style={{ flex: 1, gap: 4, paddingRight: 12, marginTop: -6 }}>
                  <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: c.text, lineHeight: 21 }}>Stocks</Text>
                  <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: c.mutedForeground, lineHeight: 15 }}>
                    Buy &amp; sell shares of{"\n"}listed companies
                  </Text>
                </View>
                <View style={{
                  width: 56, height: 54, borderRadius: 28,
                  backgroundColor: c.background,
                  alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <EquityTradingIcon />
                </View>
              </View>
            </TouchableOpacity>

          </View>

          {/* Learn Trading card */}
          <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => guardedPush(() => router.push("/education" as any))}
              style={{
                borderRadius: 20,
                overflow: "hidden",
                backgroundColor: "#0D3540",
              }}
            >
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 18,
                paddingLeft: 20,
                paddingRight: 16,
                gap: 16,
              }}>
                {/* Left: text content */}
                <View style={{ flex: 1 }}>
                  {/* Heading */}
                  <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 19, color: WHITE, lineHeight: 25, marginBottom: 3 }}>
                    Master the Markets
                  </Text>
                  <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 16, marginBottom: 18 }}>
                    Structured courses for every level
                  </Text>

                  {/* CTA */}
                  <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    alignSelf: "flex-start",
                    gap: 5,
                    backgroundColor: GREEN,
                    borderRadius: 9,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                  }}>
                    <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 12, color: WHITE }}>Start Learning</Text>
                    <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
                      <Path d="M5 12h14M12 5l7 7-7 7" stroke={WHITE} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </View>
                </View>

                {/* Right: the graduation cap, sitting on the card itself.
                    The art is transparent and already trimmed, so it needs no
                    frame and must not be cropped. */}
                <Image
                  source={require("../../assets/images/education-cap.png")}
                  style={{ width: 155, height: 155 }}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </View>
    </View>
  );
}

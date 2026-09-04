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
import { EyeOpenIcon, EyeClosedIcon } from "@/components/icons/AppIcons";
import { SvgXml } from "react-native-svg";
import { EDUCATION_ICON_SVG } from "@/constants/EducationIconSvg";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useUnreadCount } from "@/hooks/useNotifications";
import { useTour } from "@/components/tour/TourProvider";
import { useTourTarget } from "@/components/tour/useTourTarget";

// ─── Static brand tokens ────────────────────────────────────────────────────────
const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";
const MUTED2 = "#6B7280";
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
  const G = "#1EA84E";
  return (
    <Svg width={34} height={34} viewBox="0 0 747 732" fill="none">
      <Path d="M589.28 366.321C604.202 364.939 616.771 371.661 626.783 382.168C639.152 374.6 651.444 370.165 666.161 372.357C677.37 374.028 687.448 380.104 694.152 389.237C700.608 398.151 702.446 408.604 700.878 419.374C698.314 437.016 684.895 445.692 672.063 455.952L643.412 479.083C632.74 487.738 622.136 496.48 611.599 505.299C603.469 512.083 593.869 520.275 585.304 526.395C573.527 534.816 559.987 542.691 547.633 550.324L496.565 582.132C490.186 586.027 483.868 590.017 477.609 594.106C473.484 596.783 469.33 599.478 465.212 602.104C442.831 616.379 415.424 619.986 389.837 613.378C383.844 611.831 377.33 610.442 371.198 609.092L308.138 595.123C297.175 592.665 284.138 589.207 273.151 587.435C247.661 583.321 241.216 588.886 222.506 602.447L223.228 603.373C230.733 613.119 234.876 625.089 227.286 636.078C222.447 643.084 213.187 648.778 206.241 653.84C196.059 661.124 185.967 668.531 175.969 676.066C172.607 678.576 170.309 680.279 165.786 679.717C160.441 679.05 158.547 671.303 161.188 667.466C163.607 663.954 169.9 659.949 173.543 657.305L193.941 642.461C198.968 638.864 212.635 630.242 214.903 624.217C216.073 621.11 210.788 614.326 208.651 611.335L131.653 503.147C124.944 493.774 118.312 484.346 111.757 474.863C107.971 469.425 104.144 463.794 100.086 458.549C98.694 456.751 97.3196 456.401 95.23 455.675C87.9015 458.173 78.9765 465.862 72.456 470.676C66.0711 475.319 59.7187 480.009 53.3995 484.743C49.8122 487.468 46.0258 490.601 42.1919 492.931C40.5757 493.858 38.609 494.332 36.7831 494.273C31.6952 494.109 29.7731 489.28 30.2541 484.802C30.5483 482.059 31.8874 480.21 34.0654 478.55C44.5573 470.57 55.2122 462.812 65.8461 455.022C71.9019 450.667 79.2147 444.795 85.7258 441.454C88.7703 439.893 94.6161 439.226 98.0593 439.744C109.096 441.403 112.259 447.556 118.436 455.554C118.543 455.441 119.07 454.883 119.16 454.807C128.279 446.746 137.593 438.821 146.653 430.699C157.778 420.723 168.814 410.088 181.073 401.546C205.601 384.452 236.426 376.763 266.101 377.164C282.961 377.394 302.016 380.02 317.851 385.947C330.878 390.823 342.576 398.654 354.897 404.829C377.027 415.916 408.837 416.431 433.461 416.919C435.08 415.785 436.743 414.72 438.421 413.677C448.605 407.349 458.562 400.685 468.611 394.146L486.458 382.628C490.54 380.009 495.208 376.873 499.534 374.79C504.436 372.47 509.671 370.939 515.051 370.253C530.771 368.225 541.199 373.674 553.126 382.912C567.144 374.819 572.181 368.2 589.28 366.321ZM189.458 415.818C173.654 427.551 159.834 441.527 144.866 454.26C139.103 459.165 133.871 464.26 127.857 468.878C134.805 478.244 141.459 488.08 148.235 497.6L191.738 558.669C198.657 568.378 205.713 579.035 212.957 588.438C217.563 585.553 221.283 582.245 226.292 579.283C247.638 566.657 262.634 568.331 285.253 573.532L347.96 587.482L376.655 593.865C391.653 597.18 407.611 601.272 422.861 599.631C442.123 597.556 449.141 592.596 464.719 582.847L520.507 547.622C538.971 536.198 557.792 525.187 575.697 512.911C583.561 507.517 591.104 500.911 598.49 494.81C608.922 486.169 619.393 477.584 629.913 469.053L660.387 444.343C666.508 439.379 673.354 434.12 678.818 428.784C687.313 420.494 687.01 402.473 677.797 394.693C671.687 389.536 665.957 387.814 658.166 387.851C654.114 388.194 648.354 388.96 644.758 390.944C633.316 397.268 622.118 405.686 611.114 412.896L526.555 469.013C523.028 483.084 518.304 493.767 505.093 501.688C499.326 505.12 492.874 507.239 486.196 507.9C477.307 508.855 463.355 508.385 454.003 508.352L402.505 508.33L360.085 508.315C355.982 508.319 351.488 508.323 347.502 508.352C339.754 508.407 333.126 508.808 333.921 498.709C334.346 493.303 338.663 491.987 343.51 491.677C354.447 491.567 365.472 491.735 376.458 491.702L454.014 491.695C462.502 491.695 484.069 492.494 491.258 490.021C499.596 487.099 506.063 480.41 508.7 471.978C510.94 464.662 510.148 456.751 506.508 450.022C497.805 433.762 482.796 434.776 466.842 434.185C461.097 433.974 455.327 433.952 449.586 433.799C436.911 433.438 424.24 432.891 411.579 432.161C384.592 430.731 362.794 429.269 339.054 414.972C333.276 411.496 326.936 408.14 320.879 405.146C283.151 388.15 235.125 389.295 198.928 409.807C197.051 410.869 191.102 414.363 189.458 415.818ZM496.514 421.136C501.373 418.429 509.769 412.678 514.602 409.318C522.688 403.698 531.665 398.07 539.613 392.476C532.037 387.672 528.13 386.538 519.103 386.753C506.45 387.544 500.895 392.61 490.616 399.329C481.151 405.518 471.46 411.368 462.487 418.302C470.07 418.32 477.467 418.199 485.025 418.987C489.165 419.21 492.593 419.64 496.514 421.136ZM531.957 445.561L613.744 391.607C606.062 384.9 600.299 382.694 589.893 383.088C577.488 384.583 567.322 393.577 557.153 400.262C542.144 410.135 527.561 421.154 512.355 430.706C518.373 437.723 521.62 441.659 524.629 450.729L531.957 445.561Z" fill={G}/>
      <Path d="M417.445 28.8906C506.8 22.0062 584.805 88.8809 591.644 178.232C598.483 267.582 531.563 345.548 442.204 352.341C352.909 359.13 275.006 292.274 268.172 202.988C261.338 113.701 328.158 35.77 417.445 28.8906ZM428.767 336.328C509.211 336.995 574.997 272.387 575.781 191.947C576.565 111.508 512.049 45.6305 431.608 44.7297C350.998 43.827 284.951 108.5 284.166 189.106C283.38 269.712 348.154 335.66 428.767 336.328Z" fill={G}/>
      <Path d="M384.738 221.902C385.927 218.157 388.586 212.043 390.107 208.132C394.994 195.602 400.083 183.15 405.36 170.779C408.942 162.253 412.586 153.927 415.665 145.094C417.517 139.776 425.232 141.761 429.477 141.354C431.192 141.19 434.467 141.384 435.711 142.567C436.528 146.469 436.273 155.731 436.269 160.228L436.262 189.309L436.273 222.294C436.273 227.846 436.535 236.577 435.871 241.721C434.197 243.77 424.677 242.783 422.121 242.388C421.654 236.588 421.898 227.245 421.891 221.226C421.785 205.381 422.018 189.535 422.584 173.7C422.762 169.85 422.828 165.995 422.777 162.141C419.633 169.239 416.624 177.179 413.684 184.427L399.171 219.865C396.468 226.464 393.893 233.076 391.07 239.627C389.056 244.304 384.296 243.073 379.949 242.617C378.129 239.906 374.029 229.246 372.46 225.474L354.748 182.261C352.539 176.914 348.764 166.783 346.122 162.026C346.566 165.271 346.612 170.262 346.735 173.606C347.02 181.173 347.227 188.743 347.356 196.314C347.523 206.085 347.57 215.858 347.497 225.63C347.497 228.45 349.006 242.555 344.94 242.866C342.422 243.059 335.537 243.273 333.496 241.752C333.078 240.283 333.002 237.755 333 236.214C332.979 215.919 332.998 195.613 333.002 175.319L333.012 154.445C333.014 151.05 332.973 147.517 333.086 144.118C333.12 143.089 333.942 142.284 334.643 141.571C339.731 141.325 346.472 141.296 351.535 141.557C353.672 144.516 359.436 159.654 361.286 164.145C369.309 183.314 377.125 202.567 384.738 221.902Z" fill={G}/>
      <Path d="M459.814 141.561C463.943 141.382 468.272 141.227 472.376 141.698C473.361 146.401 473.061 156.166 473.061 161.38V191.519L501.8 158.169C505.086 154.384 513.559 144.027 517.232 141.48C520.526 141.445 529.754 141.033 532.22 142.088L532.457 142.721C531.899 144.966 516.215 162.139 513.286 165.505C507.756 171.86 500.979 179.8 495.234 185.953C503.394 197.377 512.432 209.075 520.869 220.38C525.03 225.956 532.012 234.781 535.78 240.862C536.075 241.338 535.863 241.473 535.608 242.026C532.967 243.602 525.355 242.954 522.087 242.739C520.723 242.649 519.581 241.594 518.72 240.572C514.701 235.8 510.845 230.403 507.118 225.382L485.299 195.895C482.133 199.585 475.6 206.167 473.113 209.623C472.923 220.084 473.547 231.394 472.551 241.786C472.445 242.89 466.368 242.858 465.471 242.857C462.63 242.852 458.089 243.363 458.493 239.148C458.493 232.794 458.483 226.296 458.483 220.022L458.479 181.729V156.838C458.472 152.571 458.442 148.18 458.475 143.904C458.483 142.709 459.041 142.401 459.814 141.561Z" fill={G}/>
    </Svg>
  );
}

function TreasuryBillsIcon() {
  const G = "#1EA84E";
  return (
    <Svg width={34} height={34} viewBox="0 0 551 547" fill="none">
      <Path d="M268.325 4.1124C271.171 4.03607 273.418 4.43345 275.847 6.00688C282.299 10.1858 288.46 14.7639 294.815 19.0995L343.234 52.533L445.274 122.844L493.476 155.937L505.96 164.582C510.749 167.833 515.909 171.056 520.084 175.046C522.393 177.032 521.72 182.764 519.154 184.424C513.509 188.077 500.014 187.314 493.605 186.674C493.761 190.076 493.627 193.727 493.74 197.064C494.205 210.878 489.276 215.841 475.48 214.513C476.12 219.062 476.117 230.545 473.005 234.099C469.736 237.829 466.367 237.956 461.947 238.367C462.48 245.087 462.146 253.599 462.03 260.459C470.661 258.792 485.241 250.024 490.756 262.585C491.727 264.8 491.722 269.165 490.872 271.528C484.63 288.88 474.942 305.15 467.721 322.079C469.16 324.277 472.329 327.753 474.145 329.849C477.455 333.657 480.745 337.483 484.011 341.327C492.871 351.772 501.233 362.632 509.064 373.87C529.891 404.207 550.521 446.051 543.327 483.994C540.647 498.063 532.374 510.443 520.402 518.302C497.501 533.663 461.955 533.065 435.468 533.055C403.707 533.044 358.562 533.168 338.645 503.547C333.234 496.484 331.593 488.103 330.215 479.571C327.42 479.038 322.709 479.154 319.709 479.143L304.476 479.127L249.546 479.13L88.395 479.111L39.8492 479.151C33.8014 479.159 27.6521 479.307 21.6586 479.278C18.0577 479.019 11.7113 479.536 9.17722 476.501C5.27467 471.588 6.14664 463.664 6.1616 457.917C6.19246 446.057 12.4816 444.031 22.856 444.203C27.4848 444.278 32.6378 444.345 37.356 444.51C37.222 443.379 37.12 441.598 37.1652 440.46C37.4146 434.191 35.9817 424.747 40.6415 419.764C41.8786 418.443 43.4837 417.52 45.2497 417.119C48.1451 416.433 52.8181 416.729 55.8938 416.643C62.7052 416.449 70.4609 416.971 77.1856 416.594C76.8181 407.449 77.1262 396.48 77.1254 387.183L77.1951 328.883L77.0317 267.603C77.0212 258.074 76.8515 247.978 77.1203 238.484C73.2137 238.117 69.6511 237.907 66.754 234.694C63.1209 230.666 63.9275 220.097 64.2665 214.695C49.4591 214.889 44.886 212.176 45.4238 196.293C45.5222 193.389 45.462 189.861 45.4859 186.888C37.0832 186.731 11.222 190.411 18.7616 174.881C19.5126 173.334 29.1607 166.899 31.1454 165.532L50.8418 152.094L79.8239 132.159L192.938 54.3152L237.885 23.2636C245.01 18.3445 252.105 13.3463 259.258 8.47659C261.923 6.66172 265.111 4.44292 268.325 4.1124ZM271.599 180.541L433.835 180.4L481.305 180.589C486.134 180.633 511.179 181.383 514.139 180.122L514.518 179.625C514.27 178.415 512.834 177.518 511.698 176.732C497.283 166.761 482.76 156.881 468.321 146.95L385.181 89.6913L315.612 41.6455C302.566 32.6257 289.472 23.6089 276.345 14.7045C273.959 13.0857 271.026 11.3449 268.087 11.2882C263.609 13.1874 251.051 22.3622 246.41 25.5446L201.158 56.6128L102.223 124.866C79.9705 139.976 57.7957 155.2 35.6995 170.538C33.5337 172.07 25.1153 177.683 24.4507 179.733C25.0155 180.377 25.5922 180.463 26.4908 180.483C36.6662 180.708 47.0219 180.605 57.1896 180.558L108.219 180.533L271.599 180.541ZM459.022 526.296C498.02 525.249 540.26 514.578 538.003 466.032C535.842 419.503 506.18 379.295 477.667 344.691C472.639 338.586 467.016 332.623 462.098 326.548C459.141 325.873 447.879 326.021 443.996 326.056C434.424 326.147 424.276 325.878 414.77 326.204C414.259 326.257 412.494 326.422 412.279 326.664C405.566 334.367 398.141 342.065 391.802 350.067C362.869 386.581 332.411 429.754 336.823 478.799C338.725 499.944 354.849 515.31 374.729 520.484C400.689 527.243 432.39 527.883 459.022 526.296ZM127.493 238.113C127.927 275.295 127.522 313.469 127.502 350.72L127.508 395.468C127.503 401.936 127.758 410.446 127.485 416.702C137.711 415.887 149.026 417.332 159.36 416.713C169.886 416.083 173.879 419.799 174.621 430.4C174.827 434.807 174.877 439.93 174.509 444.493C177.223 444.047 186.544 444.267 189.919 444.275L219.122 444.332C221.195 444.356 229.184 444.66 230.716 444.203C230.627 442.29 230.512 440.339 230.474 438.431C230.229 426.251 229.831 417.499 244.587 416.325C244.097 413.064 244.321 402.996 244.301 399.272V359.594L244.324 292.132C244.241 274.867 243.823 255.543 244.311 238.439C240.149 238.055 236.724 237.932 233.65 234.419C229.928 230.166 230.809 220.347 230.935 214.728L140.18 214.73C140.436 216.295 140.52 217.771 140.517 219.35C140.499 229.896 140.341 237.864 127.493 238.113ZM412.922 318.987C423.813 319.361 435.094 318.939 446.02 319.095C450.887 319.165 456.13 318.931 460.957 319.283C462.832 314.093 468.243 304.208 470.852 298.649L478.291 283.216C480.167 279.349 482.219 275.591 483.637 271.461C486.01 264.54 484.267 262.064 476.717 263.494C473.29 264.144 469.999 265.733 466.62 266.605C457.634 269.133 446.488 272.141 437.2 272.058C429 271.983 417.953 269.295 409.949 267.22C403.479 265.545 399.481 262.666 392.292 262.964C389.109 264.366 389.112 268.005 390.279 270.799C396.029 284.534 403.059 297.812 409.174 311.4C410.213 313.708 411.329 315.985 412.494 318.21C412.629 318.474 412.771 318.735 412.922 318.987ZM117.872 416.568L120.588 416.506C120.166 409.709 120.438 400.19 120.44 393.186L120.643 342.993L120.638 272.521C120.669 261.309 120.277 249.537 120.805 238.344C115.466 237.918 108.622 238.078 103.147 238.099C96.8556 238.124 89.8594 237.961 83.6187 238.213C83.3451 238.975 83.5899 255.088 83.5628 257.718L83.5138 372.275C83.4229 381.122 83.396 389.968 83.4328 398.812C83.4541 404.134 83.6951 411.294 83.3723 416.481C94.6191 416.511 106.692 416.323 117.872 416.568ZM250.758 238.176L250.826 360.503L250.869 401.594C250.872 406.411 251.079 411.741 250.993 416.452C263.427 416.546 275.863 416.57 288.299 416.525C288.051 413.775 288.242 410.253 288.288 407.414L288.368 395.148L288.352 355.628L288.363 281.373C288.29 267.051 288.304 252.729 288.403 238.407C283.859 237.945 277.911 238.109 273.254 238.107C265.755 238.09 258.257 238.113 250.758 238.176ZM44.3145 444.561C47.5783 444.039 54.2263 444.24 57.7852 444.251L79.6998 444.257C107.78 444.144 135.86 444.216 163.94 444.48L167.952 444.574C167.252 441.442 167.703 436.314 167.66 432.978C167.58 426.838 168.314 423.337 160.811 423.329C154.81 423.235 148.773 423.243 142.776 423.238L109.142 423.216L69.8962 423.208C62.9145 423.205 55.2325 423.036 48.3281 423.273C47.2993 423.523 46.2002 423.805 45.7299 424.857C43.5222 429.803 44.6255 439.042 44.3145 444.561ZM301.928 444.434C301.772 440.369 302.1 427.483 300.75 424.707C298.312 422.804 289.907 423.211 286.596 423.203L270.474 423.189L252.783 423.195C249.669 423.197 245.221 423.087 242.172 423.318C236.915 423.932 237.719 429.509 237.581 433.613C237.459 437.229 237.683 440.899 237.47 444.526C247.189 443.958 257.566 444.423 267.332 444.41C277.311 444.397 287.271 444.283 297.25 444.27C298.745 444.329 300.451 444.434 301.928 444.434ZM329.562 473.272C328.623 467.619 330 456.335 331.152 450.776C311.307 450.937 291.363 450.354 271.513 450.475C265.194 450.515 258.549 450.343 252.279 450.528C244.804 450.838 236.757 450.719 229.225 450.722L192.063 450.711L78.5486 450.725L35.2965 450.749L23.0761 450.762C14.951 450.749 13.1198 450.052 12.9666 459.542C12.7433 473.377 12.7189 473.178 25.5896 473.208L42.4713 473.164L93.4253 473.116L256.249 473.081L304.829 473.103C310.971 473.103 324.03 472.702 329.562 473.272ZM418.327 238.158C418.042 244.624 418.297 255.722 418.561 262.297C429.928 265.827 442.39 265.269 453.913 262.843C455.113 262.455 455.041 262.69 455.676 261.869C456.157 255.819 455.684 244.881 455.727 238.274C451.478 238.056 447.093 238.031 442.831 238.087C434.693 238.194 426.452 237.922 418.327 238.158ZM132.608 230.042C134.466 225.64 134.062 219.502 133.998 214.667L90.588 214.707C86.6764 214.712 73.5205 214.999 70.611 214.475C70.5922 217.55 70.159 228.163 71.826 230.064C78.9584 233.224 118.892 230.049 128.73 231.085C129.99 231.218 131.607 230.907 132.608 230.042ZM467.721 230.185C468.727 224.364 468.66 220.617 468.778 214.705L427.474 214.705C420.544 214.706 412.274 214.933 405.44 214.646C405.504 218.188 405.187 227.944 406.836 230.418C407.961 230.961 409.502 230.993 410.74 231.054C417.176 231.372 463.182 231.765 466.674 230.693C467.053 230.577 467.387 230.39 467.721 230.185ZM360.617 380.592C369.028 367.585 378.288 355.146 388.334 343.356C392.286 338.731 396.268 334.13 400.277 329.553C401.964 327.622 405.504 323.798 406.75 321.764C404.396 317.898 402.599 313.969 400.635 309.845C395.978 300.067 391.479 290.658 386.825 280.821C383.3 273.376 378.64 262.226 388.385 256.987C395.364 253.234 404.522 258.491 411.604 260.31C410.958 254.784 411.254 243.941 411.378 238.236C407.743 238.059 404.315 237.87 401.622 234.948C397.624 230.606 398.485 220.444 398.725 214.658L336.974 214.709L318.733 214.724C315.9 214.722 310.551 214.8 307.92 214.461C308.267 220.632 309.192 229.677 304.896 234.486C301.939 237.795 298.869 237.985 294.89 238.512C295.412 247.016 295.035 259.145 295.022 267.964L294.984 321.581L295.027 383.952C295.038 394.023 295.407 406.704 294.976 416.492C299.05 416.608 302.356 416.516 305.485 419.726C309.297 423.638 308.813 429.415 308.832 434.465C308.843 436.884 308.88 439.707 308.781 442.115C308.746 442.876 308.703 443.638 308.646 444.399C316.518 444.184 324.393 444.222 332.26 444.51C334.399 425.761 350.187 396.305 360.617 380.592ZM301.124 214.738C286.865 214.58 272.538 214.848 258.288 214.743C252.57 214.701 243.112 215.079 237.723 214.566C237.803 218.176 237.359 227.575 238.91 230.142C240.942 231.553 253.22 231.209 256.148 231.225C264.76 231.267 273.372 231.256 281.984 231.193C284.946 231.168 298.167 231.546 299.865 230.205C301.498 225.793 301.108 219.579 301.124 214.738ZM415.575 186.314C402.316 187.035 388.358 186.746 375.03 186.748L312.19 186.747L133.106 186.726L69.4846 186.761C63.9226 186.798 57.8931 186.67 52.3871 186.792C52.565 193.766 52.0845 199.369 53.1275 206.34C57.4045 207.847 76.6575 207.28 82.4524 207.284L126.047 207.295L356.159 207.278L453.636 207.348C462.407 207.282 471.213 207.416 479.981 207.351C481.146 207.343 484.797 207.272 485.319 206.435C487.824 202.402 486.745 191.441 486.866 186.855C463.08 186.588 439.42 185.692 415.575 186.314Z" fill={G}/>
      <Path d="M267.728 69.9931C273.501 69.9476 276.288 73.6066 280.596 76.9529L298.928 91.2906L335.489 119.622C342.201 124.832 348.989 130.047 355.616 135.367C356.773 136.548 359.167 138.046 359.137 139.843C359.094 142.236 357.488 143.432 355.204 143.583C351.575 143.823 347.822 143.858 344.149 143.83C338.97 143.766 333.794 143.736 328.617 143.739L271.868 143.701L211.198 143.678C201.736 143.689 191.35 144.14 181.872 143.142C181.171 143.068 180.736 142.495 180.456 141.882C179.195 139.122 180.811 137.166 182.959 135.586C192.187 128.06 201.658 120.882 211.104 113.642L237.297 93.2041L257.359 77.392C259.69 75.5793 265.198 71.0158 267.728 69.9931ZM192.26 136.991C217.72 136.519 244.273 136.853 269.81 136.853L315.084 136.813C325.289 136.784 336.258 136.51 346.361 136.78C338.265 130.833 329.906 123.938 321.95 117.681C308.331 106.924 294.61 96.297 280.787 85.802C278.982 84.4314 270.571 77.5491 268.939 77.1665C263.647 80.6893 258.643 85.0083 253.551 88.9043C239 100.083 224.543 111.383 210.18 122.803C204.61 127.181 197.929 132.981 192.26 136.991Z" fill={G}/>
      <Path d="M379.973 401.481C380.82 401.57 382.461 401.923 382.954 402.603C391.372 414.235 398.345 427.766 406.376 439.632C412.753 429.676 418.664 419.43 424.981 409.44C426.571 406.922 428.408 403.532 430.87 401.845C432.366 401.541 435.985 401.971 436.176 403.75C437.08 412.109 436.625 421.352 436.646 429.749L436.665 452.794C436.663 456.485 437.072 465.612 435.89 469.449C435.699 470.065 434.021 470.727 433.291 470.767C430.351 470.934 428.763 469.817 428.723 466.742C428.5 462.284 428.626 457.903 428.648 453.48C428.731 444.631 428.731 435.781 428.648 426.932C428.599 423.889 428.524 421.112 428.731 418.069C425.078 423.125 411.238 448.15 408.48 449.789C406.877 450.738 405.198 450.276 403.519 449.864C401.076 446.455 399.174 442.702 397.006 439.12C393.551 433.416 389.984 427.779 386.43 422.135C385.587 420.797 384.721 419.476 383.645 418.311C384.546 433.952 383.443 450.238 383.949 465.938C384.046 468.938 381.398 472.169 378.259 470.646C377.328 470.183 376.631 469.352 376.34 468.354C375.8 466.521 375.999 449.162 375.993 446.361V420.625C375.993 415.795 375.942 410.963 376.023 406.136C376.077 403.047 377.223 402.305 379.973 401.481Z" fill={G}/>
      <Path d="M494.071 401.729C497.291 401.755 500.243 403.023 498.117 406.991C497.178 408.748 494.343 411.38 492.847 412.965L482.322 424.109C480.484 426.06 477.608 428.941 476.12 431.043L475.91 431.344C476.214 431.71 476.51 432.081 476.798 432.461C478.994 435.38 481.159 438.566 483.309 441.617C488.843 449.471 495.104 457.333 500.251 465.413C502.809 470.587 496.498 472.987 493.194 468.795C486.852 460.739 481.213 452.255 475.208 443.952C473.521 441.62 471.799 439.33 470.433 436.801C467.212 440.341 462.838 444.45 460.064 448.263C459.8 448.623 459.779 449.845 459.773 450.34C459.749 454.454 460.758 466.922 458.471 469.89C457.906 470.624 457.126 471.224 456.157 471.238C455.078 471.254 453.755 470.581 452.966 469.879C451.82 468.859 451.847 466.731 451.818 465.321C451.664 452.097 451.651 438.87 451.777 425.645C451.783 418.706 451.465 411.646 451.987 404.766C452.167 401.809 457.196 400.477 458.638 402.939C460.459 406.05 459.886 412.79 459.797 416.548C459.633 423.385 460.263 431.457 459.394 438.114C467.188 430.066 474.441 420.665 482.421 412.706C485.348 409.784 490.433 402.964 494.071 401.729Z" fill={G}/>
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

  // ── Guided tour ──────────────────────────────────────────────────────────
  // Targets register themselves via callback refs; the tour starts once per
  // install after an authenticated user lands here (or when Help requests a
  // replay).
  const tour = useTour();
  const balanceRef = useTourTarget("balance");
  const depositRef = useTourTarget("deposit");
  const tradeRef = useTourTarget("trade");
  const bellRef = useTourTarget("bell");
  const isLoggedIn = !!user;
  useFocusEffect(useCallback(() => {
    if (isLoggedIn) { tour.startIfFirstRun(); }
  }, [isLoggedIn, tour.startIfFirstRun]));



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
          <TouchableOpacity ref={bellRef} activeOpacity={0.7} onPress={() => setShowNotifications(true)}>
            <NotificationIcon />
          </TouchableOpacity>
        </View>

        {/* Balance card */}
        <View ref={balanceRef} collapsable={false} style={{ backgroundColor: GREEN, borderRadius: 16, padding: 20, gap: 28 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 12, color: WHITE, opacity: 0.8, letterSpacing: 1, marginBottom: 4 }}>AVAILABLE BALANCE</Text>
              <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 34, color: WHITE, letterSpacing: -0.5 }} adjustsFontSizeToFit numberOfLines={1}>
                {balanceVisible ? (totalBalance ?? "—") : "K  ••••••"}
              </Text>
            </View>
            <TouchableOpacity onPress={requestBalanceToggle} activeOpacity={0.7} style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" }}>
              <EyeIcon visible={balanceVisible} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity ref={depositRef} style={{ flex: 1, backgroundColor: WHITE, borderRadius: 12, height: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }} activeOpacity={0.85} onPress={() => guardedPush(() => router.push("/deposit"))}>
              <AddCircleIcon color={GREEN} />
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: GREEN }}>Deposit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, borderRadius: 12, height: 48, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.25)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }} activeOpacity={0.85} onPress={() => guardedPush(() => router.push("/withdraw" as any))}>
              <ImportIcon color={WHITE} />
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: WHITE }}>Withdraw</Text>
            </TouchableOpacity>
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
            <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 14, color: WHITE, lineHeight: 20 }}>Deposit Successful!</Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 17 }}>MK {depositToast.amount} has been added to your wallet.</Text>
          </View>
          <TouchableOpacity onPress={() => setDepositToast({ visible: false, amount: "" })} hitSlop={12}>
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
              <Path d="M4 4l8 8M12 4l-8 8" stroke={WHITE} strokeWidth={1.5} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        </View>
      )}

      {/* White/dark sheet */}
      <View style={{ flex: 1, backgroundColor: c.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: 12, overflow: "hidden" }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} colors={[c.primary]} />}
        >
          <View style={{ backgroundColor: c.background, paddingHorizontal: 20, paddingTop: 24 }}>
            {/* Invest section */}
            <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text, marginBottom: 4 }}>Invest</Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: MUTED2, marginBottom: 16 }}>Choose what to invest</Text>

            {/* Equity Trading card */}
            <TouchableOpacity
              ref={tradeRef}
              activeOpacity={0.85}
              onPress={() => guardedPush(() => router.push("/stock-search" as any))}
              style={{
                borderRadius: 16,
                backgroundColor: c.card,
                borderWidth: 1,
                borderColor: c.border,
                marginBottom: 12,
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
                  <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: c.text, lineHeight: 21 }}>Equity Trading</Text>
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

            {/* Treasury Bills card */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => guardedPush(() => router.push("/treasury" as any))}
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
                  <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: c.text, lineHeight: 21 }}>Debt Securities</Text>
                  <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: c.mutedForeground, lineHeight: 15 }}>
                    Low-risk government-backed{"\n"}short-term investments
                  </Text>
                </View>
                <View style={{
                  width: 56, height: 54, borderRadius: 28,
                  backgroundColor: c.background,
                  alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <TreasuryBillsIcon />
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
                  <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 16, marginBottom: 12 }}>
                    Structured courses for every level
                  </Text>

                  {/* Topics */}
                  <View style={{ gap: 5, marginBottom: 14 }}>
                    {[
                      "Market Fundamentals",
                      "Portfolio Strategy",
                      "Technical Analysis",
                      "Risk Management",
                    ].map((topic) => (
                      <View key={topic} style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: GREEN }} />
                        <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 11.5, color: "rgba(255,255,255,0.7)" }}>{topic}</Text>
                      </View>
                    ))}
                  </View>

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

                {/* Right: contained square photo */}
                <Image
                  source={require("../../attached_assets/image_da53edb6-914b-41d1-bc8b-dfe23a6d2164_1785280173516.png")}
                  style={{ width: 155, height: 155, borderRadius: 14 }}
                  resizeMode="cover"
                />
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </View>
  );
}

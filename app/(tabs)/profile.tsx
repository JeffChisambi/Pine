import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { useAuth } from "../../services/auth-context";
import { useWalletBalance } from "../../services/wallet-queries";

const TEAL = "#164951";
const CARD_TEAL = "#2D5B62";
const GREEN_AVATAR = "#8FD1A5";
const WHITE = "#FFFFFF";
const DARK = "#111827";
const MUTED = "#9CA3AF";
const DIVIDER = "#EBECEF";
const CARD_BG = "#F9FAFB";
const CARD_BORDER = "#F3F4F6";
const RED = "#EF4770";

function EditIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Path d="M13 2a2 2 0 0 1 2.828 2.828L5.5 15.156 2 16l.844-3.5L13 2z" stroke={DARK} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRight() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M7.5 14.5L12.5 10 7.5 5.5" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path d="M17.875 3.4375H4.125C2.98591 3.4375 2.0625 4.36091 2.0625 5.5V17.875C2.0625 19.0141 2.98591 19.9375 4.125 19.9375H17.875C19.0141 19.9375 19.9375 19.0141 19.9375 17.875V5.5C19.9375 4.36091 19.0141 3.4375 17.875 3.4375Z" stroke={MUTED} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M12.7188 11C13.2883 11 13.75 10.5383 13.75 9.96875C13.75 9.39921 13.2883 8.9375 12.7188 8.9375C12.1492 8.9375 11.6875 9.39921 11.6875 9.96875C11.6875 10.5383 12.1492 11 12.7188 11Z" fill={MUTED} />
      <Path d="M16.1562 11C16.7258 11 17.1875 10.5383 17.1875 9.96875C17.1875 9.39921 16.7258 8.9375 16.1562 8.9375C15.5867 8.9375 15.125 9.39921 15.125 9.96875C15.125 10.5383 15.5867 11 16.1562 11Z" fill={MUTED} />
      <Path d="M12.7188 14.4375C13.2883 14.4375 13.75 13.9758 13.75 13.4062C13.75 12.8367 13.2883 12.375 12.7188 12.375C12.1492 12.375 11.6875 12.8367 11.6875 13.4062C11.6875 13.9758 12.1492 14.4375 12.7188 14.4375Z" fill={MUTED} />
      <Path d="M16.1562 14.4375C16.7258 14.4375 17.1875 13.9758 17.1875 13.4062C17.1875 12.8367 16.7258 12.375 16.1562 12.375C15.5867 12.375 15.125 12.8367 15.125 13.4062C15.125 13.9758 15.5867 14.4375 16.1562 14.4375Z" fill={MUTED} />
      <Path d="M5.84375 14.4375C6.41329 14.4375 6.875 13.9758 6.875 13.4062C6.875 12.8367 6.41329 12.375 5.84375 12.375C5.27421 12.375 4.8125 12.8367 4.8125 13.4062C4.8125 13.9758 5.27421 14.4375 5.84375 14.4375Z" fill={MUTED} />
      <Path d="M9.28125 14.4375C9.85079 14.4375 10.3125 13.9758 10.3125 13.4062C10.3125 12.8367 9.85079 12.375 9.28125 12.375C8.71171 12.375 8.25 12.8367 8.25 13.4062C8.25 13.9758 8.71171 14.4375 9.28125 14.4375Z" fill={MUTED} />
      <Path d="M5.84375 17.875C6.41329 17.875 6.875 17.4133 6.875 16.8438C6.875 16.2742 6.41329 15.8125 5.84375 15.8125C5.27421 15.8125 4.8125 16.2742 4.8125 16.8438C4.8125 17.4133 5.27421 17.875 5.84375 17.875Z" fill={MUTED} />
      <Path d="M9.28125 17.875C9.85079 17.875 10.3125 17.4133 10.3125 16.8438C10.3125 16.2742 9.85079 15.8125 9.28125 15.8125C8.71171 15.8125 8.25 16.2742 8.25 16.8438C8.25 17.4133 8.71171 17.875 9.28125 17.875Z" fill={MUTED} />
      <Path d="M12.7188 17.875C13.2883 17.875 13.75 17.4133 13.75 16.8438C13.75 16.2742 13.2883 15.8125 12.7188 15.8125C12.1492 15.8125 11.6875 16.2742 11.6875 16.8438C11.6875 17.4133 12.1492 17.875 12.7188 17.875Z" fill={MUTED} />
      <Path d="M5.5 2.0625V3.4375M16.5 2.0625V3.4375" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M19.9375 6.875H2.0625" stroke={MUTED} strokeWidth={1.5} strokeLinejoin="round" />
    </Svg>
  );
}

function LockIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path d="M14.4375 8.9375V4.85547C14.4375 3.94379 14.0753 3.06945 13.4307 2.42479C12.786 1.78013 11.9117 1.41797 11 1.41797C10.0883 1.41797 9.21398 1.78013 8.56932 2.42479C7.92466 3.06945 7.5625 3.94379 7.5625 4.85547V8.9375" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15.8125 8.9375H6.1875C5.04841 8.9375 4.125 9.86091 4.125 11V18.5625C4.125 19.7016 5.04841 20.625 6.1875 20.625H15.8125C16.9516 20.625 17.875 19.7016 17.875 18.5625V11C17.875 9.86091 16.9516 8.9375 15.8125 8.9375Z" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LinkIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path d="M8.9375 15.125H6.1875C5.09348 15.125 4.04427 14.6904 3.27068 13.9168C2.4971 13.1432 2.0625 12.094 2.0625 11C2.0625 9.90598 2.4971 8.85677 3.27068 8.08318C4.04427 7.3096 5.09348 6.875 6.1875 6.875H8.9375M13.0625 6.875H15.8125C16.9065 6.875 17.9557 7.3096 18.7293 8.08318C19.5029 8.85677 19.9375 9.90598 19.9375 11C19.9375 12.094 19.5029 13.1432 18.7293 13.9168C17.9557 14.6904 16.9065 15.125 15.8125 15.125H13.0625M7.01637 11H15.0696" stroke={MUTED} strokeWidth={1.6875} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FingerprintIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path d="M16.7759 3.23474C16.6955 3.23494 16.6166 3.21357 16.5473 3.17286C14.6403 2.15193 12.9916 1.7188 11.015 1.7188C9.04836 1.7188 7.18094 2.20349 5.48238 3.17286C5.24219 3.30865 4.94613 3.21411 4.80692 2.9649C4.74478 2.84461 4.73076 2.70518 4.76771 2.57493C4.80466 2.44468 4.88981 2.33338 5.00586 2.26365C6.83778 1.22465 8.909 0.681407 11.015 0.687552C13.1304 0.687552 14.978 1.17224 17.0045 2.25505C17.1227 2.32006 17.2107 2.42881 17.2497 2.55798C17.2886 2.68716 17.2754 2.82645 17.2129 2.94599C17.1752 3.03086 17.1141 3.10316 17.0366 3.15434C16.9592 3.20552 16.8687 3.23342 16.7759 3.23474ZM2.56223 8.6488C2.45903 8.64807 2.35854 8.61567 2.27434 8.55599C2.16479 8.47458 2.09112 8.35383 2.06884 8.21917C2.04656 8.08452 2.0774 7.94647 2.15488 7.83411C3.13844 6.39036 4.38926 5.25599 5.87985 4.46193C8.99852 2.79302 12.9916 2.78099 16.1202 4.45161C17.6103 5.24568 18.8616 6.36974 19.8451 7.80318C19.9223 7.91564 19.9529 8.0536 19.9307 8.18815C19.9084 8.32271 19.8349 8.44344 19.7257 8.52505C19.6726 8.56468 19.6121 8.593 19.5477 8.60828C19.4833 8.62355 19.4164 8.62544 19.3512 8.61384C19.2861 8.60224 19.224 8.5774 19.1688 8.54084C19.1136 8.50428 19.0665 8.45679 19.0304 8.4013C18.1367 7.10193 17.0045 6.08099 15.6634 5.36943C12.8129 3.85349 9.16738 3.85349 6.32672 5.37974C4.97578 6.10161 3.84356 7.13286 2.94981 8.43052C2.91127 8.4988 2.85478 8.55524 2.78646 8.59372C2.71814 8.63219 2.6406 8.65124 2.56223 8.6488ZM8.76992 21.0977C8.70428 21.0983 8.63927 21.0849 8.57929 21.0582C8.51932 21.0315 8.46578 20.9922 8.42231 20.943C7.5582 20.0441 7.08985 19.4649 6.42598 18.2188C5.73848 16.9504 5.38313 15.4035 5.38313 13.7432C5.38313 10.6804 7.90582 8.18474 11.0052 8.18474C14.1045 8.18474 16.6289 10.6804 16.6289 13.7432C16.6309 13.8096 16.6195 13.8758 16.5954 13.9377C16.5713 13.9996 16.5351 14.0561 16.4888 14.1038C16.4425 14.1515 16.3871 14.1894 16.3259 14.2153C16.2646 14.2412 16.1989 14.2545 16.1324 14.2545C16.0659 14.2545 16.0002 14.2412 15.9389 14.2153C15.8777 14.1894 15.8223 14.1515 15.776 14.1038C15.7297 14.0561 15.6935 13.9996 15.6694 13.9377C15.6453 13.8758 15.6339 13.8096 15.6359 13.7432C15.6359 11.2476 13.5597 9.21599 11.0073 9.21599C8.45496 9.21599 6.37656 11.2476 6.37656 13.7432C6.37656 15.2282 6.6941 16.5997 7.29996 17.7135C7.9359 18.8994 8.37418 19.4047 9.13774 20.2091C9.22829 20.3092 9.27843 20.4394 9.27843 20.5743C9.27843 20.7093 9.22829 20.8395 9.13774 20.9396C9.04025 21.0379 8.90838 21.0946 8.76992 21.0977ZM15.892 19.1899C14.7099 19.1899 13.6671 18.8805 12.8129 18.2721C12.0851 17.762 11.4905 17.0845 11.0793 16.2966C10.668 15.5088 10.452 14.6336 10.4496 13.7449C10.4468 13.6779 10.4576 13.6111 10.4813 13.5484C10.505 13.4857 10.5411 13.4284 10.5875 13.3801C10.6339 13.3317 10.6896 13.2932 10.7513 13.2669C10.8129 13.2406 10.8793 13.2271 10.9463 13.2271C11.0133 13.2271 11.0797 13.2406 11.1413 13.2669C11.203 13.2932 11.2587 13.3317 11.3051 13.3801C11.3515 13.4284 11.3876 13.4857 11.4113 13.5484C11.435 13.6111 11.4458 13.6779 11.443 13.7449C11.4447 14.4668 11.6207 15.1776 11.9562 15.8168C12.2917 16.456 12.7766 17.0047 13.3697 17.4161C14.0748 17.9111 14.8994 18.1466 15.8929 18.1466C16.2388 18.1405 16.5837 18.106 16.9241 18.0435C17.1922 17.9919 17.4505 18.1776 17.4999 18.4663C17.5251 18.5996 17.4964 18.7374 17.4201 18.8495C17.3438 18.9616 17.2262 19.0389 17.093 19.0644C16.6973 19.1426 16.2953 19.184 15.892 19.1882V19.1899ZM13.8952 21.3126C13.8516 21.3107 13.8083 21.3038 13.7663 21.2919C12.1868 20.8382 11.1538 20.2297 10.071 19.1263C8.68012 17.6929 7.91571 15.7851 7.91571 13.7432C7.91571 12.0726 9.28641 10.7113 10.9747 10.7113C12.6629 10.7113 14.034 12.0726 14.034 13.7432C14.034 14.8466 14.9579 15.7438 16.1 15.7438C17.2421 15.7438 18.1659 14.8466 18.1659 13.7432C18.1659 9.85536 14.9377 6.69974 10.9648 6.69974C8.14387 6.69974 5.56145 8.32911 4.39957 10.8557C4.01285 11.691 3.81348 12.6707 3.81348 13.7432C3.81348 14.5476 3.88266 15.816 4.47863 17.466C4.57832 17.7341 4.44899 18.0332 4.19074 18.126C4.12937 18.1494 4.06391 18.1601 3.99829 18.1575C3.93266 18.155 3.86824 18.1391 3.80888 18.1111C3.74952 18.083 3.69645 18.0432 3.65287 17.994C3.60928 17.9449 3.57607 17.8875 3.55524 17.8252C3.07599 16.5176 2.83048 15.1359 2.82992 13.7432C2.82992 12.5057 3.05852 11.3799 3.50539 10.4019C4.82668 7.52302 7.75672 5.65818 10.9648 5.65818C15.4842 5.65818 19.1593 9.27786 19.1593 13.7329C19.1593 15.4035 17.7886 16.7647 16.1 16.7647C14.4113 16.7647 13.0406 15.4035 13.0406 13.7329C13.041 12.6294 12.1172 11.7305 10.9751 11.7305C9.83297 11.7305 8.90914 12.6277 8.90914 13.7311C8.90914 15.4929 9.56485 17.1446 10.7667 18.3821C11.712 19.3515 12.6143 19.886 14.0147 20.2899C14.2828 20.3621 14.4319 20.6508 14.3623 20.919C14.3406 21.0278 14.2826 21.126 14.1977 21.1976C14.1128 21.2691 14.0062 21.3096 13.8952 21.3126Z" fill={MUTED} />
    </Svg>
  );
}

function SealCheckIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M19 9.09V6c0-.55-.45-1-1-1h-3.09L12.7 2.79a.996.996 0 0 0-1.41 0L9.08 5H5.99c-.55 0-1 .45-1 1v3.09L2.78 11.3a.996.996 0 0 0 0 1.41l2.21 2.21v3.09c0 .55.45 1 1 1h3.09l2.21 2.21c.2.2.45.29.71.29s.51-.1.71-.29l2.21-2.21h3.09c.55 0 1-.45 1-1v-3.09l2.21-2.21a.996.996 0 0 0 0-1.41L19 9.09Zm-1.71 4.71a1 1 0 0 0-.29.71v2.5h-2.5c-.27 0-.52.11-.71.29L12 19.09l-1.79-1.79a1 1 0 0 0-.71-.29H7v-2.5c0-.27-.11-.52-.29-.71l-1.79-1.79 1.79-1.79A1 1 0 0 0 7 9.51v-2.5h2.5c.27 0 .52-.11.71-.29L12 4.93l1.79 1.79c.19.19.44.29.71.29H17v2.5c0 .27.11.52.29.71l1.79 1.79z" fill={MUTED} />
      <Path d="m11 12.59-1.29-1.3-1.42 1.42 2.71 2.7 4.71-4.7-1.42-1.42z" fill={MUTED} />
    </Svg>
  );
}

function GiftIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path d="M11 4.46875V6.875H13.4063C13.8822 6.875 14.3474 6.73388 14.7431 6.46947C15.1388 6.20507 15.4472 5.82927 15.6293 5.38958C15.8115 4.9499 15.8591 4.46608 15.7663 3.99932C15.6734 3.53255 15.4442 3.1038 15.1077 2.76728C14.7712 2.43076 14.3425 2.20158 13.8757 2.10874C13.4089 2.01589 12.9251 2.06354 12.4854 2.24567C12.0457 2.42779 11.6699 2.7362 11.4055 3.13191C11.1411 3.52762 11 3.99284 11 4.46875ZM11 4.46875V6.875H8.59375C8.11784 6.875 7.65262 6.73388 7.25691 6.46947C6.8612 6.20507 6.55279 5.82927 6.37067 5.38958C6.18854 4.9499 6.14089 4.46608 6.23374 3.99932C6.32658 3.53255 6.55576 3.1038 6.89228 2.76728C7.2288 2.43076 7.65755 2.20158 8.12431 2.10874C8.59108 2.01589 9.0749 2.06354 9.51458 2.24567C9.95427 2.42779 10.3301 2.7362 10.5945 3.13191C10.8589 3.52762 11 3.99284 11 4.46875Z" stroke={MUTED} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" />
      <Path d="M17.875 6.875H4.125C3.36561 6.875 2.75 7.49061 2.75 8.25V10.3125C2.75 11.0719 3.36561 11.6875 4.125 11.6875H17.875C18.6344 11.6875 19.25 11.0719 19.25 10.3125V8.25C19.25 7.49061 18.6344 6.875 17.875 6.875Z" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17.875 11.6875V17.875C17.875 18.422 17.6577 18.9466 17.2709 19.3334C16.8841 19.7202 16.3595 19.9375 15.8125 19.9375H6.1875C5.64049 19.9375 5.11589 19.7202 4.72909 19.3334C4.3423 18.9466 4.125 18.422 4.125 17.875V11.6875M11 6.875V19.9375" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MoonIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path d="M6.875 5.84375C6.875 4.52805 7.06879 3.19645 7.5625 2.0625C4.2784 3.49207 2.0625 6.84578 2.0625 10.6562C2.0625 15.782 6.21801 19.9375 11.3438 19.9375C15.1542 19.9375 18.5079 17.7216 19.9375 14.4375C18.8036 14.9312 17.472 15.125 16.1562 15.125C11.0305 15.125 6.875 10.9695 6.875 5.84375Z" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TicketIcon() {
  return (
    <Svg width={22} height={18} viewBox="0 0 18 15" fill="none">
      <Path d="M11.75 0.75V2.58333M11.75 6.25V8.08333M11.75 11.75V13.5833M2.58333 0.75H15.4167C15.9029 0.75 16.3692 0.943154 16.713 1.28697C17.0568 1.63079 17.25 2.0971 17.25 2.58333V5.33333C16.7638 5.33333 16.2975 5.52649 15.9536 5.8703C15.6098 6.21412 15.4167 6.68044 15.4167 7.16667C15.4167 7.6529 15.6098 8.11921 15.9536 8.46303C16.2975 8.80685 16.7638 9 17.25 9V11.75C17.25 12.2362 17.0568 12.7025 16.713 13.0464C16.3692 13.3902 15.9029 13.5833 15.4167 13.5833H2.58333C2.0971 13.5833 1.63079 13.3902 1.28697 13.0464C0.943154 12.7025 0.75 12.2362 0.75 11.75V9C1.23623 9 1.70255 8.80685 2.04636 8.46303C2.39018 8.11921 2.58333 7.6529 2.58333 7.16667C2.58333 6.68044 2.39018 6.21412 2.04636 5.8703C1.70255 5.52649 1.23623 5.33333 0.75 5.33333V2.58333C0.75 2.0971 0.943154 1.63079 1.28697 1.28697C1.63079 0.943154 2.0971 0.75 2.58333 0.75" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BellMenuIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path d="M11 4a4 4 0 0 0-4 4v3l-2 2.5h12L15 11V8a4 4 0 0 0-4-4z" stroke={MUTED} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M9 13.5a2 2 0 0 0 4 0" stroke={MUTED} strokeWidth={1.5} />
    </Svg>
  );
}

function LogoutMenuIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path d="M14.5 7.5l4 4-4 4M18.5 11.5H9" stroke={RED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M11 18.5H5a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 5 3.5h6" stroke={RED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const SETTINGS_GROUP_1 = [
  { icon: <CalendarIcon />, label: "Personal Data", sub: "Name, address, email", route: "/profile/personal-data" },
  { icon: <SealCheckIcon />, label: "Identity Verification", sub: "KYC — verify your identity", route: "/kyc/upload-id" },
  { icon: <LockIcon />, label: "Security", sub: "Password & PIN", route: null },
  { icon: <LinkIcon />, label: "Link Account", sub: "Connect your accounts", route: null },
];

const SETTINGS_GROUP_2 = [
  { icon: <FingerprintIcon />, label: "Fingerprint", sub: "Biometric authentication", route: null },
  { icon: <MoonIcon />, label: "Dark Mode", sub: "Switch app appearance", route: null },
  { icon: <BellMenuIcon />, label: "Notifications", sub: "Manage alerts & sounds", route: "/profile/push-notifications" },
];

const SETTINGS_GROUP_3 = [
  { icon: <GiftIcon />, label: "Referral & Rewards", sub: "Invite friends, earn bonuses", route: null },
  { icon: <TicketIcon />, label: "Vouchers", sub: "Promo codes & offers", route: null },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;

  // Auth state
  const { user, logout } = useAuth();

  // API state — populated from auth context and wallet API
  const [userName, setUserName] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const { data: walletBalanceData } = useWalletBalance();
  const walletBalance = Number(
    walletBalanceData?.availableBalance || walletBalanceData?.balance || 0,
  );
  const pendingBalance = Number(walletBalanceData?.reservedBalance || 0);

  useEffect(() => {
    if (user) {
      setUserName(`${user.firstName} ${user.lastName}`);
      setUserPhone(user.phone);
      setIsVerified(user.kycStatus === 'APPROVED');
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const walletBalanceDisplay = walletBalance.toLocaleString("en-MW", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pendingBalanceDisplay = pendingBalance.toLocaleString("en-MW", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Account</Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push("/profile/personal-data" as any)}
        >
          <EditIcon />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Card (Design 48: rect x=24 y=116 w=327 h=185) ── */}
        <View style={styles.profileCard}>
          {/* Avatar + text row */}
          <View style={styles.profileHeaderRow}>
            <View style={styles.avatarCircle}>
              <Image
                source={require("../../attached_assets/Designer_1784289079544.png")}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.profileTextBlock}>
              <Text style={styles.profileName}>{userName ?? "—"}</Text>
              <Text style={styles.profilePhone}>{userPhone ?? "—"}</Text>
              {!isVerified && (
                <TouchableOpacity
                  style={styles.unverifiedChip}
                  onPress={() => router.push("/kyc/upload-id" as any)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.unverifiedText}>⚠ Verify Now</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Cash card (Design 48: rect x=45 y=212 w=286 h=69 fill=#164951) */}
          <TouchableOpacity
            style={styles.cashCard}
            onPress={() => router.push("/(tabs)/portfolio" as any)}
            activeOpacity={0.85}
          >
            {/* Decorative circles from SVG */}
            <Svg style={StyleSheet.absoluteFill} width="100%" height={69}>
              <Circle cx={252} cy={-22} r={70} stroke="#45B369" strokeWidth={1} strokeOpacity={0.5} fill="none" />
              <Circle cx={232} cy={62} r={50} stroke="#739297" strokeWidth={1} strokeOpacity={0.4} fill="none" />
              <Circle cx={274} cy={78} r={44} stroke="#FFD84A" strokeWidth={0.8} strokeOpacity={0.5} fill="none" />
            </Svg>

            <View style={styles.cashTextBlock}>
              <Text style={styles.cashLabel}>Cash Balance</Text>
              <Text style={styles.cashAmount}>MK {walletBalanceDisplay}</Text>
            </View>

            {/* Right arrow button (Design 48: rect x=291 y=220 w=32 h=53) */}
            <View style={styles.cashArrow}>
              <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                <Path d="M5 3l4 4-4 4" stroke={WHITE} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Settings Group 1 (Design 48: rect x=24 y=317 w=327 h=162) ── */}
        <View style={styles.settingsGroup}>
          {SETTINGS_GROUP_1.map((item, i) => (
            <View key={item.label}>
              <TouchableOpacity
                style={styles.settingsRow}
                onPress={() => item.route && router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <View style={styles.rowIconWrap}>{item.icon}</View>
                <View style={styles.rowTextBlock}>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Text style={styles.rowSub}>{item.sub}</Text>
                </View>
                <ChevronRight />
              </TouchableOpacity>
              {i < SETTINGS_GROUP_1.length - 1 && <View style={styles.rowDivider} />}
            </View>
          ))}
        </View>

        {/* ── Settings Group 2 (Design 48: rect x=24 y=495 w=327 h=108) ── */}
        <View style={styles.settingsGroup}>
          {SETTINGS_GROUP_2.map((item, i) => (
            <View key={item.label}>
              <TouchableOpacity
                style={styles.settingsRow}
                onPress={() => item.route && router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <View style={styles.rowIconWrap}>{item.icon}</View>
                <View style={styles.rowTextBlock}>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Text style={styles.rowSub}>{item.sub}</Text>
                </View>
                <ChevronRight />
              </TouchableOpacity>
              {i < SETTINGS_GROUP_2.length - 1 && <View style={styles.rowDivider} />}
            </View>
          ))}
        </View>

        {/* ── Settings Group 3 — Perks ── */}
        <View style={styles.settingsGroup}>
          {SETTINGS_GROUP_3.map((item, i) => (
            <View key={item.label}>
              <TouchableOpacity
                style={styles.settingsRow}
                onPress={() => item.route && router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <View style={styles.rowIconWrap}>{item.icon}</View>
                <View style={styles.rowTextBlock}>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Text style={styles.rowSub}>{item.sub}</Text>
                </View>
                <ChevronRight />
              </TouchableOpacity>
              {i < SETTINGS_GROUP_3.length - 1 && <View style={styles.rowDivider} />}
            </View>
          ))}
        </View>

        {/* Notification list shortcut */}
        <TouchableOpacity
          style={styles.settingsGroup}
          onPress={() => router.push("/profile/notifications" as any)}
          activeOpacity={0.7}
        >
          <View style={styles.settingsRow}>
            <View style={styles.rowIconWrap}><BellMenuIcon /></View>
            <View style={styles.rowTextBlock}>
              <Text style={styles.rowLabel}>Notification Center</Text>
              <Text style={styles.rowSub}>Recent activity & alerts</Text>
            </View>
            <ChevronRight />
          </View>
        </TouchableOpacity>

        {/* Log out */}
        <TouchableOpacity
          style={styles.logoutRow}
          activeOpacity={0.75}
          onPress={() => {
            Alert.alert(
              "Log Out",
              "Are you sure you want to log out?",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Log Out", style: "destructive", onPress: handleLogout },
              ],
            );
          }}
        >
          <LogoutMenuIcon />
          <Text style={styles.logoutLabel}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WHITE },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: DARK,
  },
  editBtn: {
    width: 40,
    height: 40,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 100,
    gap: 12,
  },
  /* Profile card */
  profileCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    overflow: "hidden",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 20,
  },
  profileHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GREEN_AVATAR,
    overflow: "hidden",
  },
  avatarImage: {
    width: 56,
    height: 56,
  },
  profileTextBlock: { flex: 1 },
  profileName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: DARK,
    marginBottom: 2,
  },
  profilePhone: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 6,
  },
  verifiedChip: {
    alignSelf: "flex-start",
    backgroundColor: "#D1FADF",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  verifiedText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: "#166534",
  },
  unverifiedChip: {
    alignSelf: "flex-start",
    backgroundColor: "#FEF3C7",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  unverifiedText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: "#92400E",
  },
  /* Cash card */
  cashCard: {
    backgroundColor: TEAL,
    borderRadius: 10,
    height: 69,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 18,
    paddingRight: 10,
    overflow: "hidden",
    position: "relative",
  },
  cashTextBlock: { flex: 1 },
  cashLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
    marginBottom: 2,
  },
  cashAmount: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: WHITE,
    marginBottom: 1,
  },
  cashSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
  },
  cashArrow: {
    width: 32,
    height: 52,
    backgroundColor: "rgba(45,91,98,0.45)",
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  /* Settings groups */
  settingsGroup: {
    backgroundColor: "#F2F3F5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAEBEE",
    overflow: "hidden",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  rowIconWrap: { width: 24, alignItems: "center" },
  rowTextBlock: { flex: 1 },
  rowLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: DARK,
    marginBottom: 2,
  },
  rowSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: MUTED,
  },
  rowDivider: { height: 1, backgroundColor: "#D4D6DA", marginHorizontal: 16 },
  /* Logout */
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    backgroundColor: "#FFF1F2",
    borderRadius: 12,
    paddingVertical: 15,
  },
  logoutLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: RED,
  },
});

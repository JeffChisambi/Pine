import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  Modal,
  Animated,
  Dimensions,
} from "react-native";

const SCREEN_H = Dimensions.get("window").height;
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path, Circle, Line, Defs, ClipPath, Rect } from "react-native-svg";
import { getStockLogo } from "../../utils/stock-logos";

const TEAL = "#164951";
const GREEN = "#45B369";
const RED = "#EF4770";
const WHITE = "#FFFFFF";
const DARK = "#111827";
const MUTED = "#9CA3AF";
const CARD_BG = "#F9FAFB";
const CARD_BORDER = "#F3F4F6";
const DIVIDER = "#EBECEF";

import { useStocks } from "../../hooks/useStocks";



function ArrowCircle({ positive }: { positive: boolean }) {
  const color = positive ? GREEN : RED;
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Circle cx={9} cy={9} r={9} fill={color} />
      {positive ? (
        <Path d="M5.5 10.5L9 7L12.5 10.5" stroke={WHITE} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <Path d="M5.5 7.5L9 11L12.5 7.5" stroke={WHITE} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      )}
    </Svg>
  );
}

function SearchIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={7.5} stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16.5 16.5L20.5 20.5" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BellIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12.02 2.91C8.71 2.91 6.02 5.6 6.02 8.91V11.8C6.02 12.41 5.76 13.34 5.45 13.86L4.3 15.77C3.59 16.95 4.08 18.26 5.38 18.7C9.69 20.14 14.34 20.14 18.65 18.7C19.86 18.3 20.39 16.87 19.73 15.77L18.58 13.86C18.28 13.34 18.02 12.41 18.02 11.8V8.91C18.02 5.61 15.32 2.91 12.02 2.91Z" stroke={DARK} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" />
      <Path d="M13.87 3.2C13.56 3.11 13.24 3.04 12.91 3C11.95 2.88 11.03 2.95 10.17 3.2C10.46 2.46 11.18 1.94 12.02 1.94C12.86 1.94 13.58 2.46 13.87 3.2Z" stroke={DARK} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15.02 19.06C15.02 20.71 13.67 22.06 12.02 22.06C11.2 22.06 10.44 21.72 9.9 21.18C9.36 20.64 9.02 19.88 9.02 19.06" stroke={DARK} strokeWidth={1.5} strokeMiterlimit={10} />
    </Svg>
  );
}

function FilterIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M22 6.5H16" stroke={DARK} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 6.5H2" stroke={DARK} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 10C11.933 10 13.5 8.433 13.5 6.5C13.5 4.567 11.933 3 10 3C8.067 3 6.5 4.567 6.5 6.5C6.5 8.433 8.067 10 10 10Z" stroke={DARK} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 17.5H18" stroke={DARK} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 17.5H2" stroke={DARK} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 21C15.933 21 17.5 19.433 17.5 17.5C17.5 15.567 15.933 14 14 14C12.067 14 10.5 15.567 10.5 17.5C10.5 19.433 12.067 21 14 21Z" stroke={DARK} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StockLogo({ symbol }: { symbol: string }) {
  const logo = getStockLogo(symbol);
  if (logo) {
    return (
      <View style={styles.logoCircle}>
        <Image source={logo} style={styles.logoImage} resizeMode="contain" />
      </View>
    );
  }
  const colors = ["#164951", "#1A3A6B", "#166534", "#7C3AED", "#B45309", "#BE185D"];
  const bg = colors[symbol.charCodeAt(0) % colors.length];
  return (
    <View style={[styles.logoCircle, { backgroundColor: bg }]}>
      <Text style={{ color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 11 }}>
        {symbol.slice(0, 3)}
      </Text>
    </View>
  );
}

// Sparkline paths normalized from the SVG card design (viewBox 0 0 88 52)
// Reference midline sits at y=26. Higher y = lower on chart.
const SPARKLINES_UP = [
  "M0.5 25 L5 17 L7 20 L10 13 L15 8 L17 37 L19 31 H30 L33 21 L35 23 L37 15 L40 18 L44 19 L47 28 L51 0 L52 9 L55 12 L56 21 L58 16 H63 L64 33 L66 36 L68 52 L70 44 L72 42 L73 36 L76 34 L77 28 L80 27 L82 19 L84 22 H88",
  "M0 30 L8 25 L15 28 L20 20 L28 15 L35 18 L40 10 L47 15 L54 8 L58 5 L65 12 L70 8 L76 18 L82 12 L88 8",
];
const SPARKLINES_DOWN = [
  "M0 10 L8 15 L15 12 L20 22 L28 28 L35 25 L40 35 L47 30 L54 40 L58 45 L65 38 L70 44 L76 36 L82 42 L88 48",
  "M0 5 L8 12 L15 10 L20 18 L28 25 L35 22 L40 30 L44 24 L50 35 L58 42 L65 38 L70 45 L76 40 L82 46 L88 52",
];

function MiniSparkline({ positive, idx }: { positive: boolean; idx: number }) {
  const paths = positive ? SPARKLINES_UP : SPARKLINES_DOWN;
  const path = paths[idx % paths.length];
  const topId = `clip-top-${idx}`;
  const botId = `clip-bot-${idx}`;
  return (
    <Svg width={88} height={52} viewBox="0 0 88 52" fill="none">
      <Defs>
        {/* Upper half — above the midline */}
        <ClipPath id={topId}>
          <Rect x="0" y="0" width="88" height="26" />
        </ClipPath>
        {/* Lower half — below the midline */}
        <ClipPath id={botId}>
          <Rect x="0" y="26" width="88" height="26" />
        </ClipPath>
      </Defs>

      {/* Dashed midline */}
      <Line x1="0" y1="26" x2="88" y2="26" stroke="#D1D5DB" strokeWidth={1} strokeDasharray="3 3" strokeLinecap="round" />

      {/* Above midline → green */}
      <Path d={path} stroke={GREEN} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" clipPath={`url(#${topId})`} />
      {/* Below midline → red */}
      <Path d={path} stroke={RED} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" clipPath={`url(#${botId})`} />
    </Svg>
  );
}

// ─── Sector icons ────────────────────────────────────────────────────────────
const ICON_COLOR = "#164951";
const SECTOR_ICON_BG = "#DFE9EB";

function SectorBankIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="m21.49 7.13-9-5a.99.99 0 0 0-.97 0l-9.01 5C2.19 7.31 2 7.64 2 8v3c0 .55.45 1 1 1h2v4H3c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h18c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1h-2v-4h2c.55 0 1-.45 1-1V8a1 1 0 0 0-.51-.87M7 12h2v4H7zm6 0v4h-2v-4zm7 6v2H4v-2zm-3-2h-2v-4h2zm3-6H4V8.59l8-4.44 8 4.44z" fill={ICON_COLOR} />
      <Path d="M12 6a1.5 1.5 0 1 0 0 3 1.5 1.5 0 1 0 0-3" fill={ICON_COLOR} />
    </Svg>
  );
}

function SectorInvestmentIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M20 7h-3V3c0-.33-.16-.64-.43-.82a.98.98 0 0 0-.92-.11L3.28 6.82C2.51 7.11 2 7.87 2 8.69V20c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2m-5-2.54V7H8.39zM4 20V9h16v2h-5c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h5v2zm16-4h-5v-3h5z" fill={ICON_COLOR} />
    </Svg>
  );
}

function SectorAgricultureIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M20 8.55V8.5a4.5 4.5 0 0 0-4.27-4.49C14.9 2.77 13.5 2 12 2s-2.91.77-3.73 2.01A4.51 4.51 0 0 0 4 8.5v.05c-1.22.7-2 2.01-2 3.45 0 2.41 2.15 4.37 4.62 3.95.19.16.4.3.61.42 3.65 2.84 3.76 5.53 3.76 5.64h2c0-.11.11-2.79 3.73-5.61.23-.13.44-.28.65-.45 2.48.42 4.62-1.53 4.62-3.95 0-1.44-.78-2.75-2-3.45Zm-9.37 8.28c.49-.12.95-.31 1.37-.59.42.28.88.48 1.36.6-.59.69-1.03 1.35-1.36 1.96-.33-.61-.78-1.28-1.37-1.97M18 14c-.19 0-.38-.03-.61-.11-.37-.12-.78-.01-1.05.28-.95 1.05-2.66 1.07-3.63.07-.19-.19-.45-.3-.71-.3s-.53.11-.71.3c-.97.99-2.68.97-3.63-.07-.26-.29-.67-.4-1.05-.28-.23.08-.42.11-.61.11-1.1 0-2-.9-2-2 0-.86.55-1.62 1.38-1.89.48-.16.76-.65.67-1.14C6.02 8.82 6 8.66 6 8.5c0-1.37 1.11-2.49 2.56-2.49h.02l.16.02c.43.04.82-.19 1-.57.41-.88 1.3-1.45 2.26-1.45s1.85.57 2.26 1.45c.18.38.57.61 1 .57L15.5 6A2.5 2.5 0 0 1 18 8.5c0 .16-.02.32-.05.47-.1.49.19.98.67 1.14.83.27 1.38 1.03 1.38 1.89 0 1.1-.9 2-2 2" fill={ICON_COLOR} />
    </Svg>
  );
}

function SectorRealEstateIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M22 21.25H21V9.98C21 9.36 20.72 8.78 20.23 8.4L19 7.44L18.98 4.99C18.98 4.44 18.53 4 17.98 4H14.57L13.23 2.96C12.51 2.39 11.49 2.39 10.77 2.96L3.77 8.4C3.28 8.78 3 9.36 3 9.97L2.95 21.25H2C1.59 21.25 1.25 21.59 1.25 22C1.25 22.41 1.59 22.75 2 22.75H22C22.41 22.75 22.75 22.41 22.75 22C22.75 21.59 22.41 21.25 22 21.25ZM6.5 12.75V11.25C6.5 10.7 6.95 10.25 7.5 10.25H9.5C10.05 10.25 10.5 10.7 10.5 11.25V12.75C10.5 13.3 10.05 13.75 9.5 13.75H7.5C6.95 13.75 6.5 13.3 6.5 12.75ZM14.5 21.25H9.5V18.5C9.5 17.67 10.17 17 11 17H13C13.83 17 14.5 17.67 14.5 18.5V21.25ZM17.5 12.75C17.5 13.3 17.05 13.75 16.5 13.75H14.5C13.95 13.75 13.5 13.3 13.5 12.75V11.25C13.5 10.7 13.95 10.25 14.5 10.25H16.5C17.05 10.25 17.5 10.7 17.5 11.25V12.75Z" fill={ICON_COLOR} />
    </Svg>
  );
}

function SectorTravelIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M20.05 10.63L15.38 8.62L14.34 8.18C14.18 8.1 14.04 7.89 14.04 7.71V4.65C14.04 3.69 13.33 2.55 12.47 2.11C12.17 1.96 11.81 1.96 11.51 2.11C10.66 2.55 9.95 3.7 9.95 4.66V7.72C9.95 7.9 9.81 8.11 9.65 8.19L3.95 10.64C3.32 10.9 2.81 11.69 2.81 12.37V13.69C2.81 14.54 3.45 14.96 4.24 14.62L9.25 12.46C9.64 12.29 9.96 12.5 9.96 12.93V15.84C9.96 16.07 9.83 16.4 9.67 16.56L7.35 18.89C7.11 19.13 7 19.6 7.11 19.94L7.56 21.3C7.74 21.89 8.41 22.17 8.96 21.89L11.34 19.89C11.7 19.58 12.29 19.58 12.65 19.89L15.03 21.89C15.58 22.16 16.25 21.89 16.45 21.3L16.9 19.94C17.01 19.61 16.9 19.13 16.66 18.89L14.34 16.56C14.17 16.4 14.04 16.07 14.04 15.84V12.93C14.04 12.5 14.35 12.3 14.75 12.46L19.76 14.62C20.55 14.96 21.19 14.54 21.19 13.69V12.37C21.19 11.69 20.68 10.9 20.05 10.63Z" fill={ICON_COLOR} />
    </Svg>
  );
}

function SectorHealthIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M21.31 7.94C21.17 7.8 21.01 7.69 20.83 7.61C20.64 7.54 20.45 7.5 20.25 7.5H17.25V6.75C17.25 5.36 16.7 4.02 15.71 3.04C14.73 2.05 13.39 1.5 12 1.5C10.61 1.5 9.27 2.05 8.29 3.04C7.3 4.02 6.75 5.36 6.75 6.75V7.5H3.75C3.35 7.5 2.97 7.66 2.69 7.94C2.41 8.22 2.25 8.6 2.25 9V19.13C2.25 20.95 3.8 22.5 5.63 22.5H18.38C19.26 22.5 20.11 22.15 20.74 21.54C21.06 21.23 21.31 20.87 21.49 20.46C21.66 20.06 21.75 19.62 21.75 19.18V9C21.75 8.8 21.71 8.61 21.64 8.43C21.56 8.24 21.45 8.08 21.31 7.94ZM15 15.75H12.75V18C12.75 18.2 12.67 18.39 12.53 18.53C12.39 18.67 12.2 18.75 12 18.75C11.8 18.75 11.61 18.67 11.47 18.53C11.33 18.39 11.25 18.2 11.25 18V15.75H9C8.8 15.75 8.61 15.67 8.47 15.53C8.33 15.39 8.25 15.2 8.25 15C8.25 14.8 8.33 14.61 8.47 14.47C8.61 14.33 8.8 14.25 9 14.25H11.25V12C11.25 11.8 11.33 11.61 11.47 11.47C11.61 11.33 11.8 11.25 12 11.25C12.2 11.25 12.39 11.33 12.53 11.47C12.67 11.61 12.75 11.8 12.75 12V14.25H15C15.2 14.25 15.39 14.33 15.53 14.47C15.67 14.61 15.75 14.8 15.75 15C15.75 15.2 15.67 15.39 15.53 15.53C15.39 15.67 15.2 15.75 15 15.75ZM15.75 7.5H8.25V6.75C8.25 5.76 8.65 4.8 9.35 4.1C10.05 3.4 11.01 3 12 3C12.99 3 13.95 3.4 14.65 4.1C15.35 4.8 15.75 5.76 15.75 6.75V7.5Z" fill={ICON_COLOR} />
    </Svg>
  );
}

function SectorTechIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M13.98 7.75H10.01C8.76 7.75 7.74 8.76 7.74 10.02V13.99C7.74 15.24 8.75 16.26 10.01 16.26H13.98C15.23 16.26 16.25 15.25 16.25 13.99V10.02C16.25 8.76 15.24 7.75 13.98 7.75ZM13.5 12.98L12.61 14.53C12.48 14.76 12.24 14.88 12 14.88C11.88 14.88 11.75 14.85 11.65 14.79C11.31 14.6 11.19 14.17 11.39 13.83L12.03 12.72H11.47C11.02 12.72 10.65 12.52 10.45 12.18C10.25 11.84 10.27 11.42 10.5 11.03L11.39 9.48C11.59 9.14 12.02 9.03 12.35 9.22C12.69 9.41 12.81 9.84 12.61 10.18L11.97 11.29H12.53C12.98 11.29 13.35 11.49 13.55 11.83C13.75 12.17 13.73 12.59 13.5 12.98Z" fill={ICON_COLOR} />
      <Path d="M21.25 12.75C21.67 12.75 22 12.41 22 12C22 11.58 21.67 11.25 21.25 11.25H20V9.05H21.25C21.67 9.05 22 8.72 22 8.3C22 7.89 21.67 7.55 21.25 7.55H19.77C19.29 5.96 18.04 4.71 16.45 4.23V2.75C16.45 2.34 16.11 2 15.7 2C15.29 2 14.95 2.34 14.95 2.75V4H12.75V2.75C12.75 2.34 12.41 2 12 2C11.59 2 11.25 2.34 11.25 2.75V4H9.06V2.75C9.06 2.34 8.72 2 8.31 2C7.89 2 7.56 2.34 7.56 2.75V4.23C5.96 4.71 4.71 5.96 4.23 7.55H2.75C2.34 7.55 2 7.89 2 8.3C2 8.72 2.34 9.05 2.75 9.05H4V11.25H2.75C2.34 11.25 2 11.58 2 12C2 12.41 2.34 12.75 2.75 12.75H4V14.95H2.75C2.34 14.95 2 15.28 2 15.7C2 16.11 2.34 16.45 2.75 16.45H4.23C4.7 18.04 5.96 19.29 7.56 19.77V21.25C7.56 21.66 7.89 22 8.31 22C8.72 22 9.06 21.66 9.06 21.25V20H11.26V21.25C11.26 21.66 11.59 22 12.01 22C12.42 22 12.76 21.66 12.76 21.25V20H14.95V21.25C14.95 21.66 15.29 22 15.7 22C16.11 22 16.45 21.66 16.45 21.25V19.77C18.04 19.29 19.29 18.04 19.77 16.45H21.25C21.67 16.45 22 16.11 22 15.7C22 15.28 21.67 14.95 21.25 14.95H20V12.75H21.25ZM17.26 14.26C17.26 15.91 15.91 17.26 14.26 17.26H9.74C8.09 17.26 6.74 15.91 6.74 14.26V9.74C6.74 8.09 8.09 6.74 9.74 6.74H14.26C15.91 6.74 17.26 8.09 17.26 9.74V14.26Z" fill={ICON_COLOR} />
    </Svg>
  );
}

function SectorEnergyIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M17.91 10.72H14.82V3.52C14.82 1.84 13.91 1.5 12.8 2.76L12 3.67L5.23 11.37C4.3 12.42 4.69 13.28 6.09 13.28H9.18V20.48C9.18 22.16 10.09 22.5 11.2 21.24L12 20.33L18.77 12.63C19.7 11.58 19.31 10.72 17.91 10.72Z" fill={ICON_COLOR} />
    </Svg>
  );
}

function SectorFinanceIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M22 10.97V13.03C22 13.58 21.56 14.03 21 14.05H19.04C17.96 14.05 16.97 13.26 16.88 12.18C16.82 11.55 17.06 10.96 17.48 10.55C17.85 10.17 18.36 9.95 18.92 9.95H21C21.56 9.97 22 10.42 22 10.97Z" fill={ICON_COLOR} />
      <Path d="M20.47 15.55H19.04C17.14 15.55 15.54 14.12 15.38 12.3C15.29 11.26 15.67 10.22 16.43 9.48C17.07 8.82 17.96 8.45 18.92 8.45H20.47C20.76 8.45 21 8.21 20.97 7.92C20.75 5.49 19.14 3.83 16.75 3.55C16.51 3.51 16.26 3.5 16 3.5H7C6.72 3.5 6.45 3.52 6.19 3.56C3.64 3.88 2 5.78 2 8.5V15.5C2 18.26 4.24 20.5 7 20.5H16C18.8 20.5 20.73 18.75 20.97 16.08C21 15.79 20.76 15.55 20.47 15.55ZM13 9.75H7C6.59 9.75 6.25 9.41 6.25 9C6.25 8.59 6.59 8.25 7 8.25H13C13.41 8.25 13.75 8.59 13.75 9C13.75 9.41 13.41 9.75 13 9.75Z" fill={ICON_COLOR} />
    </Svg>
  );
}

// Primary 4 shown in the scroll; all 9 shown in the modal
const SECTORS = [
  { key: "Agriculture",  label: "Agriculture", icon: <SectorAgricultureIcon /> },
  { key: "Banks",        label: "Banks",       icon: <SectorBankIcon /> },
  { key: "Real Estate",  label: "Real Estate", icon: <SectorRealEstateIcon /> },
  { key: "Investment",   label: "Investment",  icon: <SectorInvestmentIcon /> },
  { key: "Technology",   label: "Tech",        icon: <SectorTechIcon /> },
  { key: "Energy",       label: "Energy",      icon: <SectorEnergyIcon /> },
  { key: "Finance",      label: "Finance",     icon: <SectorFinanceIcon /> },
  { key: "Travel",       label: "Travel",      icon: <SectorTravelIcon /> },
  { key: "Health",       label: "Health",      icon: <SectorHealthIcon /> },
];
const PRIMARY_SECTORS = SECTORS.slice(0, 4);

// ─── Sectors Modal (full 3-col grid, custom animated) ───────────────────────
function SectorsModal({
  visible,
  onClose,
  getSectorChange,
}: {
  visible: boolean;
  onClose: () => void;
  getSectorChange: (key: string) => number | null;
}) {
  const [mounted, setMounted] = useState(false);
  const slideY  = useRef(new Animated.Value(SCREEN_H)).current;
  const fadeOvl = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.spring(slideY, {
          toValue: 0,
          damping: 28,
          stiffness: 280,
          mass: 0.8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeOvl, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY, {
          toValue: SCREEN_H,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(fadeOvl, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        {/* Dimmed overlay — absolute so it never sits behind the sheet corners */}
        <Animated.View
          style={[StyleSheet.absoluteFillObject, sectorModal.overlay, { opacity: fadeOvl }]}
          pointerEvents={visible ? "auto" : "none"}
        >
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        </Animated.View>

        {/* Sliding sheet */}
        <Animated.View
          style={[sectorModal.sheet, { transform: [{ translateY: slideY }] }]}
        >
        {/* Handle */}
        <View style={sectorModal.handle} />

        {/* Title row */}
        <View style={sectorModal.titleRow}>
          <Text style={sectorModal.title}>Stock Sectors</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={sectorModal.closeBtn}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Line x1="18" y1="6" x2="6" y2="18" stroke={DARK} strokeWidth={2.2} strokeLinecap="round"/>
              <Line x1="6" y1="6" x2="18" y2="18" stroke={DARK} strokeWidth={2.2} strokeLinecap="round"/>
            </Svg>
          </TouchableOpacity>
        </View>

        {/* 3-col grid */}
        <View style={sectorModal.grid}>
          {SECTORS.map((sector) => {
            const pct = getSectorChange(sector.key);
            const positive = pct !== null && pct >= 0;
            return (
              <TouchableOpacity
                key={sector.key}
                activeOpacity={0.75}
                style={sectorModal.cell}
              >
                <View style={sectorModal.circle}>{sector.icon}</View>
                <Text style={sectorModal.label}>{sector.label}</Text>
                <Text style={[sectorModal.pct, { color: pct === null ? MUTED : positive ? GREEN : RED }]}>
                  {pct === null ? "—" : `${positive ? "+" : ""}${pct.toFixed(2)}%`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 32 }} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const sectorModal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 14,
    // shadow so it floats above the dimmed content
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 24,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: DARK,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 0,
  },
  cell: {
    width: "33.33%",
    alignItems: "center",
    paddingBottom: 28,
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: SECTOR_ICON_BG,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  label: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: DARK,
    textAlign: "center",
    marginBottom: 3,
  },
  pct: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    textAlign: "center",
  },
});

function StockLogoSmall({ symbol }: { symbol: string }) {
  const logo = getStockLogo(symbol);
  if (logo) {
    return (
      <View style={styles.logoCircleSmall}>
        <Image source={logo} style={{ width: 28, height: 28, borderRadius: 14 }} resizeMode="contain" />
      </View>
    );
  }
  const colors = ["#164951", "#1A3A6B", "#166534", "#7C3AED", "#B45309", "#BE185D"];
  const bg = colors[symbol.charCodeAt(0) % colors.length];
  return (
    <View style={[styles.logoCircleSmall, { backgroundColor: bg, justifyContent: "center", alignItems: "center" }]}>
      <Text style={{ color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 9 }}>
        {symbol.slice(0, 3)}
      </Text>
    </View>
  );
}

export default function MarketScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 44;
  const [searchText, setSearchText] = useState("");
  const [showSectors, setShowSectors] = useState(false);

  const { data: stocks = [], isLoading, error, refetch, isRefetching } = useStocks();

  // Stock Features: representative sample of stocks for the featured cards
  const stockFeatures = stocks.slice(0, 6);

  // All stocks list
  const allStocks = stocks;

  // Sector average % change — group live stocks by sector (case-insensitive)
  const sectorStats = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    stocks.forEach((s) => {
      const key = (s.sector ?? "").toLowerCase();
      if (!map[key]) map[key] = { total: 0, count: 0 };
      map[key].total += s.changePct;
      map[key].count += 1;
    });
    return map;
  }, [stocks]);

  const getSectorChange = (key: string) => {
    const entry = sectorStats[key.toLowerCase()];
    if (!entry || entry.count === 0) return null;
    return entry.total / entry.count;
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: topPad }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Market</Text>
      </View>

      {/* Search bar */}
      <TouchableOpacity
        style={styles.searchBar}
        activeOpacity={0.8}
        onPress={() => router.push("/stock-search")}
      >
        <SearchIcon />
        <Text style={styles.searchPlaceholder}>Search stocks, ETFs…</Text>
      </TouchableOpacity>

      {/* Stock Features cards */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Stock Features</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.indicesScroll}>
        {isLoading ? (
          <View style={{ width: 300, paddingVertical: 24, alignItems: "center" }}>
            <Text style={{ color: MUTED, fontFamily: "Poppins_400Regular" }}>Loading market data…</Text>
          </View>
        ) : error ? (
          <View style={{ width: 300, paddingVertical: 24, alignItems: "center" }}>
            <Text style={{ color: RED, fontFamily: "Poppins_400Regular" }}>Could not load prices</Text>
          </View>
        ) : stockFeatures.length === 0 ? (
          <View style={{ width: 300, paddingVertical: 24, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: MUTED, fontFamily: "Poppins_400Regular", fontSize: 13 }}>
              No stocks available
            </Text>
          </View>
        ) : (
          stockFeatures.map((s, idx) => (
            <TouchableOpacity
              key={s.id}
              style={styles.featureCard}
              onPress={() => router.push(`/stock/${s.symbol}` as any)}
              activeOpacity={0.85}
            >
              {/* Top: logo + symbol + name */}
              <View style={styles.featureCardTop}>
                <StockLogoSmall symbol={s.symbol} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.featureSymbol}>{s.symbol}</Text>
                  <Text style={styles.featureName} numberOfLines={1}>{s.name}</Text>
                </View>
              </View>

              {/* Bottom: price + change (left) · sparkline (right) */}
              <View style={styles.featureCardBottom}>
                <View style={styles.featureCardLeft}>
                  <Text style={styles.featurePrice}>{s.price}</Text>
                  <View style={styles.featureChangeRow}>
                    <ArrowCircle positive={s.positive} />
                    <Text style={[styles.featureChange, { color: s.positive ? GREEN : RED }]}>
                      {s.changePct > 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                    </Text>
                  </View>
                </View>
                <MiniSparkline positive={s.positive} idx={idx} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* ── Sector Stocks ── */}
      <SectorsModal
        visible={showSectors}
        onClose={() => setShowSectors(false)}
        getSectorChange={getSectorChange}
      />

      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Text style={styles.sectionTitle}>Sector Stocks</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => setShowSectors(true)}>
          <Text style={styles.sectionViewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectorScroll}>
        {PRIMARY_SECTORS.map((sector) => {
          const pct = getSectorChange(sector.key);
          const positive = pct !== null && pct >= 0;
          return (
            <TouchableOpacity key={sector.key} style={styles.sectorCard} activeOpacity={0.75}>
              <View style={styles.sectorIconCircle}>{sector.icon}</View>
              <Text style={styles.sectorLabel}>{sector.label}</Text>
              <Text style={[styles.sectorPct, { color: pct === null ? MUTED : positive ? GREEN : RED }]}>
                {pct === null ? "—" : `${positive ? "+" : ""}${pct.toFixed(2)}%`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* All Stocks list */}
      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Text style={styles.sectionTitle}>All Stocks</Text>
        {isRefetching && <Text style={{ color: MUTED, fontSize: 11, fontFamily: "Poppins_400Regular" }}>Refreshing…</Text>}
      </View>

      {isLoading ? (
        Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={[styles.stockRow, styles.stockRowBorder, { opacity: 0.4 }]}>
            <View style={[styles.logoCircle, { backgroundColor: CARD_BORDER }]} />
            <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
              <View style={{ height: 14, width: 60, backgroundColor: CARD_BORDER, borderRadius: 4 }} />
              <View style={{ height: 11, width: 120, backgroundColor: CARD_BORDER, borderRadius: 4 }} />
            </View>
            <View style={{ alignItems: "flex-end", gap: 6 }}>
              <View style={{ height: 14, width: 80, backgroundColor: CARD_BORDER, borderRadius: 4 }} />
              <View style={{ height: 11, width: 50, backgroundColor: CARD_BORDER, borderRadius: 4 }} />
            </View>
          </View>
        ))
      ) : error ? (
        <View style={{ paddingVertical: 48, alignItems: "center" }}>
          <Text style={{ color: RED, fontFamily: "Poppins_500Medium" }}>Backend unreachable</Text>
          <Text style={{ color: MUTED, fontFamily: "Poppins_400Regular", fontSize: 12, marginTop: 4 }}>Make sure the server is running</Text>
          <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: TEAL, borderRadius: 8 }}>
            <Text style={{ color: WHITE, fontFamily: "Poppins_600SemiBold" }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        allStocks.map((s, i) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.stockRow, i < allStocks.length - 1 && styles.stockRowBorder]}
            onPress={() => router.push(`/stock/${s.symbol}` as any)}
            activeOpacity={0.8}
          >
            <StockLogo symbol={s.symbol} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.stockTicker}>{s.symbol}</Text>
              <Text style={styles.stockName} numberOfLines={1}>{s.name}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.stockPrice}>{s.price}</Text>
              <Text style={[styles.stockChange, { color: s.positive ? GREEN : RED }]}>{s.change}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: DARK,
  },
  headerIcons: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: CARD_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    marginHorizontal: 24,
    height: 56,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
  },
  searchPlaceholder: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: MUTED,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: DARK,
  },
  sectionViewAll: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: MUTED,
  },

  /* Sector Stocks */
  sectorScroll: {
    paddingLeft: 24,
    paddingRight: 8,
    gap: 12,
  },
  sectorCard: {
    alignItems: "center",
    width: 80,
  },
  sectorIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: SECTOR_ICON_BG,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  sectorLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: DARK,
    textAlign: "center",
    marginBottom: 2,
  },
  sectorPct: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    textAlign: "center",
  },

  indicesScroll: {
    paddingLeft: 24,
    paddingRight: 8,
    gap: 12,
  },
  /* Feature card — matches SVG design (240×134) */
  featureCard: {
    width: 240,
    height: 134,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: "space-between",
  },
  featureCardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureSymbol: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: DARK,
  },
  featureName: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: MUTED,
    marginTop: 1,
  },
  featureCardBottom: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  featureCardLeft: {
    flex: 1,
  },
  featurePrice: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: DARK,
    marginBottom: 5,
  },
  featureChangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  featureChange: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },
  logoCircleSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 24,
    paddingVertical: 14,
  },
  stockRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  stockTicker: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: DARK,
  },
  stockName: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  stockPrice: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: DARK,
  },
  stockChange: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    marginTop: 2,
  },
});

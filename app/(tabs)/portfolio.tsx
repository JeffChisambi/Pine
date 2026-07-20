import React, { useState, useEffect } from "react";
import { guardedPush } from "@/utils/navigation";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Dimensions,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { portfolioApi } from "../../services/api";
import { useWalletBalance } from "../../services/wallet-queries";
import { getStockLogo } from "../../utils/stock-logos";
import { useColors } from "@/hooks/useColors";
import { StockData } from "../data/stocks";

// ─── Static brand tokens ───────────────────────────────────────────────────────
const TEAL = "#164951";
const CARD_TEAL = "#2D5B62";
const GREEN = "#45B369";
const RED = "#EF4770";
const WHITE = "#FFFFFF";

const { width: SCREEN_W } = Dimensions.get("window");

interface Holding extends StockData {
  shares: string;
  value: string;
  changePct: string;
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      {hidden ? (
        <>
          <Path d="M2 2L20 20" stroke="rgba(255,255,255,0.7)" strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M8.5 5.1C9.3 4.9 10.1 4.8 11 4.8c5 0 9 6.2 9 6.2s-.8 1.2-2.1 2.5M13 16.6c-.6.2-1.3.4-2 .4-5 0-9-6.2-9-6.2s.7-1.1 1.9-2.3" stroke="rgba(255,255,255,0.7)" strokeWidth={1.8} strokeLinecap="round" />
          <Circle cx={11} cy={11} r={3} stroke="rgba(255,255,255,0.7)" strokeWidth={1.8} />
        </>
      ) : (
        <>
          <Path d="M2 11s3.6-6.2 9-6.2S20 11 20 11s-3.6 6.2-9 6.2S2 11 2 11z" stroke="rgba(255,255,255,0.7)" strokeWidth={1.8} strokeLinecap="round" />
          <Circle cx={11} cy={11} r={3} stroke="rgba(255,255,255,0.7)" strokeWidth={1.8} />
        </>
      )}
    </Svg>
  );
}

function BuyIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
      <Circle cx={14} cy={14} r={14} fill={CARD_TEAL} />
      <Path d="M14 9v10M9 14h10" stroke={WHITE} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function SellIcon() {
  return (
    <Svg width={41} height={41} viewBox="0 0 41 41" fill="none">
      <Circle cx={20.5} cy={20.5} r={20} fill="#164951" />
      <Path d="M18.7667 20.7666L20.9001 18.6333L23.0334 20.7666" stroke="#FFFFFF" strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20.9 27.1667V18.6917" stroke="#FFFFFF" strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M27.6667 20.3501C27.6667 16.6668 25.1667 13.6834 21 13.6834C16.8334 13.6834 14.3334 16.6668 14.3334 20.3501" stroke="#FFFFFF" strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PiggyIllustration() {
  return (
    <Svg width={131} height={135} viewBox="0 0 131 135" fill="none">
      <Path d="M21.7557 22.7836C25.7911 22.5092 35.6348 25.932 39.3182 28.0555C40.677 28.8389 43.3336 30.7765 44.6678 31.7865C44.7124 31.7652 44.7573 31.7443 44.8026 31.7242C47.9773 30.3077 54.7572 28.936 58.1662 28.5557C66.6053 27.6973 75.1285 28.8156 83.0606 31.8221C92.5699 35.437 101.799 42.4257 106.866 51.3266C107.562 52.5493 108.135 53.8549 108.712 55.1389C109.295 54.5028 109.788 54.0419 110.424 53.4582C108.827 52.171 108.012 51.5849 107.381 49.4527C105.841 44.2452 114.517 37.9341 116.33 44.9199C116.916 47.1767 115.517 49.8968 114.268 51.7758C115.245 51.6413 115.775 51.4747 116.674 51.2046C117.888 50.8401 119.903 49.4329 121.054 49.7273C121.392 50.0418 121.442 50.0858 121.607 50.531C121.608 51.685 120.09 52.2064 119.204 52.6722C117.165 53.7441 115.103 54.1508 112.815 54.1823C111.413 55.4015 111.192 56.3318 109.484 57.4962C111.08 60.6118 111.366 66.9351 111.09 70.4233C110.476 78.1797 105.593 87.9454 99.4129 92.968C98.7215 93.602 92.9459 98.1417 92.9321 98.1836C91.6671 102.236 94.0928 108.275 91.2893 111.834C89.9998 113.471 85.3171 113.249 83.3278 113.128C80.396 112.949 76.171 113.96 73.9146 111.855C72.3589 110.404 72.6568 107.588 72.6696 105.605C69.7949 106.633 58.7669 106.504 55.8091 105.593C55.8157 107.557 56.04 110.23 54.651 111.717C53.7792 112.673 52.5804 113.113 51.2892 113.103C47.2567 113.072 43.0881 113.35 39.0829 112.948C38.4298 112.804 37.6056 112.284 37.1437 111.833C35.5057 110.235 35.8378 107.165 35.8282 105.084C35.8181 102.91 35.8661 100.852 35.8087 98.721C35.1166 98.2034 34.1281 97.6531 33.368 97.1161C32.0039 96.1522 30.6667 95.0475 29.3734 94.0054C25.4635 90.8549 19.8073 83.7493 18.5709 78.8372C15.6898 78.7078 13.2991 79.4512 10.914 77.9208C10.7428 77.6276 10.5143 77.2501 10.4202 76.9279C10.1971 76.1642 10.0818 75.234 10.0734 74.4411C10.0424 71.5 10.0422 68.4626 10.0447 65.5364C10.0532 55.933 9.31129 55.8931 18.6067 56.0334C20.9573 49.4772 24.684 45.5812 29.3753 40.8341C28.275 35.9925 26.6882 32.1749 24.082 27.9425C23.2791 26.6386 21.9141 25.4983 21.3499 24.1317C21.173 23.7033 21.5234 23.188 21.7557 22.7836ZM84.8494 110.824C90.421 110.912 90.4053 110.78 90.3196 105.283C90.4219 102.727 90.0913 99.9479 90.4291 97.4398C90.581 96.3118 93.2198 95.0325 94.111 94.3861C102.658 88.1864 109.055 78.3013 109.017 67.4902C108.991 60.0124 105.742 52.5205 100.921 46.8789C91.3923 35.9609 76.8672 30.1388 62.4714 30.7182C58.3683 30.8832 54.4458 31.3183 50.429 32.2925C48.2947 32.6841 46.2958 33.8851 44.1928 34.194C43.8795 34.24 42.3443 32.9005 41.987 32.6236C37.9363 29.483 32.8911 27.3531 27.9249 26.1679C27.0909 25.9688 26.123 25.641 25.2972 25.5652C25.301 25.5877 25.3038 25.6103 25.3086 25.6326C25.4696 26.3934 26.5559 27.4362 26.9681 28.1889C28.1714 30.3865 32.6993 39.9413 31.475 41.936C30.6853 43.2227 29.127 44.3404 28.0598 45.416C25.3888 48.1271 23.2158 51.2872 21.6405 54.7517C19.4238 59.5466 20.3261 58.2755 15.1562 58.3235C14.3124 58.3313 13.0754 58.1021 12.5087 58.8063C12.1762 60.4342 12.106 74.6756 12.4844 76.0347C13.7385 77.1173 18.2389 76.0053 19.704 76.6446C20.1386 76.8342 20.9132 78.7287 21.1562 79.3065C22.9865 83.5755 25.3638 86.7997 28.5796 90.1255C31.5771 93.2254 34.3439 94.8454 37.7615 97.3607C38.6868 98.0418 37.6136 107.761 38.3339 109.253C38.7482 110.112 38.7719 110.206 39.5488 110.779C42.1207 110.862 44.9865 110.827 47.5362 110.841C52.8307 110.91 53.8769 111.362 53.4128 105.506C53.1891 102.681 55.0029 103.189 56.8693 103.44C61.6345 104.081 66.6471 104.094 71.4124 103.471C72.1664 103.467 74.0847 102.781 74.5789 103.506C75.926 105.483 73.3911 110.592 77.0656 110.782C79.6002 110.912 82.2942 110.817 84.8494 110.824ZM109.525 49.0505C110.138 50.075 110.343 50.4818 111.327 51.2048C111.557 51.2294 111.735 51.3132 111.925 51.1597C113.101 50.2102 115.863 44.0114 112.686 44.2824C110.315 45.0032 109.47 46.6843 109.525 49.0505Z" fill="#164951" stroke="#164951"/>
      <Path d="M64.4305 45.2145C64.926 45.1652 65.4349 45.1879 65.9274 45.1986C77.6953 45.5155 79.9613 57.9582 79.8939 67.3862C79.8254 76.9657 77.8711 88.5132 66.2156 89.368C54.1406 89.8921 50.9312 78.8839 50.704 68.9086C50.4872 59.3915 52.3119 45.6838 64.4305 45.2145ZM66.6819 87.1076C69.5418 86.77 72.1466 85.2988 73.9123 83.0237C77.9344 77.9121 78.1877 67.6313 77.3496 61.3711C76.8199 57.4141 75.5184 52.3074 72.2027 49.7381C69.9229 47.9713 66.9561 47.0746 64.0634 47.5145C61.6567 47.672 58.7228 49.0957 57.1814 50.9379C51.3486 57.9087 51.1805 78.4561 58.0704 84.4531C60.32 86.4204 63.2683 87.3965 66.2475 87.1603C66.393 87.1494 66.538 87.1318 66.6819 87.1076Z" fill="#164951"/>
      <Path d="M65.3 52.3804C70.1682 52.4429 71.4828 58.368 71.5603 62.2183C71.6729 67.8102 73.1869 81.6053 65.3808 82.2833C60.0602 82.266 59.0839 75.1151 58.9917 71.1223C58.8731 65.9792 57.8827 52.5807 65.3 52.3804ZM66.0296 79.7841C67.1401 79.3132 67.993 78.5525 68.3333 77.3347C70.0815 71.0782 70.1143 63.2141 68.2238 56.9765C67.6877 55.2081 66.3079 54.6602 64.5982 54.789C59.653 56.7581 60.8418 73.1863 62.3907 77.5237C63.0265 79.3039 64.2528 79.9628 66.0296 79.7841Z" fill="#1EA84E" stroke="#1EA84E" strokeWidth={2}/>
      <Path d="M33.5867 49.2638C36.5181 49.01 39.1058 51.167 39.3842 54.0961C39.6626 57.0252 37.5274 59.631 34.6008 59.9339C31.6391 60.2406 28.9954 58.0743 28.7137 55.1102C28.432 52.1461 30.6204 49.5206 33.5867 49.2638ZM34.5859 57.748C35.6735 57.1856 36.4501 56.7926 36.8644 55.494C37.1241 54.6526 37.0375 53.7425 36.6237 52.9653C35.8916 51.6185 34.5268 51.3584 33.1254 51.5864C32.2665 51.9579 31.658 52.4947 31.3083 53.3862C30.9773 54.2208 31.009 55.1556 31.3959 55.9659C31.8905 57.0199 33.4351 58.1159 34.5859 57.748Z" fill="#164951"/>
    </Svg>
  );
}

function ReceiptIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path d="M7.5 15.75V2.25L9 3L10.5 2.25L11.9972 3L13.5145 2.25L15 3L16.4902 2.25L17.9869 3L19.5 2.25L21.0005 3L22.5 2.25V12.75" stroke="rgba(255,255,255,0.85)" strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M22.5 12.75V18C22.5 18.9946 22.1049 19.9484 21.4017 20.6517C20.6984 21.3549 19.7446 21.75 18.75 21.75C17.7555 21.75 16.8016 21.3549 16.0984 20.6517C15.3951 19.9484 15 18.9946 15 18V15.75H2.25003C2.15129 15.7491 2.05337 15.7679 1.96198 15.8053C1.87059 15.8427 1.78757 15.8979 1.71775 15.9677C1.64793 16.0375 1.59272 16.1206 1.55534 16.212C1.51796 16.3033 1.49915 16.4013 1.50003 16.5C1.50003 19.5 1.81597 21.75 5.25003 21.75H18.75" stroke="rgba(255,255,255,0.85)" strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M10.5 6.75H19.5M13.5 10.5H19.5" stroke="rgba(255,255,255,0.85)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ExchangeIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
      <Circle cx={14} cy={14} r={14} fill={CARD_TEAL} />
      <Path d="M9 12h10M9 16h10" stroke={WHITE} strokeWidth={2} strokeLinecap="round" />
      <Path d="M16 9l3 3-3 3" stroke={WHITE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 19l-3-3 3-3" stroke={WHITE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Circle cx={8} cy={8} r={5.5} stroke={color} strokeWidth={1.5} />
      <Path d="M12 12l3.5 3.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function ArrowUpIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path d="M7 11V3M3 7l4-4 4 4" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ArrowDownIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path d="M7 3v8M3 7l4 4 4-4" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function PortfolioScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 48 : insets.top || 44;
  const c = useColors();
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [period, setPeriod] = useState("1D");
  const [month, setMonth] = useState("November");

  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [totalValue, setTotalValue] = useState<string | null>(null);
  const [totalGain, setTotalGain] = useState<string | null>(null);
  const [gainPositive, setGainPositive] = useState(true);
  const { data: walletBalance } = useWalletBalance();

  useEffect(() => {
    portfolioApi.getSummary()
      .then((s) => {
        setTotalValue(`K ${Number(s.totalValue || 0).toLocaleString()}`);
        const gain = Number(s.totalGain || 0);
        setTotalGain(`${gain >= 0 ? '+' : ''}K ${Math.abs(gain).toLocaleString()} (${s.totalGainPercent || '0'}%)`);
        setGainPositive(gain >= 0);
      })
      .catch(() => {
        setTotalValue("K 0");
        setTotalGain("K 0 (0%)");
      });

    portfolioApi.getHoldings()
      .then((h) => {
        setHoldings(h.map((item: any) => ({
          id: item.stockId,
          ticker: item.symbol,
          name: item.name,
          logo: getStockLogo(item.symbol),
          price: `K ${Number(item.currentPrice || 0).toLocaleString()}`,
          change: `${Number(item.gainPercent || 0) >= 0 ? '+' : ''}${item.gainPercent || '0'}%`,
          positive: Number(item.gainPercent || 0) >= 0,
          shares: String(item.quantity || 0),
          value: `K ${Number(item.marketValue || 0).toLocaleString()}`,
          changePct: `${item.gainPercent || '0'}%`,
        })));
      })
      .catch(() => {});
  }, []);

  const filtered = holdings.filter(
    (a) =>
      a.ticker.toLowerCase().includes(searchText.toLowerCase()) ||
      a.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: TEAL },
    header: { backgroundColor: TEAL, paddingHorizontal: 24, paddingBottom: 48, minHeight: 200, position: "relative" },
    whiteSheet: { flex: 1, backgroundColor: c.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -24, overflow: "hidden" },
    topRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginBottom: 20, marginTop: 12 },
    receiptBtn: { padding: 4 },
    titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
    titleLabel: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: "rgba(255,255,255,0.8)", letterSpacing: 0.3 },
    eyeBtn: { padding: 4 },
    balanceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    balanceBlock: { flex: 1 },
    balanceAmount: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 38, color: WHITE, letterSpacing: -1, marginBottom: 8 },
    balanceHidden: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 38, color: "rgba(255,255,255,0.5)", marginBottom: 8 },
    monthPill: { backgroundColor: CARD_TEAL, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, flexDirection: "row", alignItems: "center", gap: 4 },
    monthText: { fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: WHITE },
    changeChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, alignSelf: "flex-start" },
    changeText: { fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: GREEN },
    actionCard: {
      marginHorizontal: 20,
      marginTop: 20,
      marginBottom: 4,
      backgroundColor: c.card,
      borderRadius: 16,
      flexDirection: "row",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 5,
      paddingVertical: 20,
      borderWidth: 1,
      borderColor: c.border,
    },
    actionItem: { flex: 1, alignItems: "center", gap: 8 },
    actionLabel: { fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: c.text },
    listArea: { flex: 1, marginTop: 8 },
    listContent: { paddingHorizontal: 20, paddingBottom: 100 },
    sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, marginTop: 4 },
    sectionTitle: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 16, color: c.text },
    viewAll: { fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: TEAL },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 8,
      marginBottom: 16,
    },
    searchInput: { flex: 1, fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: c.text, padding: 0 },
    assetCard: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 12 },
    assetCardBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
    logoCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.card, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 1, borderColor: c.border },
    logoImage: { width: 40, height: 40, borderRadius: 20 },
    assetInfo: { flex: 1 },
    assetTicker: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: c.text, marginBottom: 3 },
    assetShares: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: c.mutedForeground },
    assetRight: { alignItems: "flex-end" },
    assetValue: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: c.text, marginBottom: 4 },
    assetChangePill: { flexDirection: "row", alignItems: "center", gap: 2 },
    assetChangePct: { fontFamily: "PlusJakartaSans_500Medium", fontSize: 12 },
    emptyState: { paddingVertical: 48, alignItems: "center" },
    emptyText: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 16, color: c.text, marginBottom: 6 },
    emptySubText: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: c.mutedForeground },
  });

  return (
    <View style={styles.root}>
      {/* Teal Header */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        {/* Receipt icon top-right */}
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.receiptBtn} onPress={() => router.push("/trade/history" as any)}>
            <ReceiptIcon />
          </TouchableOpacity>
        </View>

        {/* "Portfolio Balance" + eye */}
        <View style={styles.titleRow}>
          <Text style={styles.titleLabel}>Portfolio Balance</Text>
          <TouchableOpacity onPress={() => setBalanceHidden((v) => !v)} style={styles.eyeBtn}>
            <EyeIcon hidden={balanceHidden} />
          </TouchableOpacity>
        </View>

        {/* Balance + month pill */}
        <View style={styles.balanceRow}>
          <View style={styles.balanceBlock}>
            {balanceHidden ? (
              <Text style={styles.balanceHidden} adjustsFontSizeToFit numberOfLines={1}>K  ••••••</Text>
            ) : (
              <Text style={styles.balanceAmount} adjustsFontSizeToFit numberOfLines={1}>
                {totalValue ?? "—"}
              </Text>
            )}
            {totalGain !== null && (
              <View style={styles.changeChip}>
                {gainPositive ? <ArrowUpIcon color={GREEN} /> : <ArrowDownIcon color={RED} />}
                <Text style={styles.changeText}>{totalGain}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.monthPill}>
            <Text style={styles.monthText}>{month}</Text>
            <Text style={styles.monthText}>▾</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content sheet */}
      <View style={styles.whiteSheet}>
        <View style={styles.actionCard}>
          <TouchableOpacity
            style={[styles.actionItem, holdings.length === 0 && { opacity: 0.35 }]}
            onPress={() => holdings.length > 0 && router.push("/trade/sell" as any)}
            activeOpacity={holdings.length > 0 ? 0.7 : 1}
          >
            <SellIcon />
            <Text style={[styles.actionLabel, { color: "#9CA3AF" }]}>Sell</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.listArea} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Your Assets</Text>
          </View>

          <View style={styles.searchBar}>
            <SearchIcon color={c.mutedForeground} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search assets..."
              placeholderTextColor={c.mutedForeground}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <PiggyIllustration />
              <Text style={[styles.emptyText, { marginTop: 20 }]}>No holdings yet</Text>
              <Text style={styles.emptySubText}>Buy your first stock to get started</Text>
            </View>
          )}

          {filtered.map((asset, i) => (
            <TouchableOpacity
              key={asset.ticker}
              style={[styles.assetCard, i < filtered.length - 1 && styles.assetCardBorder]}
              onPress={() => guardedPush(() => router.push(`/stock/${asset.ticker}` as any))}
              activeOpacity={0.75}
            >
              <View style={styles.logoCircle}>
                {asset.logo ? (
                  <Image source={asset.logo} style={styles.logoImage} resizeMode="contain" />
                ) : (
                  <View style={[styles.logoImage, { backgroundColor: c.card, borderRadius: 20 }]} />
                )}
              </View>
              <View style={styles.assetInfo}>
                <Text style={styles.assetTicker}>{asset.ticker}</Text>
                <Text style={styles.assetShares}>{asset.shares}</Text>
              </View>
              <View style={styles.assetRight}>
                <Text style={styles.assetValue}>{asset.value}</Text>
                <View style={styles.assetChangePill}>
                  {asset.positive ? <ArrowUpIcon color={GREEN} /> : <ArrowDownIcon color={RED} />}
                  <Text style={[styles.assetChangePct, { color: asset.positive ? GREEN : RED }]}>
                    {asset.changePct ?? asset.change}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

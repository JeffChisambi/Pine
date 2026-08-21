import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { guardedBack, guardedPush } from "@/utils/navigation";
import { useColors } from "@/hooks/useColors";
import { useTreasuryProducts, useMyInvestments } from "@/hooks/useTreasury";
import { mapInvestment, investmentYield } from "@/utils/treasury-map";

const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";
const DARK_BG = "#0D3540";

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19l-7-7 7-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function fmt(n: number): string {
  const [w, d] = n.toFixed(2).split(".");
  return `${Number(w).toLocaleString()}.${d}`;
}

function getAuctionCountdown(auctionDate: string): string {
  const target = new Date(auctionDate);
  if (isNaN(target.getTime())) return "";
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return "Closed";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

function formatSettleDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function TreasuryLanding() {
  const { data: products = [], isLoading } = useTreasuryProducts();
  const { data: apiInvestments = [] } = useMyInvestments();
  const investments = apiInvestments.map(mapInvestment);
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 16;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 16);
  const c = useColors();

  const activeInvestments = investments.filter(
    (inv) => inv.status === "active" || inv.status === "pending",
  );
  const totalInvested = activeInvestments.reduce(
    (sum, inv) => sum + inv.amountInvested,
    0,
  );
  const totalEarnings = investments
    .filter((inv) => inv.status === "active")
    .reduce((sum, inv) => sum + inv.estimatedEarnings, 0);
  const activeCount = investments.filter((inv) => inv.status === "active").length;

  const auctionDate = products[0]?.auctionDate ?? "";
  const issueDate = products[0]?.issueDate ?? "";
  const countdown = getAuctionCountdown(auctionDate);

  const bestYieldId =
    products.length > 0
      ? products.reduce((best, p) => (p.yieldPct > best.yieldPct ? p : best), products[0]).id
      : "";

  const myBillsPreview = investments.slice(0, 2);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View
        style={{
          paddingTop: topPad,
          paddingHorizontal: 20,
          paddingBottom: 10,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => guardedBack("/(tabs)")}
          activeOpacity={0.7}
          style={{ width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" }}
        >
          <BackIcon color={c.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center", paddingRight: 40 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: c.text }}>
            Debt Securities
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomPad + 80 }}
      >
        {/* Hero card */}
        <View
          style={{
            backgroundColor: DARK_BG,
            borderRadius: 20,
            padding: 22,
            marginBottom: 28,
          }}
        >
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: "rgba(69,179,105,0.18)",
              borderRadius: 6,
              paddingHorizontal: 10,
              paddingVertical: 4,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontFamily: "PlusJakartaSans_600SemiBold",
                fontSize: 10,
                color: GREEN,
                letterSpacing: 1.2,
              }}
            >
              TOTAL INVESTED
            </Text>
          </View>

          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 30,
              color: WHITE,
              letterSpacing: -0.5,
              marginBottom: 14,
            }}
          >
            K{fmt(totalInvested)}
          </Text>

          <View style={{ flexDirection: "row", gap: 32 }}>
            <View>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_400Regular",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.5)",
                  marginBottom: 3,
                }}
              >
                Interest earned
              </Text>
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: GREEN }}>
                +K{totalEarnings.toLocaleString()}
              </Text>
            </View>
            <View>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_400Regular",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.5)",
                  marginBottom: 3,
                }}
              >
                Active bills
              </Text>
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: WHITE }}>
                {activeCount}
              </Text>
            </View>
          </View>
        </View>

        {/* Current Auction */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 4,
          }}
        >
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 17, color: c.text }}>
            Current Auction
          </Text>
          {countdown ? (
            <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: MUTED }}>
              Closes in {countdown}
            </Text>
          ) : null}
        </View>
        {issueDate ? (
          <Text
            style={{
              fontFamily: "PlusJakartaSans_400Regular",
              fontSize: 13,
              color: MUTED,
              marginBottom: 16,
            }}
          >
            Bids settle {formatSettleDate(issueDate)}
          </Text>
        ) : null}

        {/* Bill list */}
        {isLoading ? (
          <View style={{ paddingTop: 40, alignItems: "center" }}>
            <ActivityIndicator color={c.text} />
          </View>
        ) : products.length === 0 ? (
          <Text
            style={{
              fontFamily: "PlusJakartaSans_400Regular",
              fontSize: 13,
              color: MUTED,
              textAlign: "center",
              paddingTop: 24,
            }}
          >
            No debt securities available right now.
          </Text>
        ) : (
          products.map((bill) => {
            const isBest = bill.id === bestYieldId;
            return (
              <TouchableOpacity
                key={bill.id}
                activeOpacity={0.85}
                onPress={() =>
                  guardedPush(() =>
                    router.push({
                      pathname: "/treasury/details" as any,
                      params: { id: bill.id },
                    }),
                  )
                }
                style={{
                  backgroundColor: c.card,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: isBest ? GREEN : c.border,
                  borderLeftWidth: isBest ? 3 : 1,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  marginBottom: 10,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 17, color: c.text }}>
                      {bill.duration} days
                    </Text>
                    {isBest && (
                      <View
                        style={{
                          backgroundColor: GREEN + "22",
                          paddingHorizontal: 7,
                          paddingVertical: 2,
                          borderRadius: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: "PlusJakartaSans_600SemiBold",
                            fontSize: 9,
                            color: GREEN,
                            letterSpacing: 0.5,
                          }}
                        >
                          BEST YIELD
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: MUTED }}>
                    Matures {bill.maturityDate} · min K{bill.minInvestment.toLocaleString()}
                  </Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 20, color: c.text }}>
                    {bill.yieldPct.toFixed(2)}%
                  </Text>
                  <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: MUTED }}>
                    YIELD
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* My Bills */}
        {myBillsPreview.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 17, color: c.text }}>
                My Bills
              </Text>
              <TouchableOpacity
                onPress={() =>
                  guardedPush(() => router.push("/treasury/my-investments" as any))
                }
              >
                <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: c.primary }}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>

            {myBillsPreview.map((inv) => (
              <TouchableOpacity
                key={inv.id}
                activeOpacity={0.8}
                onPress={() =>
                  guardedPush(() =>
                    router.push({
                      pathname: "/treasury/investment-detail" as any,
                      params: { id: inv.id },
                    }),
                  )
                }
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: c.border,
                }}
              >
                <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 15, color: c.text }}>
                  {inv.duration}-day bill
                </Text>
                <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: c.text }}>
                  K{inv.amountInvested.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Place a Bid */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: Math.max(bottomPad, 24),
          backgroundColor: c.background,
          borderTopWidth: 1,
          borderTopColor: c.border,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            const target = products.find((p) => p.id === bestYieldId) ?? products[0];
            if (target)
              guardedPush(() =>
                router.push({
                  pathname: "/treasury/details" as any,
                  params: { id: target.id },
                }),
              );
          }}
          style={{
            height: 56,
            backgroundColor: c.primary,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 17, color: WHITE }}>
            Place a Bid
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

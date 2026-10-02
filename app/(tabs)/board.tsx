/**
 * Board — the Pine Points leaderboard.
 *
 * Replaces News in the practice app: market headlines are no use to someone
 * learning with play money, but a reason to come back tomorrow is.
 *
 * Nothing here decides a point. Every number, including what each rule is
 * worth, comes from the server, so the competition cannot be influenced from
 * a phone and the earn screen can never drift from what actually scores.
 */
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { useColors } from "@/hooks/useColors";
import { MedalIcon, MEDAL_COLORS } from "@/components/MedalIcon";
import { useLayoutWidth } from "@/hooks/useLayoutWidth";
import {
  useBoardRules,
  useCheckIn,
  useInvalidateBoard,
  useLeaderboard,
  usePointsHistory,
  usePointsSummary,
} from "@/hooks/useBoard";
import type { BoardRow, PointRuleView } from "@/services/api";

const GREEN = "#45B369";
const WHITE = "#FFFFFF";
const MUTED = "#9CA3AF";

const SEGMENTS = ["Ranking", "Earn", "Prizes"] as const;
type Segment = (typeof SEGMENTS)[number];

/** The podium colours, taken from the medal artwork so the two agree. */
const PLACE_COLORS: Record<number, string> = {
  1: MEDAL_COLORS[1].face,
  2: MEDAL_COLORS[2].face,
  3: MEDAL_COLORS[3].face,
};

function TrophyIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 21h8M12 17v4M18 4h2a2 2 0 0 1-2 6M6 4H4a2 2 0 0 0 2 6M6 3h12v6a6 6 0 0 1-12 0V3Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ArrowIcon({ up, color }: { up: boolean; color: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path
        d={up ? "M12 19V5M5 12l7-7 7 7" : "M12 5v14M19 12l-7 7-7-7"}
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function BoardScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const width = useLayoutWidth();
  const topPad = Platform.OS === "web" ? 44 : insets.top || 16;

  const [segment, setSegment] = useState<Segment>("Ranking");
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  const rules = useBoardRules("en");
  const board = useLeaderboard(page, 25);
  const summary = usePointsSummary();
  const history = usePointsHistory();
  const invalidate = useInvalidateBoard();
  const checkIn = useCheckIn();

  // Opening the Board is itself a visit, so claim the day's check-in. The
  // server decides whether today has already been counted.
  useFocusEffect(
    useCallback(() => {
      if (summary.data && !summary.data.checkedInToday && !checkIn.isPending) {
        checkIn.mutate(undefined, { onError: () => undefined });
      }
    }, [summary.data?.checkedInToday]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    invalidate();
    setTimeout(() => setRefreshing(false), 600);
  }, [invalidate]);

  const season = rules.data?.season ?? board.data?.season ?? summary.data?.season ?? null;
  const loading = rules.isLoading && board.isLoading && summary.isLoading;
  const failed = rules.isError && board.isError && summary.isError;

  const closingLine = useMemo(() => {
    if (!season) return null;
    const ends = new Date(season.endsAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (season.closed) return `This competition closed on ${ends}.`;
    return `Ends ${ends} — ${season.daysRemaining} day${season.daysRemaining === 1 ? "" : "s"} to go.`;
  }, [season]);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ paddingTop: topPad + 8, paddingHorizontal: 20, paddingBottom: 8 }}>
        <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 24, color: c.text }}>
          Board
        </Text>
        {closingLine && (
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: c.mutedForeground, marginTop: 2 }}>
            {closingLine}
          </Text>
        )}
      </View>

      {/* Segments */}
      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingBottom: 12 }}>
        {SEGMENTS.map((s) => {
          const on = s === segment;
          return (
            <TouchableOpacity
              key={s}
              onPress={() => setSegment(s)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={{
                paddingVertical: 7,
                paddingHorizontal: 14,
                borderRadius: 999,
                backgroundColor: on ? c.primary : c.card,
                borderWidth: on ? 0 : 1,
                borderColor: c.border,
              }}
            >
              <Text
                style={{
                  fontFamily: on ? "PlusJakartaSans_600SemiBold" : "PlusJakartaSans_500Medium",
                  fontSize: 13,
                  color: on ? WHITE : c.text,
                }}
              >
                {s}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} colors={[c.primary]} />
        }
      >
        {loading ? (
          <View style={{ paddingTop: 80, alignItems: "center" }}>
            <ActivityIndicator size="large" color={c.primary} />
          </View>
        ) : failed ? (
          <View style={{ paddingTop: 70, alignItems: "center", paddingHorizontal: 40 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: c.text, textAlign: "center" }}>
              The board could not be loaded
            </Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: c.mutedForeground, textAlign: "center", marginTop: 6 }}>
              Check your connection and try again.
            </Text>
            <TouchableOpacity
              onPress={onRefresh}
              activeOpacity={0.85}
              style={{ marginTop: 18, paddingVertical: 10, paddingHorizontal: 22, borderRadius: 10, backgroundColor: c.primary }}
            >
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: WHITE }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : segment === "Ranking" ? (
          <RankingSegment
            rows={board.data?.rows ?? []}
            me={board.data?.me ?? null}
            page={page}
            totalPages={board.data?.totalPages ?? 1}
            onPage={setPage}
            summary={summary.data}
            c={c}
          />
        ) : segment === "Earn" ? (
          <EarnSegment groups={rules.data?.groups ?? []} history={history.data?.items ?? []} c={c} />
        ) : (
          <PrizesSegment
            prizes={rules.data?.prizes ?? []}
            closingLine={closingLine}
            c={c}
          />
        )}
      </ScrollView>
    </View>
  );
}

// ─── Ranking ────────────────────────────────────────────────────────────────

function RankingSegment({
  rows,
  me,
  page,
  totalPages,
  onPage,
  summary,
  c,
}: {
  rows: BoardRow[];
  me: { rank: number | null; points: number; movement: number | null; displayName: string | null; onThisPage: boolean } | null;
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
  summary: ReturnType<typeof usePointsSummary>["data"];
  c: ReturnType<typeof useColors>;
}) {
  // The gap to the person directly above, so "what do I do next" has an answer.
  const toNext = useMemo(() => {
    if (!me?.rank || me.rank <= 1) return null;
    const above = rows.find((r) => r.rank === (me.rank ?? 0) - 1);
    return above ? above.points - me.points : null;
  }, [rows, me]);

  return (
    <View style={{ paddingHorizontal: 20 }}>
      {/* Your standing, pinned — shown even when you are pages away. */}
      {me && (
        <View style={[styles.youCard, { backgroundColor: c.primary }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
              Your position
            </Text>
            <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 28, color: WHITE, marginTop: 2 }}>
              {me.rank ? ordinal(me.rank) : "Unranked"}
            </Text>
            {toNext !== null && toNext > 0 && (
              <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>
                {toNext} point{toNext === 1 ? "" : "s"} behind {ordinal((me.rank ?? 1) - 1)}
              </Text>
            )}
            {me.rank === 1 && (
              <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>
                You are leading. Keep it up.
              </Text>
            )}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 22, color: WHITE }}>
              {me.points.toLocaleString("en")}
            </Text>
            <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 11, color: "rgba(255,255,255,0.75)" }}>
              points
            </Text>
            {summary?.currentStreak ? (
              <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 6 }}>
                {summary.currentStreak} day streak
              </Text>
            ) : null}
          </View>
        </View>
      )}

      {rows.length === 0 ? (
        <View style={{ paddingTop: 50, alignItems: "center", paddingHorizontal: 30 }}>
          <TrophyIcon color={c.mutedForeground} />
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: c.text, marginTop: 10, textAlign: "center" }}>
            Nobody has scored yet
          </Text>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: c.mutedForeground, marginTop: 6, textAlign: "center" }}>
            Open the Earn tab to see how to get on the board first.
          </Text>
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          {rows.map((row, i) => (
            <View
              key={`${row.rank}-${row.displayName}`}
              style={[
                styles.row,
                i < rows.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
                row.isMe && { backgroundColor: withAlpha(c.primary, 0.08) },
              ]}
            >
              <View style={styles.place}>
                {row.rank <= 3 ? (
                  <MedalIcon place={row.rank} size={30} />
                ) : (
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_700Bold",
                      fontSize: 13,
                      color: c.mutedForeground,
                    }}
                  >
                    {row.rank}
                  </Text>
                )}
              </View>
              <Text
                style={{
                  flex: 1,
                  fontFamily: row.isMe ? "PlusJakartaSans_700Bold" : "PlusJakartaSans_500Medium",
                  fontSize: 14,
                  color: c.text,
                }}
                numberOfLines={1}
              >
                {row.displayName}
                {row.isMe ? "  (you)" : ""}
              </Text>
              {row.movement !== null && row.movement !== 0 && (
                <View style={{ marginRight: 8 }}>
                  <ArrowIcon up={row.movement > 0} color={row.movement > 0 ? GREEN : "#EF4770"} />
                </View>
              )}
              <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 14, color: c.text, fontVariant: ["tabular-nums"] }}>
                {row.points.toLocaleString("en")}
              </Text>
            </View>
          ))}
        </View>
      )}

      {totalPages > 1 && (
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 16 }}>
          <TouchableOpacity disabled={page <= 1} onPress={() => onPage(page - 1)} activeOpacity={0.8}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: page <= 1 ? c.mutedForeground : c.primary }}>
              Previous
            </Text>
          </TouchableOpacity>
          <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 12, color: c.mutedForeground }}>
            Page {page} of {totalPages}
          </Text>
          <TouchableOpacity disabled={page >= totalPages} onPress={() => onPage(page + 1)} activeOpacity={0.8}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: page >= totalPages ? c.mutedForeground : c.primary }}>
              Next
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Earn ───────────────────────────────────────────────────────────────────

function EarnSegment({
  groups,
  history,
  c,
}: {
  groups: Array<{ group: string; title: string; rules: PointRuleView[] }>;
  history: Array<{ id: string; title: string; points: number; createdAt: string }>;
  c: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ paddingHorizontal: 20 }}>
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border, padding: 16 }]}>
        <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text }}>
          How points work
        </Text>
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, lineHeight: 20, color: c.mutedForeground, marginTop: 6 }}>
          Pine awards every point, so you never have to claim one. Most actions
          have a daily limit, shown below, which keeps the competition about
          turning up regularly rather than repeating one thing all night.
        </Text>
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, lineHeight: 20, color: c.mutedForeground, marginTop: 8 }}>
          Selling only scores when you bought the stock on an earlier day.
          Buying and selling within the same day earns the buy points only.
        </Text>
      </View>

      {groups.map((group) => (
        <View key={group.group} style={{ marginTop: 18 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 12, color: c.mutedForeground, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8 }}>
            {group.title}
          </Text>
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            {group.rules.map((rule, i) => (
              <View
                key={rule.key}
                style={[
                  styles.row,
                  { alignItems: "flex-start" },
                  i < group.rules.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
                ]}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text }}>
                    {rule.title}
                  </Text>
                  <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, lineHeight: 17, color: c.mutedForeground, marginTop: 3 }}>
                    {rule.hint}
                  </Text>
                  {rule.completed ? (
                    <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 11, color: GREEN, marginTop: 5 }}>
                      Earned
                    </Text>
                  ) : rule.cappedToday ? (
                    <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 11, color: c.mutedForeground, marginTop: 5 }}>
                      Today&apos;s limit reached
                    </Text>
                  ) : null}
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: rule.completed ? GREEN : c.text }}>
                    +{rule.points}
                  </Text>
                  {rule.earnedTotal > 0 && (
                    <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 10, color: c.mutedForeground, marginTop: 2 }}>
                      {rule.earnedTotal}&times; so far
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}

      {history.length > 0 && (
        <View style={{ marginTop: 22 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 12, color: c.mutedForeground, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8 }}>
            What you have earned
          </Text>
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            {history.map((item, i) => (
              <View
                key={item.id}
                style={[
                  styles.row,
                  i < history.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: c.text }}>{item.title}</Text>
                  <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: c.mutedForeground, marginTop: 2 }}>
                    {new Date(item.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </Text>
                </View>
                <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 14, color: item.points >= 0 ? GREEN : "#EF4770" }}>
                  {item.points >= 0 ? "+" : ""}
                  {item.points}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Prizes ─────────────────────────────────────────────────────────────────

function PrizesSegment({
  prizes,
  closingLine,
  c,
}: {
  prizes: Array<{ rank: number; label: string }>;
  closingLine: string | null;
  c: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ paddingHorizontal: 20 }}>
      {prizes.map((prize) => (
        <View
          key={prize.rank}
          style={[
            styles.card,
            {
              backgroundColor: c.card,
              borderColor: PLACE_COLORS[prize.rank] ?? c.border,
              borderWidth: PLACE_COLORS[prize.rank] ? 1.5 : 1,
              padding: 16,
              marginTop: prize.rank === 1 ? 0 : 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
            },
          ]}
        >
          <MedalIcon place={prize.rank} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 12, color: c.mutedForeground }}>
              {ordinal(prize.rank)} place
            </Text>
            <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: c.text, marginTop: 2 }}>
              {prize.label}
            </Text>
          </View>
        </View>
      ))}

      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border, padding: 16, marginTop: 18 }]}>
        <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: c.text }}>The rules</Text>
        {closingLine && (
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, lineHeight: 20, color: c.mutedForeground, marginTop: 6 }}>
            {closingLine}
          </Text>
        )}
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, lineHeight: 20, color: c.mutedForeground, marginTop: 8 }}>
          If two people finish on the same number of points, whoever reached
          that total first is placed higher.
        </Text>
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, lineHeight: 20, color: c.mutedForeground, marginTop: 8 }}>
          Pine checks the leading accounts before awarding anything. Points
          earned by automating the app rather than using it do not count.
        </Text>
      </View>
    </View>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function ordinal(n: number): string {
  const rest = n % 100;
  if (rest >= 11 && rest <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/** Tints a hex colour for the "this is you" row highlight. */
function withAlpha(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  const [, r, g, b] = m;
  return `rgba(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}, ${alpha})`;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13 },
  place: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  youCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
});

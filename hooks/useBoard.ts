/**
 * Queries behind the Board tab.
 *
 * Everything the board shows is decided by the server — points, ranks, even
 * what each rule is worth — so these are plain reads with no local scoring.
 * The claim helpers below swallow their errors on purpose: failing to earn a
 * point must never break the lesson, the tap or the screen that triggered it.
 */
import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  boardApi,
  type Leaderboard,
  type PointsHistory,
  type PointsRules,
  type PointsSummary,
} from "@/services/api";

export const boardKeys = {
  all: ["board"] as const,
  rules: (lang: string) => [...boardKeys.all, "rules", lang] as const,
  leaderboard: (page: number) => [...boardKeys.all, "leaderboard", page] as const,
  summary: () => [...boardKeys.all, "summary"] as const,
  history: () => [...boardKeys.all, "history"] as const,
};

export function useBoardRules(lang: "en" | "ny" = "en") {
  return useQuery<PointsRules>({
    queryKey: boardKeys.rules(lang),
    queryFn: () => boardApi.rules(lang),
    // The catalogue changes only when the backend is deployed.
    staleTime: 10 * 60 * 1000,
  });
}

export function useLeaderboard(page = 1, limit = 25) {
  return useQuery<Leaderboard>({
    queryKey: boardKeys.leaderboard(page),
    queryFn: () => boardApi.leaderboard(page, limit),
    staleTime: 30 * 1000,
  });
}

export function usePointsSummary() {
  return useQuery<PointsSummary>({
    queryKey: boardKeys.summary(),
    queryFn: () => boardApi.summary(),
    staleTime: 30 * 1000,
  });
}

export function usePointsHistory() {
  return useQuery<PointsHistory>({
    queryKey: boardKeys.history(),
    queryFn: () => boardApi.history(20, 0),
    staleTime: 60 * 1000,
  });
}

/** Refreshes everything the board shows after something has been earned. */
export function useInvalidateBoard() {
  const qc = useQueryClient();
  return useCallback(() => {
    void qc.invalidateQueries({ queryKey: boardKeys.all });
  }, [qc]);
}

export function useCheckIn() {
  const invalidate = useInvalidateBoard();
  return useMutation({
    mutationFn: () => boardApi.checkIn(),
    onSuccess: invalidate,
  });
}

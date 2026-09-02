import { useQuery } from '@tanstack/react-query';
import {
  portfolioApi,
  Holding,
  PortfolioSummary,
  PortfolioPerformance,
  PortfolioSnapshotPoint,
} from '../services/api';

export const portfolioKeys = {
  all:      ['portfolio'] as const,
  holdings: () => [...portfolioKeys.all, 'holdings'] as const,
  summary:  () => [...portfolioKeys.all, 'summary'] as const,
  performance: (period: string) => [...portfolioKeys.all, 'performance', period] as const,
};

/**
 * Fetch the user's current holdings.
 * Kept fresh (30s + refetch on mount/focus) so ownership-dependent UI —
 * like the Sell button on the stock detail page — flips as soon as a
 * broker-executed trade settles.
 */
export function useHoldings() {
  return useQuery<Holding[], Error>({
    queryKey: portfolioKeys.holdings(),
    queryFn:  () => portfolioApi.getHoldings(),
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}

/**
 * Returns the quantity of a specific stock the user holds (0 if none).
 * Derived from the holdings cache — no extra request.
 */
export function useHoldingQuantity(symbol: string | undefined): number {
  const { data: holdings = [] } = useHoldings();
  if (!symbol) return 0;
  const holding = holdings.find(
    (h) => h.symbol.toUpperCase() === symbol.toUpperCase()
  );
  return holding ? Number(holding.quantity) || 0 : 0;
}

/** GET /portfolio/summary — live totals (derived on every read, never stored). */
export function usePortfolioSummary() {
  return useQuery<PortfolioSummary, Error>({
    queryKey: portfolioKeys.summary(),
    queryFn:  () => portfolioApi.getSummary(),
    staleTime: 30_000,
    refetchOnMount: true,
    retry: 1,
  });
}

// ─── Portfolio performance (analytics screen) ────────────────────────────────

export const PERFORMANCE_PERIODS = ['1W', '1M', '3M', '1Y', 'ALL'] as const;
export type PerformancePeriod = typeof PERFORMANCE_PERIODS[number];

/** How many daily snapshots to pull for each period. Snapshots are one row
 *  per (business) day, so these are generous upper bounds; the series is
 *  trimmed client-side to the period's real date window. */
const PERIOD_DAYS: Record<PerformancePeriod, number> = {
  '1W': 7,
  '1M': 31,
  '3M': 92,
  '1Y': 366,
  ALL: 3650,
};

export interface PortfolioPerformanceData {
  /** All-window return metrics from GET /portfolio/performance. */
  metrics: PortfolioPerformance;
  /** Chronological snapshots inside the period window (may be empty for a new user). */
  series: PortfolioSnapshotPoint[];
}

/**
 * Snapshot series + return metrics for the Portfolio Analytics chart.
 *
 * The backend has no period-aware series endpoint: GET /portfolio/performance
 * returns fixed 1d/7d/30d/365d/lifetime metrics and GET /portfolio/history
 * returns the last `limit` daily snapshots. This hook fetches both in one go
 * and clips the history to the selected period so the chart, the "vs period
 * start" delta and the metrics all describe the same window.
 */
export function usePortfolioPerformance(period: PerformancePeriod) {
  return useQuery<PortfolioPerformanceData, Error>({
    queryKey: portfolioKeys.performance(period),
    queryFn: async () => {
      const [metrics, history] = await Promise.all([
        portfolioApi.getPerformance(period),
        portfolioApi.getHistory(PERIOD_DAYS[period]),
      ]);

      let series = Array.isArray(history) ? history : [];
      if (period !== 'ALL') {
        const from = Date.now() - PERIOD_DAYS[period] * 24 * 60 * 60 * 1000;
        series = series.filter((p) => new Date(p.date).getTime() >= from);
      }
      // Defensive: the API promises chronological order, but the chart relies on it.
      series = [...series].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return { metrics, series };
    },
    staleTime: 60_000,
    refetchOnMount: true,
    retry: 1,
  });
}

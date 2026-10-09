import { useQuery } from '@tanstack/react-query';
import {
  portfolioApi,
  Holding,
  PortfolioSummary,
  PortfolioPerformance,
  PerformanceSeriesPoint,
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

export interface PortfolioPerformanceData {
  metrics: PortfolioPerformance;
  /** One point per day for the period; empty for a portfolio with no history. */
  series: PerformanceSeriesPoint[];
}

/**
 * Investment performance for the Portfolio Analytics chart.
 *
 * The server computes the series and the returns together, time-weighted and
 * with trades netted out. This used to chart raw portfolio value from
 * /portfolio/history and call its change growth, which counted every
 * purchase as a gain.
 */
export function usePortfolioPerformance(period: PerformancePeriod) {
  return useQuery<PortfolioPerformanceData, Error>({
    queryKey: portfolioKeys.performance(period),
    queryFn: async () => {
      const metrics = await portfolioApi.getPerformance(period);
      const series = [...(metrics.series ?? [])].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
      return { metrics, series };
    },
    staleTime: 60_000,
    refetchOnMount: true,
    retry: 1,
  });
}

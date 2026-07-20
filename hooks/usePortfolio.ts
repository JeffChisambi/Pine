import { useQuery } from '@tanstack/react-query';
import { portfolioApi, Holding } from '../services/api';

export const portfolioKeys = {
  all:      ['portfolio'] as const,
  holdings: () => [...portfolioKeys.all, 'holdings'] as const,
  summary:  () => [...portfolioKeys.all, 'summary'] as const,
};

/** Fetch the user's current holdings. Refreshes every 5 minutes. */
export function useHoldings() {
  return useQuery<Holding[], Error>({
    queryKey: portfolioKeys.holdings(),
    queryFn:  () => portfolioApi.getHoldings(),
    staleTime: 5 * 60 * 1000,
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
  return holding ? parseFloat(holding.quantity) : 0;
}

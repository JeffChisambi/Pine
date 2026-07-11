import { useQuery } from '@tanstack/react-query';
import { stocksApi, ApiStock, ApiStockDetail } from '../services/api';

// Query key factory — stable, reusable, cache-friendly
export const stockKeys = {
  all: ['stocks'] as const,
  list: (sector?: string) => [...stockKeys.all, 'list', sector ?? 'all'] as const,
  search: (q: string) => [...stockKeys.all, 'search', q] as const,
  detail: (symbol: string) => [...stockKeys.all, 'detail', symbol.toUpperCase()] as const,
  sectors: () => [...stockKeys.all, 'sectors'] as const,
};

/** Fetch all MSE stocks with latest price data. Refreshes every 5 minutes. */
export function useStocks(sector?: string) {
  return useQuery<ApiStock[], Error>({
    queryKey: stockKeys.list(sector),
    queryFn: () => stocksApi.list(sector),
    staleTime: 5 * 60 * 1000,      // 5 min — matches backend Redis cache TTL
    refetchInterval: 5 * 60 * 1000, // auto-refresh every 5 min
    refetchOnWindowFocus: true,
  });
}

/** Search stocks by ticker or company name. Only fires when query ≥ 1 char. */
export function useStockSearch(query: string) {
  return useQuery<ApiStock[], Error>({
    queryKey: stockKeys.search(query),
    queryFn: () => stocksApi.search(query),
    enabled: query.trim().length >= 1,
    staleTime: 60 * 1000, // 1 min
  });
}

/** Fetch full detail + 30-day history for a single stock. */
export function useStockDetail(symbol: string | undefined) {
  return useQuery<ApiStockDetail, Error>({
    queryKey: stockKeys.detail(symbol ?? ''),
    queryFn: () => stocksApi.detail(symbol!),
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

/** Fetch available sector names for filtering. */
export function useStockSectors() {
  return useQuery<string[], Error>({
    queryKey: stockKeys.sectors(),
    queryFn: () => stocksApi.sectors(),
    staleTime: 60 * 60 * 1000, // 1 hour — sectors rarely change
  });
}

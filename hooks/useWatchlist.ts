/**
 * useWatchlist — Production-grade React Query hooks for the Pine watchlist.
 *
 * Strategy:
 *  - `useWatchedSymbols` fetches the cheap /watchlist/symbols endpoint on
 *    mount so every stock detail screen knows immediately if the star should
 *    be filled without triggering a full watchlist load.
 *  - `useToggleWatchlist` performs an optimistic update: the star flips
 *    instantly, then the server call is made. If it fails the star reverts
 *    and an error is surfaced.
 *  - Both mutations invalidate the watchlist queries so the home screen
 *    watchlist card stays in sync.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { watchlistApi } from '../services/api';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const watchlistKeys = {
  all:     ['watchlist'] as const,
  list:    () => [...watchlistKeys.all, 'list'] as const,
  symbols: () => [...watchlistKeys.all, 'symbols'] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Returns the set of ticker symbols the current user is watching.
 * Cheap endpoint — called once per session to seed icon state.
 */
export function useWatchedSymbols() {
  return useQuery<{ symbols: string[] }, Error>({
    queryKey: watchlistKeys.symbols(),
    queryFn:  () => watchlistApi.symbols(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Returns the full watchlist with enriched stock data.
 * Used on the home screen watchlist card.
 */
export function useWatchlist() {
  return useQuery<{ stocks: any[]; count: number }, Error>({
    queryKey: watchlistKeys.list(),
    queryFn:  () => watchlistApi.list(),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

/**
 * Returns a helper that tells whether a specific symbol is currently watched,
 * derived from the cached symbols set (no extra request).
 */
export function useIsWatched(symbol: string | undefined): boolean {
  const { data } = useWatchedSymbols();
  if (!symbol || !data?.symbols) return false;
  return data.symbols.includes(symbol.toUpperCase());
}

/**
 * Mutation hook for toggling a stock in/out of the watchlist.
 * Performs an optimistic update: the cached symbols set is updated instantly,
 * then the server call is made. On failure the cache is rolled back.
 */
export function useToggleWatchlist() {
  const queryClient = useQueryClient();

  return useMutation<
    { added: boolean; symbol: string },
    Error,
    { symbol: string; currentlyWatched: boolean }
  >({
    mutationFn: async ({ symbol, currentlyWatched }) => {
      const sym = symbol.toUpperCase();
      if (currentlyWatched) {
        await watchlistApi.remove(sym);
        return { added: false, symbol: sym };
      } else {
        await watchlistApi.add(sym);
        return { added: true, symbol: sym };
      }
    },

    // Optimistic update — flip the local cache before the server responds
    onMutate: async ({ symbol, currentlyWatched }) => {
      const sym = symbol.toUpperCase();

      // Cancel any in-flight refetches that could overwrite the optimistic data
      await queryClient.cancelQueries({ queryKey: watchlistKeys.symbols() });

      // Snapshot current state for rollback
      const prev = queryClient.getQueryData<{ symbols: string[] }>(watchlistKeys.symbols());

      // Apply optimistic update to the symbols cache
      queryClient.setQueryData<{ symbols: string[] }>(watchlistKeys.symbols(), (old) => {
        const set = new Set(old?.symbols ?? []);
        if (currentlyWatched) {
          set.delete(sym);
        } else {
          set.add(sym);
        }
        return { symbols: [...set] };
      });

      return { prev };
    },

    // On error, roll back the optimistic update
    onError: (_err, _vars, context: any) => {
      if (context?.prev !== undefined) {
        queryClient.setQueryData(watchlistKeys.symbols(), context.prev);
      }
    },

    // After success or failure, sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.symbols() });
      queryClient.invalidateQueries({ queryKey: watchlistKeys.list() });
    },
  });
}

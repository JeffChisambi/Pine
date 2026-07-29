/**
 * Shared QueryClient singleton.
 *
 * Exported from a dedicated module so that both the React tree
 * (QueryClientProvider in app/_layout.tsx) and non-React code
 * (auth-context logout) can reference the exact same instance —
 * allowing logout to call queryClient.clear() and guarantee that
 * no previous user's data leaks into the next user's session.
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      // 10-minute garbage-collect window — must be wiped on logout
      gcTime: 10 * 60 * 1000,
    },
  },
});

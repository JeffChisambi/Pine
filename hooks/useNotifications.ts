import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../services/api';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
};

/**
 * Live unread notification count for the bell badge.
 * Polls every 30s and refreshes on focus so the badge stays current;
 * mark-read flows invalidate `notificationKeys.all` to update instantly.
 */
export function useUnreadCount() {
  return useQuery<number, Error>({
    queryKey: notificationKeys.unread(),
    queryFn: async () => {
      const res = await notificationsApi.unread();
      return res.count ?? res.notifications?.length ?? 0;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

/** Invalidate all notification queries (call after markRead / markAllRead / delete). */
export function useInvalidateNotifications() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: notificationKeys.all });
}

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
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
  const query = useQuery<number, Error>({
    queryKey: notificationKeys.unread(),
    queryFn: async () => {
      const res = await notificationsApi.unread();
      return res.count ?? res.notifications?.length ?? 0;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  // Keep the APP ICON badge in step with the bell.
  //
  // A push carries a badge number, but that only ever counts UP: nothing on
  // the device clears it when the person reads their notifications, so the
  // icon would keep a stale number until the next push. Writing the live
  // count here means reading an inbox empties the icon too, and the two are
  // never allowed to disagree.
  const count = query.data;
  useEffect(() => {
    if (count == null) return;
    Notifications.setBadgeCountAsync(count).catch(() => {
      // Not every launcher supports badges; nothing here is worth an error.
    });
  }, [count]);

  return query;
}

/** Invalidate all notification queries (call after markRead / markAllRead / delete). */
export function useInvalidateNotifications() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: notificationKeys.all });
}

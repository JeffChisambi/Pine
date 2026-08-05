import { useQuery } from '@tanstack/react-query';
import { newsApi, type ApiNewsItem } from '../services/api';

export const newsKeys = {
  all: ['news'] as const,
  list: (category?: string) => [...newsKeys.all, 'list', category ?? 'all'] as const,
  detail: (id: string) => [...newsKeys.all, 'detail', id] as const,
};

/** Published news for the mobile News tab, optionally filtered by category. */
export function useNews(category?: string) {
  return useQuery<ApiNewsItem[], Error>({
    queryKey: newsKeys.list(category),
    queryFn: () => newsApi.list(category),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useNewsDetail(id: string | undefined) {
  return useQuery<ApiNewsItem, Error>({
    queryKey: newsKeys.detail(id ?? ''),
    queryFn: () => newsApi.detail(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

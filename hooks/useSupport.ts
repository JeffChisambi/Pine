import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  supportApi,
  type SupportAttachment,
  type SupportCategory,
  type SupportTicketSummary,
  type SupportTicketThread,
} from '../services/api';

export const supportKeys = {
  all: ['support'] as const,
  list: () => [...supportKeys.all, 'list'] as const,
  thread: (id: string) => [...supportKeys.all, 'thread', id] as const,
};

/** The user's support tickets ("My reports"). */
export function useSupportTickets() {
  return useQuery<SupportTicketSummary[], Error>({
    queryKey: supportKeys.list(),
    queryFn: () => supportApi.list(),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

/** A single ticket thread. Polls so staff replies appear without manual refresh. */
export function useSupportThread(id: string | undefined) {
  return useQuery<SupportTicketThread, Error>({
    queryKey: supportKeys.thread(id ?? ''),
    queryFn: () => supportApi.thread(id!),
    enabled: !!id,
    refetchInterval: 20 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      category: SupportCategory;
      subject: string;
      message: string;
      relatedTransactionId?: string;
      attachment?: SupportAttachment;
    }) =>
      supportApi.create(
        {
          category: input.category,
          subject: input.subject,
          message: input.message,
          relatedTransactionId: input.relatedTransactionId,
        },
        input.attachment,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: supportKeys.all }),
  });
}

export function useReplyTicket(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { message: string; attachment?: SupportAttachment }) =>
      supportApi.reply(ticketId, input.message, input.attachment),
    onSuccess: (thread) => {
      qc.setQueryData(supportKeys.thread(ticketId), thread);
      qc.invalidateQueries({ queryKey: supportKeys.list() });
    },
  });
}

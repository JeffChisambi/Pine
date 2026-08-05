import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { treasuryApi, type ApiTBillProduct, type ApiTBillInvestment } from '../services/api';

export const treasuryKeys = {
  all: ['treasury'] as const,
  products: () => [...treasuryKeys.all, 'products'] as const,
  investments: () => [...treasuryKeys.all, 'investments'] as const,
};

/** Available T-bill products (DB-driven). */
export function useTreasuryProducts() {
  return useQuery<ApiTBillProduct[], Error>({
    queryKey: treasuryKeys.products(),
    queryFn: () => treasuryApi.products(),
    staleTime: 5 * 60 * 1000,
  });
}

/** A single product resolved from the products list (no separate endpoint). */
export function useTreasuryProduct(id: string | undefined) {
  const q = useTreasuryProducts();
  return {
    ...q,
    data: id ? q.data?.find((p) => p.id === id) : undefined,
  };
}

/** The current user's T-bill investments. */
export function useMyInvestments() {
  return useQuery<ApiTBillInvestment[], Error>({
    queryKey: treasuryKeys.investments(),
    queryFn: () => treasuryApi.investments(),
    staleTime: 60 * 1000,
  });
}

/** Submit a new investment; invalidates the investments list on success. */
export function useInvest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { productId: string; amount: number }) => treasuryApi.invest(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: treasuryKeys.investments() }),
  });
}

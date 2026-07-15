/**
 * Wallet balance query + post-deposit reconciliation helpers.
 *
 * All screens that show the wallet balance should read it via `useWalletBalance()`
 * so that:
 *   - Calls are deduped and cached across screens (React Query)
 *   - A single `invalidateWalletBalance(qc)` call refreshes every consumer
 *   - The value is refetched on mount and when a screen regains focus
 *
 * When a deposit completes, call `reconcileDepositCredit()` — it polls the
 * server until the credited balance is actually visible (guards against any
 * brief backend eventual-consistency window) and can be resumed after an
 * app kill via the persisted pending-deposit record.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import { walletApi, type WalletBalance } from './api';

export const WALLET_BALANCE_QUERY_KEY = ['wallet', 'balance'] as const;
export const WALLET_HISTORY_QUERY_KEY = ['wallet', 'history'] as const;

/** AsyncStorage key for the pending deposit awaiting reconciliation. */
const PENDING_DEPOSIT_KEY = '@pine_pending_deposit';

export interface PendingDeposit {
  txRef: string;
  amount: number;
  /** Server-reported availableBalance right before the deposit was initiated. */
  prevAvailable: number;
  /** Epoch millis when the deposit was queued. */
  createdAt: number;
}

/** Deposit records older than this are considered expired and cleared. */
const PENDING_DEPOSIT_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWalletBalance() {
  return useQuery({
    queryKey: WALLET_BALANCE_QUERY_KEY,
    queryFn: () => walletApi.getBalance(),
    staleTime: 30_000,
    refetchOnMount: true,
    // React Native has no window focus, but this is harmless there and useful on web
    refetchOnWindowFocus: true,
  });
}

// ─── Invalidation ─────────────────────────────────────────────────────────────

export function invalidateWalletBalance(qc: QueryClient) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: WALLET_BALANCE_QUERY_KEY }),
    qc.invalidateQueries({ queryKey: WALLET_HISTORY_QUERY_KEY }),
  ]);
}

/**
 * Overlay an optimistic balance on top of the cached WalletBalance until the
 * server confirms the credit. The returned function reverts the overlay.
 */
export function setOptimisticBalance(
  qc: QueryClient,
  addAmount: number,
): () => void {
  const prev = qc.getQueryData<WalletBalance>(WALLET_BALANCE_QUERY_KEY);
  if (!prev) return () => {};

  const bumped: WalletBalance = {
    ...prev,
    balance: (Number(prev.balance || 0) + addAmount).toString(),
    availableBalance: (Number(prev.availableBalance || 0) + addAmount).toString(),
  };
  qc.setQueryData<WalletBalance>(WALLET_BALANCE_QUERY_KEY, bumped);

  return () => {
    // Only revert if nothing newer has landed
    const current = qc.getQueryData<WalletBalance>(WALLET_BALANCE_QUERY_KEY);
    if (current === bumped) {
      qc.setQueryData<WalletBalance>(WALLET_BALANCE_QUERY_KEY, prev);
    }
  };
}

// ─── Reconciliation ───────────────────────────────────────────────────────────

export interface ReconcileParams {
  /** Expected credit amount, e.g. deposit amount. */
  expectedIncrement: number;
  /** Available balance immediately before the deposit was initiated. */
  prevAvailable: number;
  /** Max attempts before giving up. Default 8 (≈ 12s of polling). */
  maxAttempts?: number;
  /** Delay between attempts in ms. Default 1500ms. */
  intervalMs?: number;
  /** Called on each fetched balance (for optional UI updates). */
  onProgress?: (b: WalletBalance) => void;
}

export type ReconcileOutcome =
  | { status: 'reflected'; balance: WalletBalance }
  | { status: 'timeout'; balance: WalletBalance | null };

/**
 * Poll `/wallet/balance` until the available balance shows at least the
 * expected credit — or the max attempts are exhausted.
 *
 * Notes:
 *   - Backend `processDeposit` is transactional and is awaited before the
 *     PayChangu callback redirects, so under normal conditions the very first
 *     fetch already reflects the credit. This retry loop exists for network
 *     hiccups and the rare case where the webhook (not the callback) is what
 *     ultimately credits the wallet.
 *   - Uses tolerant comparison (>= prev + expected - 0.01) to avoid floating
 *     point false-negatives.
 */
export async function reconcileDepositCredit(
  qc: QueryClient,
  { expectedIncrement, prevAvailable, maxAttempts = 8, intervalMs = 1500, onProgress }: ReconcileParams,
): Promise<ReconcileOutcome> {
  const target = prevAvailable + expectedIncrement - 0.01;
  let last: WalletBalance | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const b = await walletApi.getBalance();
      last = b;
      onProgress?.(b);

      if (Number(b.availableBalance || 0) >= target) {
        // Server confirmed the credit — safe to replace the optimistic value
        // with the authoritative server value.
        qc.setQueryData<WalletBalance>(WALLET_BALANCE_QUERY_KEY, b);
        // Also refresh history so recent-transactions views catch up
        qc.invalidateQueries({ queryKey: WALLET_HISTORY_QUERY_KEY }).catch(() => {});
        return { status: 'reflected', balance: b };
      }
      // Server hasn't propagated the credit yet — do NOT overwrite the cache.
      // The optimistic value stays visible to the user until we confirm.
    } catch {
      // swallow — we'll retry
    }
    if (attempt < maxAttempts - 1) {
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }

  return { status: 'timeout', balance: last };
}

// ─── Pending deposit persistence ──────────────────────────────────────────────

/**
 * Persist a pending deposit so that if the app is killed between the PayChangu
 * checkout and Home rendering, the reconciliation can still resume on next open.
 */
export async function savePendingDeposit(pd: PendingDeposit): Promise<void> {
  try {
    await AsyncStorage.setItem(PENDING_DEPOSIT_KEY, JSON.stringify(pd));
  } catch {
    /* non-fatal */
  }
}

export async function loadPendingDeposit(): Promise<PendingDeposit | null> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_DEPOSIT_KEY);
    if (!raw) return null;
    const pd = JSON.parse(raw) as PendingDeposit;
    if (!pd || typeof pd.amount !== 'number' || typeof pd.createdAt !== 'number') {
      await clearPendingDeposit();
      return null;
    }
    if (Date.now() - pd.createdAt > PENDING_DEPOSIT_MAX_AGE_MS) {
      await clearPendingDeposit();
      return null;
    }
    return pd;
  } catch {
    return null;
  }
}

export async function clearPendingDeposit(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PENDING_DEPOSIT_KEY);
  } catch {
    /* non-fatal */
  }
}

/** Convenience: pull a numeric available balance from the cache, or 0. */
export function readCachedAvailable(qc: QueryClient): number {
  const b = qc.getQueryData<WalletBalance>(WALLET_BALANCE_QUERY_KEY);
  return Number(b?.availableBalance ?? b?.balance ?? 0);
}

/** Convenience hook: returns the queryClient + wallet balance together. */
export function useWalletQueryClient() {
  return useQueryClient();
}

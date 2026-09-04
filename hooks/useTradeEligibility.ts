/**
 * Whether this account may place an order yet, and what is missing if not.
 *
 * Two things gate trading, both enforced by the server: an investor must have
 * chosen the broker who will execute and hold their orders, and their identity
 * must be verified. The server refuses orders without either — this hook is so
 * the app can say so on the button instead of letting someone fill in a whole
 * order and meet the refusal at the end.
 *
 * Broker comes first when both are missing: KYC is reviewed BY the broker, so
 * there is nothing to verify until one is chosen.
 */
import { useCallback } from 'react';
import { router } from 'expo-router';
import { guardedPush } from '@/utils/navigation';
import { useAuth } from '@/services/auth-context';

export type TradeBlockReason = 'broker' | 'kyc' | null;

export interface TradeEligibility {
  /** False while the profile is still loading, so nothing flashes as blocked. */
  ready: boolean;
  canTrade: boolean;
  reason: TradeBlockReason;
  /** Short enough to sit under a button. */
  shortLabel: string | null;
  /** What the person should do, in a sentence. */
  message: string | null;
  /** Sends them to the screen that fixes it. */
  resolve: () => void;
}

export function useTradeEligibility(): TradeEligibility {
  const { user, isLoading } = useAuth();

  const hasBroker = !!user?.broker;
  const kycApproved = user?.kycStatus === 'APPROVED';
  const reason: TradeBlockReason = !user ? null : !hasBroker ? 'broker' : !kycApproved ? 'kyc' : null;

  const resolve = useCallback(() => {
    if (reason === 'broker') guardedPush(() => router.push('/broker-select' as any));
    else if (reason === 'kyc') guardedPush(() => router.push('/kyc/upload-id' as any));
  }, [reason]);

  return {
    ready: !isLoading && !!user,
    canTrade: !!user && reason === null,
    reason,
    shortLabel:
      reason === 'broker' ? 'Select a broker first'
        : reason === 'kyc' ? 'Verify your identity first'
          : null,
    message:
      reason === 'broker'
        ? 'Choose a broker before you trade — your orders are executed and held by them.'
        : reason === 'kyc'
          ? 'Your identity has to be verified before you can trade. It usually takes a few minutes.'
          : null,
    resolve,
  };
}

/** Copy for the "why can't I?" prompt, shared by the alert and the buy screen. */
export function tradeBlockTitle(reason: TradeBlockReason): string {
  return reason === 'broker' ? 'Select a broker' : 'Verify your identity';
}

export function tradeBlockAction(reason: TradeBlockReason): string {
  return reason === 'broker' ? 'Select broker' : 'Verify now';
}

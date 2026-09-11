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
import { useCallback, useEffect, useRef, useState } from 'react';
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
  const { user, isLoading, refreshProfile } = useAuth();

  const hasBroker = !!user?.broker;
  const kycApproved = user?.kycStatus === 'APPROVED';
  const reason: TradeBlockReason = !user ? null : !hasBroker ? 'broker' : !kycApproved ? 'kyc' : null;

  // Both blocks are cleared by something that happens away from this phone
  // (the broker is assigned server-side, KYC is approved by a reviewer), so
  // the cached profile is the one thing we must not trust when it says no.
  // Re-read it once per screen before letting the block stand; the server
  // also places an unassigned account with the default broker on that read,
  // so an account that CAN be linked comes back linked.
  const rechecked = useRef(false);
  const [rechecking, setRechecking] = useState(false);
  useEffect(() => {
    if (reason === null || rechecked.current) return;
    rechecked.current = true;
    let live = true;
    setRechecking(true);
    refreshProfile().finally(() => { if (live) setRechecking(false); });
    return () => { live = false; };
  }, [reason, refreshProfile]);

  const resolve = useCallback(() => {
    // Investors no longer pick a broker: Pine's partner is assigned at
    // registration. An account without one is a support matter.
    if (reason === 'broker') guardedPush(() => router.push('/help' as any));
    else if (reason === 'kyc') guardedPush(() => router.push('/kyc/upload-id' as any));
  }, [reason]);

  // While the recheck is in flight the block is withheld entirely: nothing
  // is shown and a tap does nothing, so the button never flashes a reason
  // that the fresh profile is about to remove.
  const shown: TradeBlockReason = rechecking ? null : reason;

  return {
    ready: !isLoading && !!user && !rechecking,
    canTrade: !!user && !rechecking && reason === null,
    reason: shown,
    shortLabel:
      shown === 'broker' ? 'Account not linked to a broker'
        : shown === 'kyc' ? 'Verify your identity first'
          : null,
    message:
      shown === 'broker'
        ? 'Your account is not linked to a broker yet, so orders cannot be placed. Contact support and we will sort it out.'
        : shown === 'kyc'
          ? 'Your identity has to be verified before you can trade. It usually takes a few minutes.'
          : null,
    resolve,
  };
}

/** Copy for the "why can't I?" prompt, shared by the alert and the buy screen. */
export function tradeBlockTitle(reason: TradeBlockReason): string {
  return reason === 'broker' ? 'Account not linked' : 'Verify your identity';
}

export function tradeBlockAction(reason: TradeBlockReason): string {
  return reason === 'broker' ? 'Contact support' : 'Verify now';
}

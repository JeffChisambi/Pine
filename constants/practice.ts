/**
 * Practice (virtual) trading.
 *
 * This branch of the app talks to a server running with VIRTUAL_TRADING=true:
 * play money, no identity verification, orders that fill the moment they are
 * placed, and a deposit allowance of MWK 500,000 in any rolling year. The
 * flag lets screens drop the parts of the real app that make no sense here
 * (KYC prompts, withdrawals, card payments) without deleting them, so the
 * branch stays close enough to main to keep merging.
 */
export const PRACTICE_MODE = true;

/** Mirrors the server's VIRTUAL_DEPOSIT_CAP; the server is the authority. */
export const PRACTICE_DEPOSIT_CAP = 500_000;

import type { ApiTBillInvestment } from '../services/api';
import type { TBillInvestment } from '../data/treasury';

/** Map a backend investment to the mobile TBillInvestment shape. */
export function mapInvestment(a: ApiTBillInvestment): TBillInvestment {
  const s = (a.status || '').toLowerCase();
  const status: TBillInvestment['status'] =
    s === 'active' ? 'active' : s === 'matured' ? 'matured' : s === 'cancelled' ? 'closed' : 'pending';
  const stage: TBillInvestment['stage'] =
    status === 'active' ? 'active' : status === 'matured' ? 'matured' : 'submitted';
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime())
      ? iso
      : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  return {
    id: a.investmentId,
    billId: a.product?.id ?? '',
    duration: a.product?.duration ?? 0,
    amountInvested: Number(a.amount) || 0,
    estimatedMaturityValue: Number(a.maturityValue) || 0,
    estimatedEarnings: Number(a.earnings) || 0,
    status,
    investmentDate: fmt(a.createdAt),
    maturityDate: fmt(a.maturityDate),
    referenceNumber: `TBL-${a.investmentId.slice(0, 8).toUpperCase()}`,
    stage,
  };
}

/** The annual yield for an investment (from its product), for display. */
export function investmentYield(a: ApiTBillInvestment): number {
  return a.product?.yieldPct ?? a.yieldPercent ?? 0;
}

/** Placeholder investment while the list is loading or id is unknown. */
export const EMPTY_INVESTMENT: TBillInvestment = {
  id: '', billId: '', duration: 0, amountInvested: 0, estimatedMaturityValue: 0,
  estimatedEarnings: 0, status: 'pending', investmentDate: '', maturityDate: '',
  referenceNumber: '', stage: 'submitted',
};

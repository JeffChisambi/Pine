export interface TBillOption {
  id: string;
  duration: 91 | 182 | 364;
  yieldPct: number;
  minInvestment: number;
  maxInvestment?: number;
  riskLevel: "Low" | "Very Low";
  nextAuction: string;
  auctionDate: string;
  issueDate: string;
  maturityDate: string;
  status: "open" | "closing_soon" | "closed";
}

export interface TBillInvestment {
  id: string;
  billId: string;
  duration: number;
  amountInvested: number;
  estimatedMaturityValue: number;
  estimatedEarnings: number;
  status: "active" | "pending" | "matured" | "closed";
  investmentDate: string;
  maturityDate: string;
  referenceNumber: string;
  stage: "submitted" | "pending_auction" | "allocated" | "issued" | "active" | "matured" | "paid_out";
}

export const TBILL_OPTIONS: TBillOption[] = [
  {
    id: "tb91",
    duration: 91,
    yieldPct: 24.5,
    minInvestment: 100000,
    riskLevel: "Very Low",
    nextAuction: "28 Jul 2026",
    auctionDate: "28 Jul 2026",
    issueDate: "30 Jul 2026",
    maturityDate: "29 Oct 2026",
    status: "open",
  },
  {
    id: "tb182",
    duration: 182,
    yieldPct: 26.0,
    minInvestment: 100000,
    riskLevel: "Very Low",
    nextAuction: "28 Jul 2026",
    auctionDate: "28 Jul 2026",
    issueDate: "30 Jul 2026",
    maturityDate: "28 Jan 2027",
    status: "closing_soon",
  },
  {
    id: "tb364",
    duration: 364,
    yieldPct: 28.5,
    minInvestment: 100000,
    riskLevel: "Low",
    nextAuction: "28 Jul 2026",
    auctionDate: "28 Jul 2026",
    issueDate: "30 Jul 2026",
    maturityDate: "29 Jul 2027",
    status: "open",
  },
];

export const MOCK_INVESTMENTS: TBillInvestment[] = [
  {
    id: "inv001",
    billId: "tb91",
    duration: 91,
    amountInvested: 500000,
    estimatedMaturityValue: 530685,
    estimatedEarnings: 30685,
    status: "active",
    investmentDate: "15 Apr 2026",
    maturityDate: "15 Jul 2026",
    referenceNumber: "TBL-2026-04-001",
    stage: "active",
  },
  {
    id: "inv002",
    billId: "tb182",
    duration: 182,
    amountInvested: 1000000,
    estimatedMaturityValue: 1130000,
    estimatedEarnings: 130000,
    status: "pending",
    investmentDate: "20 Jul 2026",
    maturityDate: "18 Jan 2027",
    referenceNumber: "TBL-2026-07-024",
    stage: "pending_auction",
  },
];

export function calculateReturns(amount: number, yieldPct: number, days: number) {
  const annualRate = yieldPct / 100;
  const periodRate = annualRate * (days / 365);
  const earnings = Math.floor(amount * periodRate);
  const maturityValue = amount + earnings;
  return { earnings, maturityValue };
}

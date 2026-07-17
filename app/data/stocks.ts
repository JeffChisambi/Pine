// Stock data types — populated at runtime from GET /stocks
export interface StockData {
  id: string;
  ticker: string;
  name: string;
  logo: any;
  price: string;
  change: string;
  positive: boolean;
  // optional holdings fields
  shares?: string;
  value?: string;
  changePct?: string;
  changePctNum?: number;
}

// Empty — filled by the API
export const STOCKS: StockData[] = [];

export default function Dummy() {
  return null;
}

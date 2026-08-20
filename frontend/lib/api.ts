const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tradepulse-backend-l79z.onrender.com';

export type LatestSpot = {
  symbol: string;
  value: number | null;
  change: number | null;
  pct: number | null;
  asOf?: string;
};

export type OptionChainRow = {
  strike: number;
  callLtp?: number;
  callMoneyness?: string;
  putLtp?: number;
  putMoneyness?: string;
};

export type OptionChainResponse = {
  symbol: string;
  expiry: string | null;
  spot: number | null;
  chain: OptionChainRow[];
};

export async function fetchLatestSpot(): Promise<LatestSpot[]> {
  const res = await fetch(`${BACKEND_URL}/api/analysis/latest-spot`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch latest spot prices');
  return res.json();
}

export async function fetchOptionChain(symbol: string): Promise<OptionChainResponse> {
  const res = await fetch(`${BACKEND_URL}/api/analysis/option-chain?symbol=${symbol}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch option chain');
  return res.json();
}

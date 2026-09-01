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

export type PcrMaxPain = {
  symbol: string;
  expiry: string | null;
  pcr: number | null;
  maxPain: number | null;
  note?: string | null;
};

export async function fetchPcrMaxPain(symbol: string): Promise<PcrMaxPain> {
  const res = await fetch(`${BACKEND_URL}/api/analysis/pcr-maxpain?symbol=${symbol}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch PCR/Max Pain');
  return res.json();
}

export type SpotHistoryPoint = { candle_time: string; close: number };

export async function fetchSpotHistory(symbol: string): Promise<SpotHistoryPoint[]> {
  const res = await fetch(`${BACKEND_URL}/api/analysis/spot-history?symbol=${symbol}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch spot history');
  const data = await res.json();
  return data.points || [];
}

export type GreeksRow = {
  strike: number;
  type: 'CE' | 'PE';
  price: number;
  ivPct: number | null;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
};

export type GreeksResponse = {
  symbol: string;
  spot: number;
  expiry: string;
  daysToExpiry: number;
  chain: GreeksRow[];
};

export async function fetchGreeks(symbol: string): Promise<GreeksResponse> {
  const res = await fetch(`${BACKEND_URL}/api/analysis/greeks?symbol=${symbol}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch Greeks');
  return res.json();
}

export type Strategy = {
  id: string;
  name: string;
  symbol: string;
  legs: any[];
  stop_loss_pct: number | null;
  target_pct: number | null;
  source: string;
  status: string;
  created_at: string;
};

export async function fetchStrategies(): Promise<Strategy[]> {
  const { authFetch } = await import('./auth');
  const res = await authFetch('/api/strategy/list');
  if (!res.ok) throw new Error('Failed to fetch strategies');
  const data = await res.json();
  return data.strategies || [];
}

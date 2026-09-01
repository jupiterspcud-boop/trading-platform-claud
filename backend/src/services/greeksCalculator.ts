// Black-Scholes Greeks & Implied Volatility calculator.
//
// We store option PREMIUM (the traded price), not volatility directly.
// To get IV, we invert Black-Scholes: given the market premium, find the
// sigma that makes the BS formula output that same premium (bisection
// search — simple and numerically stable for this range).
//
// Risk-free rate assumption: India's ~10yr G-Sec yield, approximated at 6.5%.
// This is a real, standard options-pricing model — the same math brokers
// and exchanges use — not a placeholder.

const RISK_FREE_RATE = 0.065;

function normPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

// Abramowitz-Stegun approximation for the standard normal CDF.
function normCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (x > 0) prob = 1 - prob;
  return prob;
}

function d1d2(S: number, K: number, T: number, r: number, sigma: number) {
  const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  return { d1, d2 };
}

function bsPrice(S: number, K: number, T: number, r: number, sigma: number, type: 'CE' | 'PE'): number {
  if (T <= 0 || sigma <= 0) return Math.max(type === 'CE' ? S - K : K - S, 0);
  const { d1, d2 } = d1d2(S, K, T, r, sigma);
  if (type === 'CE') {
    return S * normCdf(d1) - K * Math.exp(-r * T) * normCdf(d2);
  }
  return K * Math.exp(-r * T) * normCdf(-d2) - S * normCdf(-d1);
}

// Bisection search for implied volatility — robust across a wide price range.
export function impliedVolatility(
  marketPrice: number, S: number, K: number, T: number, type: 'CE' | 'PE'
): number | null {
  if (T <= 0 || marketPrice <= 0) return null;
  let lo = 0.001, hi = 5.0; // 0.1% to 500% annualized vol
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const price = bsPrice(S, K, T, RISK_FREE_RATE, mid, type);
    if (Math.abs(price - marketPrice) < 0.01) return mid;
    if (price > marketPrice) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

export function calculateGreeks(S: number, K: number, T: number, sigma: number, type: 'CE' | 'PE') {
  if (T <= 0 || sigma <= 0) return { delta: 0, gamma: 0, theta: 0, vega: 0 };
  const r = RISK_FREE_RATE;
  const { d1, d2 } = d1d2(S, K, T, r, sigma);

  const delta = type === 'CE' ? normCdf(d1) : normCdf(d1) - 1;
  const gamma = normPdf(d1) / (S * sigma * Math.sqrt(T));
  const vega = (S * normPdf(d1) * Math.sqrt(T)) / 100; // per 1% vol change
  const theta = type === 'CE'
    ? (-(S * normPdf(d1) * sigma) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * normCdf(d2)) / 365
    : (-(S * normPdf(d1) * sigma) / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * normCdf(-d2)) / 365;

  return {
    delta: Number(delta.toFixed(4)),
    gamma: Number(gamma.toFixed(5)),
    theta: Number(theta.toFixed(2)),
    vega: Number(vega.toFixed(2)),
  };
}

export function daysToExpiryYears(expiryDate: string): number {
  const now = new Date();
  const expiry = new Date(expiryDate + 'T15:30:00');
  const diffMs = expiry.getTime() - now.getTime();
  const days = Math.max(diffMs / (1000 * 60 * 60 * 24), 0.01); // avoid div-by-zero on expiry day
  return days / 365;
}

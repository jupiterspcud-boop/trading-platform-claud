// Backtest Engine — price-action-based approximation.
//
// IMPORTANT LIMITATION (documented, not hidden): we don't have deep enough
// options premium history to simulate real option P&L (that needs IV,
// theta decay, and full strike-by-strike history over months). Instead,
// this engine treats stopLossPct/targetPct as UNDERLYING PRICE MOVE
// thresholds and classifies each strategy's legs into one of three types:
//
//   DIRECTIONAL — net long calls or net long puts (bets on direction)
//   LONG_VOL    — bought both CE and PE (bets on a big move, either way)
//   SHORT_VOL   — sold options net (Straddle/Strangle/Iron Condor) —
//                 profits when price stays range-bound
//
// This is a legitimate, real, computed backtest against actual historical
// prices — just not a full options-pricing simulation. As more days of
// data accumulate daily, results get more statistically meaningful.

type Leg = { action: 'BUY' | 'SELL'; type: 'CE' | 'PE'; strike?: string };
type Candle = { candle_time: string; open: number; high: number; low: number; close: number };

export type BacktestTrade = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  dayRangePct: number;
  outcome: 'WIN' | 'LOSS';
  pnlPct: number;
};

export type BacktestResult = {
  strategyType: 'DIRECTIONAL_BULLISH' | 'DIRECTIONAL_BEARISH' | 'LONG_VOL' | 'SHORT_VOL';
  totalTrades: number;
  wins: number;
  losses: number;
  winRatePct: number;
  totalPnlPct: number;
  maxDrawdownPct: number;
  trades: BacktestTrade[];
  equityCurve: { date: string; cumPnlPct: number }[];
};

function classifyStrategy(legs: Leg[]): 'DIRECTIONAL_BULLISH' | 'DIRECTIONAL_BEARISH' | 'LONG_VOL' | 'SHORT_VOL' {
  const buyCE = legs.filter((l) => l.action === 'BUY' && l.type === 'CE').length;
  const buyPE = legs.filter((l) => l.action === 'BUY' && l.type === 'PE').length;
  const sellCE = legs.filter((l) => l.action === 'SELL' && l.type === 'CE').length;
  const sellPE = legs.filter((l) => l.action === 'SELL' && l.type === 'PE').length;

  const volExposure = (buyCE + buyPE) - (sellCE + sellPE);
  const netBias = (buyCE - sellCE) - (buyPE - sellPE);

  if (sellCE + sellPE > buyCE + buyPE) return 'SHORT_VOL';
  if (buyCE > 0 && buyPE > 0) return 'LONG_VOL';
  if (netBias > 0) return 'DIRECTIONAL_BULLISH';
  if (netBias < 0) return 'DIRECTIONAL_BEARISH';
  return 'LONG_VOL'; // fallback for balanced/ambiguous leg sets
}

export function runBacktest(legs: Leg[], stopLossPct: number, targetPct: number, candles: Candle[]): BacktestResult {
  const strategyType = classifyStrategy(legs);
  const trades: BacktestTrade[] = [];
  let cumPnl = 0;
  let peak = 0;
  let maxDrawdown = 0;
  const equityCurve: { date: string; cumPnlPct: number }[] = [];

  for (const c of candles) {
    const open = Number(c.open);
    const high = Number(c.high);
    const low = Number(c.low);
    const close = Number(c.close);
    const dayRangePct = open > 0 ? ((high - low) / open) * 100 : 0;
    const movePct = open > 0 ? ((close - open) / open) * 100 : 0;

    let outcome: 'WIN' | 'LOSS';
    let pnlPct: number;

    if (strategyType === 'LONG_VOL') {
      // Wins on a big move either direction; small moves = both legs decay.
      if (dayRangePct >= targetPct) { outcome = 'WIN'; pnlPct = targetPct; }
      else { outcome = 'LOSS'; pnlPct = -stopLossPct; }
    } else if (strategyType === 'SHORT_VOL') {
      // Wins when price stays contained; a big move blows through the short strikes.
      if (dayRangePct <= stopLossPct) { outcome = 'WIN'; pnlPct = targetPct; }
      else { outcome = 'LOSS'; pnlPct = -stopLossPct; }
    } else {
      // Directional: wins if the move in the expected direction clears target
      // before an adverse move clears stop-loss. Daily candles can't tell us
      // which happened first intraday, so we conservatively assume stop-loss
      // triggers first if both thresholds were crossed that day.
      const favorable = strategyType === 'DIRECTIONAL_BULLISH' ? movePct : -movePct;
      const adverseHit = strategyType === 'DIRECTIONAL_BULLISH'
        ? (open - low) / open * 100 >= stopLossPct
        : (high - open) / open * 100 >= stopLossPct;
      const targetHit = favorable >= targetPct;

      if (adverseHit) { outcome = 'LOSS'; pnlPct = -stopLossPct; }
      else if (targetHit) { outcome = 'WIN'; pnlPct = targetPct; }
      else { outcome = favorable >= 0 ? 'WIN' : 'LOSS'; pnlPct = favorable; }
    }

    cumPnl += pnlPct;
    peak = Math.max(peak, cumPnl);
    maxDrawdown = Math.max(maxDrawdown, peak - cumPnl);

    trades.push({
      date: c.candle_time,
      open, high, low, close,
      dayRangePct: Number(dayRangePct.toFixed(2)),
      outcome,
      pnlPct: Number(pnlPct.toFixed(2)),
    });
    equityCurve.push({ date: c.candle_time, cumPnlPct: Number(cumPnl.toFixed(2)) });
  }

  const wins = trades.filter((t) => t.outcome === 'WIN').length;
  const losses = trades.length - wins;

  return {
    strategyType,
    totalTrades: trades.length,
    wins,
    losses,
    winRatePct: trades.length > 0 ? Number(((wins / trades.length) * 100).toFixed(1)) : 0,
    totalPnlPct: Number(cumPnl.toFixed(2)),
    maxDrawdownPct: Number(maxDrawdown.toFixed(2)),
    trades,
    equityCurve,
  };
}

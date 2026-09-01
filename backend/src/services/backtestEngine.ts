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

function percentile(sortedArr: number[], p: number): number {
  if (sortedArr.length === 0) return 0;
  const idx = Math.floor(p * (sortedArr.length - 1));
  return sortedArr[idx];
}

// Trigger conditions — reuses the "Previous Day" reference level from the
// Technical Levels engine. Only days where the trigger condition actually
// fires are counted as trades; other days are skipped entirely.
export type TriggerCondition = 'NONE' | 'PREV_DAY_BREAKOUT_HIGH' | 'PREV_DAY_BREAKOUT_LOW';

function triggerFires(trigger: TriggerCondition, today: Candle, prevDay: Candle | null): boolean {
  if (trigger === 'NONE') return true;
  if (!prevDay) return false; // no previous day to compare against (e.g. first day in dataset)
  if (trigger === 'PREV_DAY_BREAKOUT_HIGH') return Number(today.high) > Number(prevDay.high);
  if (trigger === 'PREV_DAY_BREAKOUT_LOW') return Number(today.low) < Number(prevDay.low);
  return true;
}

export function runBacktest(
  legs: Leg[],
  stopLossPct: number,
  targetPct: number,
  candles: Candle[],
  trigger: TriggerCondition = 'NONE'
): BacktestResult {
  const strategyType = classifyStrategy(legs);
  const trades: BacktestTrade[] = [];
  let cumPnl = 0;
  let peak = 0;
  let maxDrawdown = 0;
  const equityCurve: { date: string; cumPnlPct: number }[] = [];

  // FIX: A per-instrument percentile threshold (e.g. "70th percentile of
  // THIS instrument's own range distribution") is self-normalizing — by
  // definition it always produces roughly the same ~70/30 win rate for
  // ANY instrument, which is why NIFTY/BANKNIFTY/SENSEX all looked
  // identical before. Using one FIXED absolute threshold across all
  // instruments instead means genuinely more volatile instruments (e.g.
  // BANKNIFTY typically moves more than NIFTY/SENSEX) now correctly show
  // a different, lower win rate for short-vol strategies, and vice versa.
  const VOLATILITY_THRESHOLD_PCT = 1.0; // typical 1-day ATM straddle breakeven zone

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const prevDay = i > 0 ? candles[i - 1] : null;

    if (!triggerFires(trigger, c, prevDay)) continue; // skip days where the trigger didn't fire

    const open = Number(c.open);
    const high = Number(c.high);
    const low = Number(c.low);
    const close = Number(c.close);
    const dayRangePct = open > 0 ? ((high - low) / open) * 100 : 0;
    const movePct = open > 0 ? ((close - open) / open) * 100 : 0;

    let outcome: 'WIN' | 'LOSS';
    let pnlPct: number;

    if (strategyType === 'LONG_VOL') {
      // Wins on a big move either direction.
      if (dayRangePct >= VOLATILITY_THRESHOLD_PCT) { outcome = 'WIN'; pnlPct = targetPct; }
      else { outcome = 'LOSS'; pnlPct = -stopLossPct; }
    } else if (strategyType === 'SHORT_VOL') {
      // Wins when price stays contained within the threshold.
      if (dayRangePct <= VOLATILITY_THRESHOLD_PCT) { outcome = 'WIN'; pnlPct = targetPct; }
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

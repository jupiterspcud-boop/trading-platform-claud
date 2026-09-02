import { Router } from 'express';
import { supabase } from '../services/supabaseClient';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const router = Router();

const VIRTUAL_CAPITAL = 100000; // ₹1,00,000 notional per strategy, for P&L% -> ₹ conversion
const CRON_SECRET = process.env.CRON_SECRET || '';

// Shared evaluation logic — used by both the manual (logged-in user) trigger
// and the daily cron batch job.
async function evaluatePaperTrade(strategyId: string) {
  const { data: strategy, error: stratErr } = await supabase
    .from('strategies').select('*').eq('id', strategyId).single();
  if (stratErr || !strategy) throw new Error('Strategy not found');

  const { data: instrument } = await supabase
    .from('instruments').select('id').eq('symbol', strategy.symbol).single();
  if (!instrument) throw new Error(`Instrument not found: ${strategy.symbol}`);

  const { data: candles } = await supabase
    .from('spot_ohlc')
    .select('candle_time, open, high, low, close')
    .eq('instrument_id', instrument.id)
    .order('candle_time', { ascending: false })
    .limit(2);

  if (!candles || candles.length === 0) {
    return { success: false, error: 'No data available for this instrument yet.' };
  }

  const today = candles[0];
  const prevDay = candles[1] || null;

  const { data: existingTrade } = await supabase
    .from('trades')
    .select('id')
    .eq('strategy_id', strategyId)
    .eq('entered_at', today.candle_time)
    .maybeSingle();
  if (existingTrade) {
    return { success: true, note: 'Already evaluated for this trading day.', skipped: true };
  }

  const trigger = strategy.trigger_condition || 'NONE';
  let triggerFired = trigger === 'NONE';
  if (trigger === 'PREV_DAY_BREAKOUT_HIGH' && prevDay) triggerFired = Number(today.high) > Number(prevDay.high);
  if (trigger === 'PREV_DAY_BREAKOUT_LOW' && prevDay) triggerFired = Number(today.low) < Number(prevDay.low);

  if (!triggerFired) {
    return { success: true, note: 'Trigger did not fire today — no paper trade logged.', triggered: false };
  }

  const open = Number(today.open);
  const high = Number(today.high);
  const low = Number(today.low);
  const close = Number(today.close);
  const dayRangePct = open > 0 ? ((high - low) / open) * 100 : 0;
  const movePct = open > 0 ? ((close - open) / open) * 100 : 0;

  const legs = strategy.legs || [];
  const buyCE = legs.filter((l: any) => l.action === 'BUY' && l.type === 'CE').length;
  const buyPE = legs.filter((l: any) => l.action === 'BUY' && l.type === 'PE').length;
  const sellCE = legs.filter((l: any) => l.action === 'SELL' && l.type === 'CE').length;
  const sellPE = legs.filter((l: any) => l.action === 'SELL' && l.type === 'PE').length;
  const volExposure = (buyCE + buyPE) - (sellCE + sellPE);
  const VOLATILITY_THRESHOLD_PCT = 1.0;

  let pnlPct: number;
  if (volExposure < 0) {
    pnlPct = dayRangePct <= VOLATILITY_THRESHOLD_PCT ? Number(strategy.target_pct) : -Number(strategy.stop_loss_pct);
  } else if (buyCE > 0 && buyPE > 0) {
    pnlPct = dayRangePct >= VOLATILITY_THRESHOLD_PCT ? Number(strategy.target_pct) : -Number(strategy.stop_loss_pct);
  } else {
    pnlPct = movePct >= 0 ? Math.min(movePct, Number(strategy.target_pct)) : Math.max(movePct, -Number(strategy.stop_loss_pct));
  }

  const pnlAmount = (VIRTUAL_CAPITAL * pnlPct) / 100;

  const { data: trade, error: tradeErr } = await supabase
    .from('trades')
    .insert({
      strategy_id: strategyId,
      broker: 'PAPER',
      symbol: strategy.symbol,
      leg_type: legs.map((l: any) => l.type).join('+') || 'N/A',
      action: 'SIMULATED',
      entry_price: open,
      exit_price: close,
      pnl: Number(pnlAmount.toFixed(2)),
      entered_at: today.candle_time,
      exited_at: today.candle_time,
    })
    .select()
    .single();
  if (tradeErr) throw new Error(tradeErr.message);

  if (strategy.status !== 'paper') {
    await supabase.from('strategies').update({ status: 'paper' }).eq('id', strategyId);
  }

  return { success: true, triggered: true, trade, pnlPct: Number(pnlPct.toFixed(2)) };
}

// POST /api/execute/paper-trade  { strategyId } — manual trigger, requires login + ownership
router.post('/paper-trade', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { strategyId } = req.body;
    if (!strategyId) return res.status(400).json({ success: false, error: 'strategyId is required' });

    const { data: strategy } = await supabase.from('strategies').select('user_id').eq('id', strategyId).single();
    if (strategy?.user_id && strategy.user_id !== req.userId) {
      return res.status(403).json({ success: false, error: 'Not your strategy' });
    }

    const result = await evaluatePaperTrade(strategyId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/execute/run-all-paper?secret=... — same as above, but GET-based
// so it can be tested directly from a browser URL bar. cron-job.org can use
// either this GET version (with ?secret=) or the POST version with a header.
router.get('/run-all-paper', async (req, res) => {
  try {
    const providedSecret = req.query.secret as string;
    if (!CRON_SECRET || providedSecret !== CRON_SECRET) {
      return res.status(401).json({ success: false, error: 'Invalid or missing secret' });
    }

    const { data: strategies, error } = await supabase
      .from('strategies').select('id, name').eq('status', 'paper');
    if (error) throw new Error(error.message);

    const results: any[] = [];
    for (const s of strategies || []) {
      try {
        const r = await evaluatePaperTrade(s.id);
        results.push({ strategyId: s.id, name: s.name, ...r });
      } catch (err: any) {
        results.push({ strategyId: s.id, name: s.name, success: false, error: err.message });
      }
    }
    res.json({ success: true, evaluated: results.length, results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/execute/run-all-paper — for the daily cron job. Protected by a
// shared secret header (not user login) since cron-job.org can't hold a
// per-user session. Runs evaluation for every strategy currently marked
// status='paper', across all users.
router.post('/run-all-paper', async (req, res) => {
  try {
    const providedSecret = req.headers['x-cron-secret'];
    if (!CRON_SECRET || providedSecret !== CRON_SECRET) {
      return res.status(401).json({ success: false, error: 'Invalid or missing cron secret' });
    }

    const { data: strategies, error } = await supabase
      .from('strategies').select('id, name').eq('status', 'paper');
    if (error) throw new Error(error.message);

    const results: any[] = [];
    for (const s of strategies || []) {
      try {
        const r = await evaluatePaperTrade(s.id);
        results.push({ strategyId: s.id, name: s.name, ...r });
      } catch (err: any) {
        results.push({ strategyId: s.id, name: s.name, success: false, error: err.message });
      }
    }
    res.json({ success: true, evaluated: results.length, results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/execute/paper-trades?strategyId=X — trade history + cumulative P&L
router.get('/paper-trades', requireAuth, async (req, res) => {
  try {
    const strategyId = req.query.strategyId as string;
    if (!strategyId) return res.status(400).json({ error: 'strategyId is required' });

    const { data: trades, error } = await supabase
      .from('trades')
      .select('*')
      .eq('strategy_id', strategyId)
      .eq('broker', 'PAPER')
      .order('entered_at', { ascending: false });
    if (error) throw new Error(error.message);

    const totalPnl = (trades || []).reduce((sum, t) => sum + Number(t.pnl || 0), 0);
    const wins = (trades || []).filter((t) => Number(t.pnl) > 0).length;

    res.json({
      success: true,
      virtualCapital: VIRTUAL_CAPITAL,
      totalTrades: trades?.length || 0,
      wins,
      losses: (trades?.length || 0) - wins,
      totalPnl: Number(totalPnl.toFixed(2)),
      currentValue: Number((VIRTUAL_CAPITAL + totalPnl).toFixed(2)),
      trades,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

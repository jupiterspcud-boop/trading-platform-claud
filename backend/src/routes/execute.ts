import { Router } from 'express';
import { supabase } from '../services/supabaseClient';
import { requireAuth } from '../middleware/auth';

const router = Router();

const VIRTUAL_CAPITAL = 100000; // ₹1,00,000 notional per strategy, for P&L% -> ₹ conversion

// POST /api/execute/paper-trade  { strategyId }
// Evaluates the strategy's trigger condition against the MOST RECENT stored
// candle (today, once daily sync has run) and — if the trigger fires —
// logs a hypothetical trade with virtual money. No real orders are placed.
router.post('/paper-trade', requireAuth, async (req, res) => {
  try {
    const { strategyId } = req.body;
    if (!strategyId) return res.status(400).json({ success: false, error: 'strategyId is required' });

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
      .limit(2); // today + yesterday, for trigger comparison

    if (!candles || candles.length === 0) {
      return res.json({ success: false, error: 'No data available for this instrument yet.' });
    }

    const today = candles[0];
    const prevDay = candles[1] || null;

    // Prevent double-logging the same trading day for the same strategy
    const { data: existingTrade } = await supabase
      .from('trades')
      .select('id')
      .eq('strategy_id', strategyId)
      .eq('entered_at', today.candle_time)
      .maybeSingle();
    if (existingTrade) {
      return res.json({ success: true, note: 'Already evaluated for this trading day.', skipped: true });
    }

    // Trigger check (mirrors backtestEngine's trigger logic)
    const trigger = strategy.trigger_condition || 'NONE';
    let triggerFired = trigger === 'NONE';
    if (trigger === 'PREV_DAY_BREAKOUT_HIGH' && prevDay) triggerFired = Number(today.high) > Number(prevDay.high);
    if (trigger === 'PREV_DAY_BREAKOUT_LOW' && prevDay) triggerFired = Number(today.low) < Number(prevDay.low);

    if (!triggerFired) {
      return res.json({ success: true, note: 'Trigger did not fire today — no paper trade logged.', triggered: false });
    }

    // Simple outcome using the same volatility-threshold logic as the backtest engine
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
    if (volExposure < 0) { // short vol
      pnlPct = dayRangePct <= VOLATILITY_THRESHOLD_PCT ? Number(strategy.target_pct) : -Number(strategy.stop_loss_pct);
    } else if (buyCE > 0 && buyPE > 0) { // long vol
      pnlPct = dayRangePct >= VOLATILITY_THRESHOLD_PCT ? Number(strategy.target_pct) : -Number(strategy.stop_loss_pct);
    } else { // directional
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

    // Mark strategy as actively paper-trading
    if (strategy.status !== 'paper') {
      await supabase.from('strategies').update({ status: 'paper' }).eq('id', strategyId);
    }

    res.json({ success: true, triggered: true, trade, pnlPct: Number(pnlPct.toFixed(2)) });
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

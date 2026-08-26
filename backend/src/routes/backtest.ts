import { Router } from 'express';
import { supabase } from '../services/supabaseClient';
import { runBacktest } from '../services/backtestEngine';

const router = Router();

// POST /api/backtest/run  { strategyId }
// Fetches the strategy and all available historical spot data for its
// symbol, runs the price-action-based backtest engine, saves the result.
router.post('/run', async (req, res) => {
  try {
    const { strategyId } = req.body;
    if (!strategyId) return res.status(400).json({ success: false, error: 'strategyId is required' });

    const { data: strategy, error: stratErr } = await supabase
      .from('strategies').select('*').eq('id', strategyId).single();
    if (stratErr || !strategy) throw new Error('Strategy not found');

    const { data: instrument } = await supabase
      .from('instruments').select('id').eq('symbol', strategy.symbol).single();
    if (!instrument) throw new Error(`Instrument not found: ${strategy.symbol}`);

    const { data: candles, error: candleErr } = await supabase
      .from('spot_ohlc')
      .select('candle_time, open, high, low, close')
      .eq('instrument_id', instrument.id)
      .order('candle_time', { ascending: true });
    if (candleErr) throw new Error(candleErr.message);

    if (!candles || candles.length === 0) {
      return res.json({ success: false, error: 'No historical data available yet for this symbol.' });
    }

    const result = runBacktest(
      strategy.legs || [],
      Number(strategy.stop_loss_pct) || 20,
      Number(strategy.target_pct) || 20,
      candles
    );

    // Save a summary row into backtest_results
    await supabase.from('backtest_results').insert({
      strategy_id: strategyId,
      from_date: candles[0].candle_time.slice(0, 10),
      to_date: candles[candles.length - 1].candle_time.slice(0, 10),
      win_rate: result.winRatePct,
      max_drawdown: result.maxDrawdownPct,
      equity_curve: result.equityCurve,
    });

    res.json({
      success: true,
      strategyName: strategy.name,
      dataPointsUsed: candles.length,
      note: 'Price-action-based approximation — see docs for methodology. More accurate as daily data accumulates.',
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

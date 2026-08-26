import { Router } from 'express';
import { syncSpotOHLC, syncOptionsOHLC, getTechnicalLevels } from '../services/marketDataService';
import { supabase } from '../services/supabaseClient';

const router = Router();

// POST /api/analysis/sync-spot
// Body: { instrumentSymbol, symbolToken, exchange, interval, fromDate, toDate }
// Example body for NIFTY 50, last 1 day, 1-min candles:
// {
//   "instrumentSymbol": "NIFTY50",
//   "symbolToken": "99926000",
//   "exchange": "NSE",
//   "interval": "ONE_MINUTE",
//   "fromDate": "2026-08-19 09:15",
//   "toDate": "2026-08-19 15:30"
// }
router.post('/sync-spot', async (req, res) => {
  try {
    const { instrumentSymbol, symbolToken, exchange, interval, fromDate, toDate } = req.body;
    if (!instrumentSymbol || !symbolToken || !exchange || !interval || !fromDate || !toDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const result = await syncSpotOHLC(instrumentSymbol, symbolToken, exchange, interval, fromDate, toDate);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analysis/quick-test — mobile-friendly, click-and-go test.
// Just open this URL directly in any browser (phone or desktop).
router.get('/quick-test', async (req, res) => {
  try {
    const result = await syncSpotOHLC(
      'NIFTY50',
      '99926000',
      'NSE',
      'ONE_DAY',
      '2026-08-10 09:15',
      '2026-08-19 15:30'
    );
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Known Angel One symbol tokens for supported indices.
// GIFTNIFTY is NOT available via Angel One (separate NSE IX exchange) — skipped.
const INSTRUMENT_TOKENS: Record<string, { token: string; exchange: string }> = {
  NIFTY50: { token: '99926000', exchange: 'NSE' },
  BANKNIFTY: { token: '99926009', exchange: 'NSE' },
  SENSEX: { token: '99919000', exchange: 'BSE' },
};

// GET /api/analysis/sync-all — syncs last 7 days daily OHLC for all supported indices.
// Mobile-friendly: just open this URL in a browser.
router.get('/sync-all', async (req, res) => {
  const results: Record<string, any> = {};
  for (const [symbol, { token, exchange }] of Object.entries(INSTRUMENT_TOKENS)) {
    try {
      const r = await syncSpotOHLC(symbol, token, exchange, 'ONE_DAY', '2026-08-10 09:15', '2026-08-19 15:30');
      results[symbol] = { success: true, ...r };
    } catch (err: any) {
      results[symbol] = { success: false, error: err.message };
    }
  }
  results['GIFTNIFTY'] = { success: false, error: 'Not available via Angel One — needs a separate NSE IX data source' };
  res.json(results);
});

// POST /api/analysis/sync-options
// Body: {
//   instrumentSymbol: 'NIFTY50',
//   underlying: 'NIFTY',
//   expiryDDMMMYY: '28AUG25',   // Angel One's trading symbol date format
//   expiryDateISO: '2026-08-28',
//   strikes: [24500, 24550, 24600],  // include a few around current spot for ITM/ATM/OTM
//   exchange: 'NFO',
//   interval: 'ONE_DAY',
//   fromDate: '2026-08-10 09:15',
//   toDate: '2026-08-19 15:30'
// }
router.post('/sync-options', async (req, res) => {
  try {
    const {
      instrumentSymbol, underlying, expiryDDMMMYY, expiryDateISO,
      strikes, exchange, interval, fromDate, toDate,
    } = req.body;

    if (!instrumentSymbol || !underlying || !expiryDDMMMYY || !expiryDateISO || !strikes || !exchange || !interval || !fromDate || !toDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await syncOptionsOHLC(
      instrumentSymbol, underlying, expiryDDMMMYY, expiryDateISO,
      strikes, exchange, interval, fromDate, toDate
    );
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/analysis/quick-test-options — mobile-friendly, click-and-go.
// Uses real expiry dates and ATM strikes confirmed from the live Angel One
// option chain on 20 Aug 2026. Update these periodically as expiries roll.
router.get('/quick-test-options', async (req, res) => {
  try {
    const result = await syncOptionsOHLC(
      'NIFTY50',
      'NIFTY',
      '25AUG26',
      '2026-08-25',
      [24150, 24200, 24250], // ATM ~24200, spot was 24,225.45
      'NFO',
      'ONE_DAY',
      '2026-08-15 09:15',
      '2026-08-19 15:30'
    );
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/analysis/quick-test-options-banknifty
router.get('/quick-test-options-banknifty', async (req, res) => {
  try {
    const result = await syncOptionsOHLC(
      'BANKNIFTY',
      'BANKNIFTY',
      '25AUG26',
      '2026-08-25',
      [57400, 57500, 57600], // ATM ~57500, spot was 57,507.65
      'NFO',
      'ONE_DAY',
      '2026-08-15 09:15',
      '2026-08-19 15:30'
    );
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/analysis/quick-test-options-sensex
// NOTE: SENSEX monthly options use a DIFFERENT trading symbol format than
// NIFTY/BANKNIFTY — no day-of-month, just YY+MMM (e.g. "SENSEX26AUG77500CE"
// for the August 2026 monthly expiry), confirmed via Angel One's own forum.
router.get('/quick-test-options-sensex', async (req, res) => {
  try {
    const result = await syncOptionsOHLC(
      'SENSEX',
      'SENSEX',
      '26AUG', // YY + MMM only for SENSEX monthly — not DDMMMYY like NIFTY
      '2026-08-27',
      [77400, 77500, 77600], // ATM ~77500, spot was 77,468.45
      'BFO',
      'ONE_DAY',
      '2026-08-15 09:15',
      '2026-08-19 15:30'
    );
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

// GET /api/analysis/latest-spot — latest close price for each instrument,
// with % change vs previous day. Used by the frontend Dashboard.
router.get('/latest-spot', async (req, res) => {
  try {
    
    const { data: instruments } = await supabase.from('instruments').select('id, symbol');
    if (!instruments) return res.json([]);

    const results = [];
    for (const inst of instruments) {
      const { data: candles } = await supabase
        .from('spot_ohlc')
        .select('close, candle_time')
        .eq('instrument_id', inst.id)
        .order('candle_time', { ascending: false })
        .limit(2);

      if (!candles || candles.length === 0) {
        results.push({ symbol: inst.symbol, value: null, change: null, pct: null });
        continue;
      }

      const latest = Number(candles[0].close);
      const prev = candles[1] ? Number(candles[1].close) : latest;
      const change = latest - prev;
      const pct = prev !== 0 ? (change / prev) * 100 : 0;

      results.push({
        symbol: inst.symbol,
        value: latest,
        change: Number(change.toFixed(2)),
        pct: Number(pct.toFixed(2)),
        asOf: candles[0].candle_time,
      });
    }
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analysis/option-chain?symbol=NIFTY50 — latest saved option chain
// (all strikes/types for the most recent expiry we have data for).
router.get('/option-chain', async (req, res) => {
  try {
    
    const symbol = (req.query.symbol as string) || 'NIFTY50';

    const { data: instrument } = await supabase.from('instruments').select('id').eq('symbol', symbol).single();
    if (!instrument) return res.status(404).json({ error: 'Instrument not found' });

    const { data: latestExpiryRow } = await supabase
      .from('options_ohlc')
      .select('expiry_date')
      .eq('instrument_id', instrument.id)
      .order('expiry_date', { ascending: false })
      .limit(1)
      .single();
    if (!latestExpiryRow) return res.json({ symbol, expiry: null, spot: null, chain: [] });

    const { data: rows } = await supabase
      .from('options_ohlc')
      .select('strike, option_type, moneyness, close, candle_time')
      .eq('instrument_id', instrument.id)
      .eq('expiry_date', latestExpiryRow.expiry_date)
      .order('candle_time', { ascending: false });

    // Keep only the most recent candle per (strike, option_type)
    const seen = new Set<string>();
    const latestRows = (rows || []).filter((r: any) => {
      const key = `${r.strike}-${r.option_type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const strikeMap: Record<string, any> = {};
    for (const r of latestRows) {
      const s = String(r.strike);
      if (!strikeMap[s]) strikeMap[s] = { strike: r.strike };
      if (r.option_type === 'CE') strikeMap[s].callLtp = r.close, strikeMap[s].callMoneyness = r.moneyness;
      if (r.option_type === 'PE') strikeMap[s].putLtp = r.close, strikeMap[s].putMoneyness = r.moneyness;
    }
    const chain = Object.values(strikeMap).sort((a: any, b: any) => a.strike - b.strike);

    const { data: spotRow } = await supabase
      .from('spot_ohlc')
      .select('close')
      .eq('instrument_id', instrument.id)
      .order('candle_time', { ascending: false })
      .limit(1)
      .single();

    res.json({ symbol, expiry: latestExpiryRow.expiry_date, spot: spotRow?.close || null, chain });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analysis/pcr-maxpain?symbol=NIFTY50
// Computes Put-Call Ratio and Max Pain from the latest stored option chain.
router.get('/pcr-maxpain', async (req, res) => {
  try {
    const symbol = (req.query.symbol as string) || 'NIFTY50';

    const { data: instrument } = await supabase.from('instruments').select('id').eq('symbol', symbol).single();
    if (!instrument) return res.status(404).json({ error: 'Instrument not found' });

    const { data: latestExpiryRow } = await supabase
      .from('options_ohlc')
      .select('expiry_date')
      .eq('instrument_id', instrument.id)
      .order('expiry_date', { ascending: false })
      .limit(1)
      .single();
    if (!latestExpiryRow) return res.json({ symbol, pcr: null, maxPain: null, note: 'No option data synced yet' });

    const { data: rows } = await supabase
      .from('options_ohlc')
      .select('strike, option_type, close, open_interest, candle_time')
      .eq('instrument_id', instrument.id)
      .eq('expiry_date', latestExpiryRow.expiry_date)
      .order('candle_time', { ascending: false });

    // Keep only the most recent candle per (strike, option_type)
    const seen = new Set<string>();
    const latest = (rows || []).filter((r: any) => {
      const key = `${r.strike}-${r.option_type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const hasOI = latest.some((r: any) => r.open_interest !== null);

    let pcr: number | null = null;
    if (hasOI) {
      const totalCallOI = latest.filter((r: any) => r.option_type === 'CE').reduce((s: number, r: any) => s + (r.open_interest || 0), 0);
      const totalPutOI = latest.filter((r: any) => r.option_type === 'PE').reduce((s: number, r: any) => s + (r.open_interest || 0), 0);
      pcr = totalCallOI > 0 ? Number((totalPutOI / totalCallOI).toFixed(2)) : null;
    }

    // Max Pain: the strike where total option WRITERS' payout (loss) is minimized.
    // For each candidate strike, sum (for every other strike) the intrinsic
    // value option buyers would collect if price settled at the candidate strike.
    const strikes = [...new Set(latest.map((r: any) => Number(r.strike)))];
    const byStrike: Record<number, { ce?: number; pe?: number; ceOI?: number; peOI?: number }> = {};
    for (const r of latest) {
      const s = Number(r.strike);
      if (!byStrike[s]) byStrike[s] = {};
      if (r.option_type === 'CE') { byStrike[s].ce = Number(r.close); byStrike[s].ceOI = r.open_interest || 0; }
      if (r.option_type === 'PE') { byStrike[s].pe = Number(r.close); byStrike[s].peOI = r.open_interest || 0; }
    }

    let maxPain: number | null = null;
    if (hasOI && strikes.length > 0) {
      let minPayout = Infinity;
      for (const candidate of strikes) {
        let payout = 0;
        for (const s of strikes) {
          const ceOI = byStrike[s].ceOI || 0;
          const peOI = byStrike[s].peOI || 0;
          if (candidate > s) payout += (candidate - s) * ceOI; // ITM calls
          if (candidate < s) payout += (s - candidate) * peOI; // ITM puts
        }
        if (payout < minPayout) {
          minPayout = payout;
          maxPain = candidate;
        }
      }
    }

    res.json({
      symbol,
      expiry: latestExpiryRow.expiry_date,
      pcr,
      maxPain,
      note: hasOI
        ? null
        : symbol === 'SENSEX'
          ? "SENSEX Open Interest isn't available — Angel One's OI history API doesn't support the BSE F&O (BFO) segment. PCR/Max Pain will show for NIFTY and BANKNIFTY only."
          : 'Open Interest not available yet — re-sync options data first.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// GET /api/analysis/technical-levels — ORB, Previous Day, Monday,
// OI-based Support/Resistance, ITM strike, PCR bias — all in one call.
router.get('/technical-levels', async (req, res) => {
  try {
    const symbol = (req.query.symbol as string) || 'NIFTY50';
    const token = (req.query.token as string) || '99926000';
    const exchange = (req.query.exchange as string) || 'NSE';
    const result = await getTechnicalLevels(symbol, token, exchange);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/analysis/spot-history?symbol=NIFTY50 — full stored history for charting
router.get('/spot-history', async (req, res) => {
  try {
    const symbol = (req.query.symbol as string) || 'NIFTY50';
    const { data: instrument } = await supabase.from('instruments').select('id').eq('symbol', symbol).single();
    if (!instrument) return res.status(404).json({ error: 'Instrument not found' });

    const { data, error } = await supabase
      .from('spot_ohlc')
      .select('candle_time, close')
      .eq('instrument_id', instrument.id)
      .order('candle_time', { ascending: true });

    if (error) throw new Error(error.message);
    res.json({ symbol, points: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analysis/backfill-history?symbol=NIFTY50&days=365
// One-time bulk historical fetch — Angel One limits how much data per call,
// so we fetch in ~90-day chunks internally to stay within their limits.
router.get('/backfill-history', async (req, res) => {
  try {
    const symbol = (req.query.symbol as string) || 'NIFTY50';
    const days = Number(req.query.days) || 365;

    const TOKENS: Record<string, { token: string; exchange: string }> = {
      NIFTY50: { token: '99926000', exchange: 'NSE' },
      BANKNIFTY: { token: '99926009', exchange: 'NSE' },
      SENSEX: { token: '99919000', exchange: 'BSE' },
    };
    const config = TOKENS[symbol];
    if (!config) return res.status(400).json({ error: `Unsupported symbol: ${symbol}` });

    const { syncSpotOHLC } = await import('../services/marketDataService');
    const chunks: { from: string; to: string }[] = [];
    const today = new Date();
    let daysRemaining = days;
    let chunkEnd = new Date(today);

    while (daysRemaining > 0) {
      const chunkDays = Math.min(90, daysRemaining);
      const chunkStart = new Date(chunkEnd);
      chunkStart.setDate(chunkStart.getDate() - chunkDays);
      chunks.push({
        from: chunkStart.toISOString().slice(0, 10) + ' 09:15',
        to: chunkEnd.toISOString().slice(0, 10) + ' 15:30',
      });
      chunkEnd = new Date(chunkStart);
      daysRemaining -= chunkDays;
    }

    const results: any[] = [];
    for (const chunk of chunks) {
      try {
        const r = await syncSpotOHLC(symbol, config.token, config.exchange, 'ONE_DAY', chunk.from, chunk.to);
        results.push({ ...chunk, ...r });
        await new Promise((resolve) => setTimeout(resolve, 1200)); // rate-limit safety between chunks
      } catch (err: any) {
        results.push({ ...chunk, error: err.message });
      }
    }

    res.json({ success: true, symbol, totalChunks: chunks.length, results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/analysis/backfill-range?symbol=NIFTY50&from=2025-08-31&to=2025-11-29
// Retry a specific failed date range from a chunked backfill.
router.get('/backfill-range', async (req, res) => {
  try {
    const symbol = (req.query.symbol as string) || 'NIFTY50';
    const from = (req.query.from as string) + ' 09:15';
    const to = (req.query.to as string) + ' 15:30';

    const TOKENS: Record<string, { token: string; exchange: string }> = {
      NIFTY50: { token: '99926000', exchange: 'NSE' },
      BANKNIFTY: { token: '99926009', exchange: 'NSE' },
      SENSEX: { token: '99919000', exchange: 'BSE' },
    };
    const config = TOKENS[symbol];
    if (!config) return res.status(400).json({ error: `Unsupported symbol: ${symbol}` });

    const { syncSpotOHLC } = await import('../services/marketDataService');
    const result = await syncSpotOHLC(symbol, config.token, config.exchange, 'ONE_DAY', from, to);
    res.json({ success: true, symbol, from, to, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

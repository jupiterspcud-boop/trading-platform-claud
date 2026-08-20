import { Router } from 'express';
import { syncSpotOHLC, syncOptionsOHLC } from '../services/marketDataService';

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
// Uses NIFTY, nearest weekly-style strikes around the last known spot price.
// NOTE: expiryDDMMMYY below is a placeholder — update it to a real, currently
// tradable NIFTY weekly/monthly expiry date before running, or this will fail
// with "Symbol token not found" (expired/wrong dates won't resolve).
router.get('/quick-test-options', async (req, res) => {
  try {
    const expiryDDMMMYY = (req.query.expiry as string) || '28AUG25';
    const expiryDateISO = (req.query.expiryISO as string) || '2026-08-28';
    const result = await syncOptionsOHLC(
      'NIFTY50',
      'NIFTY',
      expiryDDMMMYY,
      expiryDateISO,
      [24000, 24050, 24100], // roughly ATM based on last known spot ~24048
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

export default router;

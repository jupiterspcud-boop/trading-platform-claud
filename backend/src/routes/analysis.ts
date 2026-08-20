import { Router } from 'express';
import { syncSpotOHLC } from '../services/marketDataService';

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

export default router;

import { Router } from 'express';
// TODO: REAL INTEGRATION — import a real marketDataService client here.
// import { getOptionChain, getGreeks, getFlowData } from '../services/marketDataService';

const router = Router();

// GET /api/analysis/oi?symbol=NIFTY
router.get('/oi', async (req, res) => {
  const { symbol } = req.query;
  // Placeholder response. Replace with real getOptionChain(symbol) call.
  res.json({
    symbol,
    note: 'STUB: connect marketDataService to a licensed data feed',
    data: [],
  });
});

// GET /api/analysis/greeks?symbol=NIFTY&expiry=2026-08-27
router.get('/greeks', async (req, res) => {
  res.json({ note: 'STUB', data: [] });
});

// GET /api/analysis/flow?symbol=NIFTY  (institutional/unusual activity)
router.get('/flow', async (req, res) => {
  res.json({ note: 'STUB: requires premium flow data provider', data: [] });
});

export default router;

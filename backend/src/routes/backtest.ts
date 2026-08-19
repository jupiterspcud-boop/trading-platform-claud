import { Router } from 'express';
// TODO: REAL INTEGRATION — import a backtest engine that pulls historical
// data and simulates entries/exits/fills.
// import { runBacktest } from '../services/marketDataService';

const router = Router();

// POST /api/backtest/run  { strategyId, from, to }
router.post('/run', async (req, res) => {
  res.json({
    note: 'STUB: connect historical data + simulation engine',
    equityCurve: [],
    winRate: null,
    maxDrawdown: null,
  });
});

export default router;

import { Router } from 'express';
// TODO: REAL INTEGRATION — import brokerService, which wraps each
// broker's real order-placement API behind a common interface.
// import { placeOrder } from '../services/brokerService';

const router = Router();

// POST /api/execute/order  { strategyId, broker, legs }
router.post('/order', async (req, res) => {
  res.status(501).json({
    note: 'STUB: no broker connected. Requires OAuth-linked broker account.',
  });
});

export default router;

import { Router } from 'express';

const router = Router();

// GET /api/marketplace/strategies
router.get('/strategies', async (req, res) => {
  res.json({ note: 'STUB: list published strategies with verified performance', data: [] });
});

// POST /api/marketplace/publish  { strategyId }
router.post('/publish', async (req, res) => {
  res.json({ note: 'STUB: verify performance is from real executed trades before publishing' });
});

export default router;

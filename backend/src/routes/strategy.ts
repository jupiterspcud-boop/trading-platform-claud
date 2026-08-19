import { Router } from 'express';
// TODO: REAL INTEGRATION — import aiService for natural-language parsing.
// import { generateStrategyFromText } from '../services/aiService';

const router = Router();

// POST /api/strategy/generate-from-text  { prompt: string }
router.post('/generate-from-text', async (req, res) => {
  const { prompt } = req.body;
  // IMPORTANT: validate the AI's output against a strict schema
  // (entry, exit, stopLoss, target, legs[]) before ever saving or
  // allowing execution. Never trust free-form LLM output directly.
  res.json({
    note: 'STUB: wire to aiService.generateStrategyFromText',
    input: prompt,
    strategy: null,
  });
});

// POST /api/strategy/create  { legs, stopLoss, target, symbol }
router.post('/create', async (req, res) => {
  res.json({ note: 'STUB: save strategy to DB', saved: false });
});

// GET /api/strategy/:id
router.get('/:id', async (req, res) => {
  res.json({ note: 'STUB', id: req.params.id });
});

export default router;

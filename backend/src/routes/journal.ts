import { Router } from 'express';
// TODO: REAL INTEGRATION — import aiService for retrieval-grounded Q&A
// over the user's own trade history (not open-ended generation).
// import { answerJournalQuery } from '../services/aiService';

const router = Router();

// POST /api/journal/query  { question: string }
router.post('/query', async (req, res) => {
  res.json({ note: 'STUB: ground answer in user trade history', answer: null });
});

export default router;

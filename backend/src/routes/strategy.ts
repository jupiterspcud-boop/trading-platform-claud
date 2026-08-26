import { Router } from 'express';
import { supabase } from '../services/supabaseClient';

const router = Router();

// POST /api/strategy/generate-from-text  { prompt: string }
router.post('/generate-from-text', async (req, res) => {
  const { prompt } = req.body;
  // TODO: REAL INTEGRATION — wire to an AI provider with a strict JSON
  // schema. Never trust free-form LLM output directly as executable.
  res.json({
    note: 'STUB: wire to an AI provider to parse this into structured rules',
    input: prompt,
    strategy: null,
  });
});

// POST /api/strategy/create
// Body: { name, symbol, legs, stopLossPct, targetPct, source, description }
router.post('/create', async (req, res) => {
  try {
    const { name, symbol, legs, stopLossPct, targetPct, source, description } = req.body;
    if (!name || !symbol) {
      return res.status(400).json({ error: 'name and symbol are required' });
    }

    const { data, error } = await supabase
      .from('strategies')
      .insert({
        name,
        symbol,
        legs: legs || [],
        stop_loss_pct: stopLossPct ?? null,
        target_pct: targetPct ?? null,
        source: source || 'manual',
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    res.json({ success: true, strategy: data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/strategy/list — all saved strategies, for the Strategy Library UI
router.get('/list', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    res.json({ success: true, strategies: data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/strategy/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('strategies').select('*').eq('id', req.params.id).single();
    if (error) throw new Error(error.message);
    res.json({ success: true, strategy: data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

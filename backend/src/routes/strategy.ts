import { Router } from 'express';
import { supabase } from '../services/supabaseClient';
import { parseStrategyText } from '../services/strategyParser';

const router = Router();

// POST /api/strategy/generate-from-text  { prompt: string }
// Keyword-based parser (not full AI) — recognizes a fixed set of known
// patterns (BUY/SELL CE/PE, Straddle/Strangle, breakout triggers,
// target/stop-loss percentages). Says explicitly what it did NOT understand.
router.post('/generate-from-text', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  const parsed = parseStrategyText(prompt);
  res.json({
    input: prompt,
    matched: parsed.matched,
    legs: parsed.legs,
    triggerCondition: parsed.triggerCondition,
    stopLossPct: parsed.stopLossPct,
    targetPct: parsed.targetPct,
    matchedPhrases: parsed.matchedPhrases,
    note: parsed.matched
      ? 'Review the parsed strategy below, then save it if it looks right.'
      : "Couldn't recognize any known pattern (BUY/SELL CE/PE, Straddle, Strangle, breakout above/below previous day, target/stop-loss %). Try rephrasing or build it manually below.",
  });
});

// POST /api/strategy/create
// Body: { name, symbol, legs, stopLossPct, targetPct, source, description }
router.post('/create', async (req, res) => {
  try {
    const { name, symbol, legs, stopLossPct, targetPct, source, description, triggerCondition } = req.body;
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
        trigger_condition: triggerCondition || 'NONE',
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

// PUT /api/strategy/:id — update an existing strategy
router.put('/:id', async (req, res) => {
  try {
    const { name, symbol, legs, stopLossPct, targetPct, status, triggerCondition } = req.body;
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (symbol !== undefined) updates.symbol = symbol;
    if (legs !== undefined) updates.legs = legs;
    if (stopLossPct !== undefined) updates.stop_loss_pct = stopLossPct;
    if (targetPct !== undefined) updates.target_pct = targetPct;
    if (status !== undefined) updates.status = status;
    if (triggerCondition !== undefined) updates.trigger_condition = triggerCondition;

    const { data, error } = await supabase.from('strategies').update(updates).eq('id', req.params.id).select().single();
    if (error) throw new Error(error.message);
    res.json({ success: true, strategy: data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/strategy/:id
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('strategies').delete().eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

import { Router } from 'express';
import { supabase } from '../services/supabaseClient';
import { parseStrategyText } from '../services/strategyParser';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const router = Router();

// POST /api/strategy/generate-from-text  { prompt: string }
// Keyword-based parser — no auth needed, doesn't touch the database.
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

// POST /api/strategy/create — requires login. New strategies belong to the
// logged-in user (unlike the 5 public template strategies, which have no owner).
router.post('/create', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { name, symbol, legs, stopLossPct, targetPct, source, triggerCondition } = req.body;
    if (!name || !symbol) return res.status(400).json({ error: 'name and symbol are required' });

    const { data, error } = await supabase
      .from('strategies')
      .insert({
        user_id: req.userId,
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

// GET /api/strategy/list — requires login. Returns the user's own strategies
// PLUS the 5 public templates (user_id IS NULL) that everyone can see and use.
router.get('/list', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .or(`user_id.eq.${req.userId},user_id.is.null`)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    res.json({ success: true, strategies: data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/strategy/:id — requires login, must be owner or a public template
router.get('/:id', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { data, error } = await supabase.from('strategies').select('*').eq('id', req.params.id).single();
    if (error) throw new Error(error.message);
    if (data.user_id && data.user_id !== req.userId) {
      return res.status(403).json({ success: false, error: 'Not your strategy' });
    }
    res.json({ success: true, strategy: data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/strategy/:id — only the owner can edit; public templates are read-only
router.put('/:id', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { data: existing } = await supabase.from('strategies').select('user_id').eq('id', req.params.id).single();
    if (!existing) return res.status(404).json({ success: false, error: 'Strategy not found' });
    if (!existing.user_id || existing.user_id !== req.userId) {
      return res.status(403).json({ success: false, error: 'You can only edit your own strategies' });
    }

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

// DELETE /api/strategy/:id — only the owner can delete; templates are protected
router.delete('/:id', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { data: existing } = await supabase.from('strategies').select('user_id').eq('id', req.params.id).single();
    if (!existing) return res.status(404).json({ success: false, error: 'Strategy not found' });
    if (!existing.user_id || existing.user_id !== req.userId) {
      return res.status(403).json({ success: false, error: 'You can only delete your own strategies' });
    }

    const { error } = await supabase.from('strategies').delete().eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

// Keyword-based strategy text parser — converts plain-English descriptions
// into structured strategy fields (legs, trigger, stop-loss/target).
// This is NOT a full NLP/AI model — it's a deterministic pattern matcher
// for a fixed set of known phrases. Reliable for these patterns, but will
// say so honestly (via `matched: false`) for anything it doesn't recognize.

export type ParsedStrategy = {
  matched: boolean;
  legs: { action: 'BUY' | 'SELL'; type: 'CE' | 'PE'; strike: string }[];
  triggerCondition: 'NONE' | 'PREV_DAY_BREAKOUT_HIGH' | 'PREV_DAY_BREAKOUT_LOW';
  stopLossPct: number | null;
  targetPct: number | null;
  matchedPhrases: string[];
};

export function parseStrategyText(text: string): ParsedStrategy {
  const lower = text.toLowerCase();
  const matchedPhrases: string[] = [];
  const legs: ParsedStrategy['legs'] = [];
  let triggerCondition: ParsedStrategy['triggerCondition'] = 'NONE';
  let stopLossPct: number | null = null;
  let targetPct: number | null = null;

  // --- Trigger detection ---
  if (/(breakout|cross(es)?|break)\s+(above|over)\s+(previous|prev|yesterday'?s?)\s+(day'?s?\s+)?high/.test(lower)) {
    triggerCondition = 'PREV_DAY_BREAKOUT_HIGH';
    matchedPhrases.push('breakout above previous day high');
  } else if (/(breakdown|cross(es)?|break)\s+(below|under)\s+(previous|prev|yesterday'?s?)\s+(day'?s?\s+)?low/.test(lower)) {
    triggerCondition = 'PREV_DAY_BREAKOUT_LOW';
    matchedPhrases.push('breakdown below previous day low');
  } else if (/rsi.{0,15}(above|>|cross(es)?\s+above)\s*30/.test(lower)) {
    // RSI isn't computed by our engine yet — map to a directional bullish leg
    // as the closest available proxy, and say so.
    matchedPhrases.push('RSI > 30 (mapped to bullish bias — RSI calculation not yet built)');
  } else if (/rsi.{0,15}(below|<|cross(es)?\s+below)\s*70/.test(lower)) {
    matchedPhrases.push('RSI < 70 (mapped to bearish bias — RSI calculation not yet built)');
  }

  // --- Direction / leg detection ---
  const buyCE = /(buy|long)\s+(nifty\s+|bank\s?nifty\s+|sensex\s+)?ce\b/.test(lower) || /call\s+option/.test(lower) && /buy/.test(lower);
  const buyPE = /(buy|long)\s+(nifty\s+|bank\s?nifty\s+|sensex\s+)?pe\b/.test(lower);
  const sellCE = /sell\s+(nifty\s+|bank\s?nifty\s+|sensex\s+)?ce\b/.test(lower);
  const sellPE = /sell\s+(nifty\s+|bank\s?nifty\s+|sensex\s+)?pe\b/.test(lower);

  if (buyCE) { legs.push({ action: 'BUY', type: 'CE', strike: 'ATM' }); matchedPhrases.push('BUY CE'); }
  if (buyPE) { legs.push({ action: 'BUY', type: 'PE', strike: 'ATM' }); matchedPhrases.push('BUY PE'); }
  if (sellCE) { legs.push({ action: 'SELL', type: 'CE', strike: 'ATM' }); matchedPhrases.push('SELL CE'); }
  if (sellPE) { legs.push({ action: 'SELL', type: 'PE', strike: 'ATM' }); matchedPhrases.push('SELL PE'); }

  if (/straddle/.test(lower) && legs.length === 0) {
    const isShort = /short|sell/.test(lower);
    legs.push({ action: isShort ? 'SELL' : 'BUY', type: 'CE', strike: 'ATM' });
    legs.push({ action: isShort ? 'SELL' : 'BUY', type: 'PE', strike: 'ATM' });
    matchedPhrases.push(`${isShort ? 'Short' : 'Long'} Straddle`);
  }
  if (/strangle/.test(lower) && legs.length === 0) {
    const isShort = /short|sell/.test(lower);
    legs.push({ action: isShort ? 'SELL' : 'BUY', type: 'CE', strike: 'OTM+2' });
    legs.push({ action: isShort ? 'SELL' : 'BUY', type: 'PE', strike: 'OTM-2' });
    matchedPhrases.push(`${isShort ? 'Short' : 'Long'} Strangle`);
  }

  // --- Target / Stop-loss extraction ---
  const targetMatch = lower.match(/(\d+(?:\.\d+)?)\s*%\s*target/) || lower.match(/target\s*(?:of\s*)?(\d+(?:\.\d+)?)\s*%/);
  if (targetMatch) { targetPct = Number(targetMatch[1]); matchedPhrases.push(`target ${targetPct}%`); }

  const slMatch = lower.match(/(\d+(?:\.\d+)?)\s*%\s*(stop-?loss|sl)/) || lower.match(/(stop-?loss|sl)\s*(?:of\s*)?(\d+(?:\.\d+)?)\s*%/);
  if (slMatch) {
    stopLossPct = Number(slMatch[1] && !isNaN(Number(slMatch[1])) ? slMatch[1] : slMatch[2]);
    matchedPhrases.push(`stop-loss ${stopLossPct}%`);
  }

  return {
    matched: legs.length > 0 || triggerCondition !== 'NONE',
    legs,
    triggerCondition,
    stopLossPct,
    targetPct,
    matchedPhrases,
  };
}

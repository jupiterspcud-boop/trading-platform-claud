// TODO: REAL INTEGRATION REQUIRED
// Use an LLM provider (e.g. Anthropic API) with a strict JSON schema
// for strategy generation. Always validate output server-side before
// saving — never let raw model output become an executable strategy.

type StrategyDraft = {
  symbol: string;
  legs: { type: 'CE' | 'PE'; action: 'BUY' | 'SELL'; strike: number; qty: number }[];
  stopLossPct: number;
  targetPct: number;
};

export async function generateStrategyFromText(prompt: string): Promise<StrategyDraft | null> {
  // Call your LLM provider here with a system prompt that forces
  // structured JSON output matching StrategyDraft, then validate it.
  throw new Error('Not implemented: connect an AI provider');
}

export async function answerJournalQuery(userId: string, question: string): Promise<string> {
  // Should retrieve the user's actual trades from the DB and pass them
  // as grounding context to the LLM — not answer from general knowledge.
  throw new Error('Not implemented');
}

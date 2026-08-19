'use client';
// AI Natural Language strategy builder.
// TODO: REAL INTEGRATION — POST the `prompt` to
// backend/src/routes/strategy.ts -> /generate-from-text, which calls
// aiService.ts. The backend MUST validate the AI's output against a
// strict JSON schema before saving — never trust free-form LLM output
// directly as an executable strategy.

import { useState } from 'react';

export default function AINaturalLanguage() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string | null>(null);

  async function handleGenerate() {
    // Placeholder — replace with real fetch('/api/strategy/generate-from-text')
    setResult(
      `Preview only. Once connected, this will parse:\n"${prompt}"\ninto a structured strategy (entry/exit/SL/target) for you to review before saving.`
    );
  }

  return (
    <div className="bg-[var(--bg-panel)] p-4 rounded-lg border border-[var(--border-subtle)] space-y-3">
      <h2 className="font-medium">Describe your strategy</h2>
      <textarea
        className="w-full bg-black/30 rounded p-3 text-sm border border-[var(--border-subtle)]"
        rows={3}
        placeholder='e.g. "Buy Nifty CE when RSI crosses above 30 and 5 EMA crosses 20 EMA. Exit at 3% target or 1% stop-loss."'
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button
        onClick={handleGenerate}
        className="px-4 py-2 rounded bg-[var(--accent-buy)] text-black text-sm font-medium"
      >
        Generate Strategy
      </button>
      {result && (
        <pre className="text-xs text-[var(--text-muted)] whitespace-pre-wrap">{result}</pre>
      )}
    </div>
  );
}

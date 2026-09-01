'use client';
// Keyword-based strategy text parser UI. Parses plain-English strategy
// descriptions into structured legs/trigger/target using a fixed set of
// known patterns (not full AI) — shows exactly what it recognized before
// saving, and says clearly when it didn't understand something.

import { useState } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tradepulse-backend-l79z.onrender.com';

export default function AINaturalLanguage({ onParsed }: { onParsed: (parsed: any) => void }) {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/strategy/generate-from-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({ matched: false, note: 'Request failed: ' + err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[var(--bg-card)] glass border border-[var(--border)] rounded-2xl p-4 space-y-3">
      <h2 className="text-[13px] font-semibold">Describe your strategy</h2>
      <textarea
        className="w-full bg-[var(--bg-card-hover)] glass rounded-lg p-3 text-[13px] border border-[var(--border)]"
        rows={3}
        placeholder='e.g. "Buy Nifty CE when price breaks above previous day high, target 30%, stop-loss 15%"'
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="px-4 py-2.5 rounded-xl bg-[var(--accent-brand)] text-white text-[13px] font-semibold disabled:opacity-50"
      >
        {loading ? 'Parsing…' : 'Parse strategy'}
      </button>

      {result && (
        <div className="bg-[var(--bg-card-hover)] glass border border-[var(--border)] rounded-xl p-3 space-y-2">
          <p className="text-[12px] text-[var(--text-secondary)]">{result.note}</p>
          {result.matched && (
            <>
              {result.matchedPhrases?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {result.matchedPhrases.map((p: string, i: number) => (
                    <span key={i} className="text-[10px] bg-[var(--accent-brand)] text-white px-2 py-0.5 rounded-full">
                      {p}
                    </span>
                  ))}
                </div>
              )}
              <button
                onClick={() => onParsed(result)}
                className="w-full mt-1 text-[12px] font-semibold py-2 rounded-lg bg-[var(--accent-buy)] text-black"
              >
                Use this — fill the form below
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

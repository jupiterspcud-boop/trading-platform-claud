'use client';
import { useState } from 'react';

export default function AINaturalLanguage() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string | null>(null);

  function handleGenerate() {
    setResult(`Preview only. Once connected, this will parse:\n"${prompt}"\ninto a structured strategy for you to review before saving.`);
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 space-y-3">
      <p className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Describe your strategy</p>
      <textarea
        className="w-full bg-black/30 rounded-xl p-3 text-[13px] border border-[var(--border)] placeholder:text-[var(--text-secondary)]"
        rows={3}
        placeholder='e.g. "Buy Nifty CE when RSI crosses above 30, exit at 3% target or 1% stop-loss"'
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button onClick={handleGenerate} className="w-full bg-[var(--accent-brand)] text-white text-[13px] font-semibold py-3 rounded-xl">
        Generate Strategy
      </button>
      {result && <pre className="text-[11px] text-[var(--text-secondary)] whitespace-pre-wrap bg-black/20 rounded-lg p-3">{result}</pre>}
    </div>
  );
}

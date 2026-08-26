'use client';
// Backtest — shows which strategy was selected (via ?strategyId=), and will
// run the actual simulation once the backtest engine is built (next phase).

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Strategy } from '@/lib/api';

function BacktestContent() {
  const params = useSearchParams();
  const strategyId = params.get('strategyId');
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!strategyId) return;
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tradepulse-backend-l79z.onrender.com';
    fetch(`${BACKEND_URL}/api/strategy/${strategyId}`)
      .then((r) => r.json())
      .then((d) => (d.success ? setStrategy(d.strategy) : setError(d.error)))
      .catch((err) => setError(err.message));
  }, [strategyId]);

  return (
    <div className="px-4 pt-4 space-y-4">
      <h1 className="text-lg font-bold">Backtest & paper trade</h1>

      {!strategyId && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4">
          <p className="text-[13px] text-[var(--text-secondary)]">
            No strategy selected. Go to the Build tab and tap "Backtest" on a strategy.
          </p>
        </div>
      )}

      {strategyId && error && (
        <p className="text-[13px] text-[var(--accent-sell)]">Couldn't load strategy: {error}</p>
      )}

      {strategy && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 space-y-3">
          <div>
            <p className="text-[14px] font-semibold">{strategy.name}</p>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{strategy.symbol}</p>
          </div>
          <div className="flex gap-4 text-[12px] text-[var(--text-secondary)]">
            {strategy.stop_loss_pct != null && <span>Stop-loss {strategy.stop_loss_pct}%</span>}
            {strategy.target_pct != null && <span>Target {strategy.target_pct}%</span>}
          </div>
          <button
            disabled
            className="w-full text-[13px] font-semibold py-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border)] text-[var(--text-secondary)]"
          >
            Run backtest — engine coming next
          </button>
          <p className="text-[11px] text-[var(--text-secondary)]">
            The simulation engine (entry/exit against historical prices, win rate, drawdown) is the next
            piece we're building — this screen is wired and ready for it.
          </p>
        </div>
      )}
    </div>
  );
}

export default function BacktestPage() {
  return (
    <Suspense fallback={<div className="px-4 pt-4 text-[13px] text-[var(--text-secondary)]">Loading…</div>}>
      <BacktestContent />
    </Suspense>
  );
}

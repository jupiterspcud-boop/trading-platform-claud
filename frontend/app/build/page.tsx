'use client';
// Build — Strategy Library. Shows all saved strategies as cards; each has
// a "Use" button (selects it for the Execute flow, once execution exists)
// and a "Backtest" button (jumps to /backtest with this strategy pre-selected).

import { useEffect, useState } from 'react';
import { fetchStrategies, Strategy } from '@/lib/api';

function legsSummary(legs: any[]) {
  if (!legs || legs.length === 0) return 'No legs defined';
  return legs.map((l) => `${l.action} ${l.type}${l.strike ? ` @ ${l.strike}` : ''}`).join(' · ');
}

export default function BuildPage() {
  const [strategies, setStrategies] = useState<Strategy[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchStrategies().then(setStrategies).catch((err) => setError(err.message));
  }, []);

  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      <div>
        <h1 className="text-lg font-bold">Strategy library</h1>
        <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
          Pick a strategy to use or backtest.
        </p>
      </div>

      {error && <p className="text-[13px] text-[var(--accent-sell)]">Couldn't load strategies: {error}</p>}
      {!strategies && !error && <p className="text-[13px] text-[var(--text-secondary)]">Loading…</p>}
      {strategies && strategies.length === 0 && (
        <p className="text-[13px] text-[var(--text-secondary)]">No strategies yet.</p>
      )}

      <div className="space-y-3">
        {strategies?.map((s) => {
          const isSelected = selectedId === s.id;
          return (
            <div
              key={s.id}
              className={`bg-[var(--bg-card)] border rounded-2xl p-4 ${isSelected ? 'border-[var(--accent-brand)]' : 'border-[var(--border)]'}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[14px] font-semibold">{s.name}</p>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{s.symbol} · {s.source}</p>
                </div>
                {isSelected && (
                  <span className="text-[10px] bg-[var(--accent-brand)] text-white px-2 py-0.5 rounded-full font-medium">
                    Selected
                  </span>
                )}
              </div>

              <p className="text-[12px] text-[var(--text-secondary)] mt-2.5">{legsSummary(s.legs)}</p>

              <div className="flex gap-3 mt-2 text-[11px] text-[var(--text-secondary)]">
                {s.stop_loss_pct != null && <span>SL {s.stop_loss_pct}%</span>}
                {s.target_pct != null && <span>Target {s.target_pct}%</span>}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3.5">
                <button
                  onClick={() => setSelectedId(s.id)}
                  className={`text-[13px] font-semibold py-2.5 rounded-xl ${
                    isSelected
                      ? 'bg-[var(--accent-brand)] text-white'
                      : 'bg-[var(--bg-card-hover)] border border-[var(--border)]'
                  }`}
                >
                  {isSelected ? 'In use' : 'Use'}
                </button>
                <a
                  href={`/backtest?strategyId=${s.id}`}
                  className="text-[13px] font-semibold py-2.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border)] text-center"
                >
                  Backtest
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-[var(--text-secondary)] pt-2">
        "Use" marks a strategy as active for later execution — no real trades happen yet.
      </p>
    </div>
  );
}

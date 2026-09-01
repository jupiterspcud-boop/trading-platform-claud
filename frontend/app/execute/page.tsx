'use client';
// Execute — Paper Trading dashboard. No real broker, no real money.
// Lists strategies, lets you run today's evaluation against live-synced
// data, and shows virtual P&L history per strategy.

import { useEffect, useState } from 'react';
import { fetchStrategies, Strategy } from '@/lib/api';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tradepulse-backend-l79z.onrender.com';

export default function ExecutePage() {
  const [strategies, setStrategies] = useState<Strategy[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [paperData, setPaperData] = useState<Record<string, any>>({});

  function reload() {
    fetchStrategies().then(setStrategies).catch((err) => setError(err.message));
  }

  useEffect(() => { reload(); }, []);

  async function loadPaperTrades(strategyId: string) {
    const res = await fetch(`${BACKEND_URL}/api/execute/paper-trades?strategyId=${strategyId}`);
    const data = await res.json();
    setPaperData((prev) => ({ ...prev, [strategyId]: data }));
  }

  useEffect(() => {
    strategies?.filter((s) => s.status === 'paper').forEach((s) => loadPaperTrades(s.id));
  }, [strategies]);

  async function handleRunToday(strategyId: string) {
    setRunning(strategyId);
    try {
      const res = await fetch(`${BACKEND_URL}/api/execute/paper-trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategyId }),
      });
      const data = await res.json();
      setResults((prev) => ({ ...prev, [strategyId]: data }));
      await loadPaperTrades(strategyId);
      reload();
    } catch (err: any) {
      setResults((prev) => ({ ...prev, [strategyId]: { success: false, error: err.message } }));
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      <div>
        <h1 className="text-lg font-bold">Paper trading</h1>
        <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
          Virtual ₹1,00,000 per strategy · Uses real synced prices · No real money, no broker.
        </p>
      </div>

      {error && <p className="text-[13px] text-[var(--accent-sell)]">{error}</p>}
      {!strategies && !error && <p className="text-[13px] text-[var(--text-secondary)]">Loading…</p>}
      {strategies && strategies.length === 0 && (
        <p className="text-[13px] text-[var(--text-secondary)]">No strategies yet — create one in the Build tab first.</p>
      )}

      <div className="space-y-3">
        {strategies?.map((s) => {
          const pd = paperData[s.id];
          const result = results[s.id];
          return (
            <div key={s.id} className="bg-[var(--bg-card)] glass border border-[var(--border)] rounded-2xl p-4 space-y-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[14px] font-semibold">{s.name}</p>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{s.symbol}</p>
                </div>
                {s.status === 'paper' && (
                  <span className="text-[10px] bg-[var(--accent-buy)] text-black px-2 py-0.5 rounded-full font-medium">
                    Paper Active
                  </span>
                )}
              </div>

              {pd && pd.totalTrades > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="bg-[var(--bg-card-hover)] glass rounded-lg p-2 text-center">
                    <p className="text-[9px] text-[var(--text-secondary)] uppercase">Current Value</p>
                    <p className="text-[13px] font-bold mt-0.5">₹{pd.currentValue?.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-[var(--bg-card-hover)] glass rounded-lg p-2 text-center">
                    <p className="text-[9px] text-[var(--text-secondary)] uppercase">Total P&amp;L</p>
                    <p className={`text-[13px] font-bold mt-0.5 ${pd.totalPnl >= 0 ? 'text-[var(--accent-buy)]' : 'text-[var(--accent-sell)]'}`}>
                      ₹{pd.totalPnl?.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="bg-[var(--bg-card-hover)] glass rounded-lg p-2 text-center">
                    <p className="text-[9px] text-[var(--text-secondary)] uppercase">Trades</p>
                    <p className="text-[13px] font-bold mt-0.5">{pd.wins}W / {pd.losses}L</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => handleRunToday(s.id)}
                disabled={running === s.id}
                className="w-full text-[13px] font-semibold py-2.5 rounded-xl bg-[var(--accent-brand)] text-white disabled:opacity-50"
              >
                {running === s.id ? 'Checking…' : "Run today's paper trade check"}
              </button>

              {result && (
                <p className={`text-[11px] ${result.success ? 'text-[var(--text-secondary)]' : 'text-[var(--accent-sell)]'}`}>
                  {result.error || result.note || (result.triggered ? `Triggered — P&L ${result.pnlPct}%` : 'No trigger today')}
                </p>
              )}

              {pd && pd.trades?.length > 0 && (
                <div className="pt-1 border-t border-[var(--border)] mt-1">
                  {pd.trades.slice(0, 5).map((t: any) => (
                    <div key={t.id} className="flex justify-between text-[11px] py-1.5">
                      <span className="text-[var(--text-secondary)]">
                        {new Date(t.entered_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                      <span className={Number(t.pnl) >= 0 ? 'text-[var(--accent-buy)]' : 'text-[var(--accent-sell)]'}>
                        ₹{Number(t.pnl).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-[var(--text-secondary)] pt-2">
        Paper trades use the same price-action approximation as Backtest. Real broker execution comes later, after this proves reliable.
      </p>
    </div>
  );
}

'use client';
// Backtest — runs the real price-action-based backtest engine against
// stored historical data and shows win rate, P&L, and an equity curve.

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Strategy } from '@/lib/api';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tradepulse-backend-l79z.onrender.com';

function BacktestContent() {
  const params = useSearchParams();
  const strategyId = params.get('strategyId');
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!strategyId) return;
    fetch(`${BACKEND_URL}/api/strategy/${strategyId}`)
      .then((r) => r.json())
      .then((d) => (d.success ? setStrategy(d.strategy) : setError(d.error)))
      .catch((err) => setError(err.message));
  }, [strategyId]);

  async function handleRun() {
    if (!strategyId) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/backtest/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategyId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Backtest failed');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  const chartData = result?.equityCurve?.map((p: any) => ({
    date: new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    pnl: p.cumPnlPct,
  }));

  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      <h1 className="text-lg font-bold">Backtest & paper trade</h1>

      {!strategyId && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4">
          <p className="text-[13px] text-[var(--text-secondary)]">
            No strategy selected. Go to the Build tab and tap "Backtest" on a strategy.
          </p>
        </div>
      )}

      {strategyId && error && <p className="text-[13px] text-[var(--accent-sell)]">{error}</p>}

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
            onClick={handleRun}
            disabled={running}
            className="w-full text-[13px] font-semibold py-3 rounded-xl bg-[var(--accent-brand)] text-white disabled:opacity-50"
          >
            {running ? 'Running…' : 'Run backtest'}
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <p className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3">
            {result.note} · {result.dataPointsUsed} days of data used · Classified as {result.strategyType}
          </p>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3 text-center">
              <p className="text-[10px] text-[var(--text-secondary)] uppercase">Win Rate</p>
              <p className="text-[16px] font-bold mt-1">{result.winRatePct}%</p>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3 text-center">
              <p className="text-[10px] text-[var(--text-secondary)] uppercase">Total P&amp;L</p>
              <p className={`text-[16px] font-bold mt-1 ${result.totalPnlPct >= 0 ? 'text-[var(--accent-buy)]' : 'text-[var(--accent-sell)]'}`}>
                {result.totalPnlPct}%
              </p>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3 text-center">
              <p className="text-[10px] text-[var(--text-secondary)] uppercase">Max Drawdown</p>
              <p className="text-[16px] font-bold mt-1 text-[var(--accent-sell)]">{result.maxDrawdownPct}%</p>
            </div>
          </div>

          {chartData && chartData.length > 0 && (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4">
              <p className="text-[12px] font-semibold mb-2">Equity curve</p>
              <div style={{ width: '100%', height: 140 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8A8D91' }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ background: '#121315', border: '1px solid #26282B', borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="pnl" stroke="#4C7CF3" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
            <p className="text-[12px] font-semibold p-3 border-b border-[var(--border)]">Trade-by-trade</p>
            {result.trades.map((t: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 text-[12px] border-b border-[var(--border)] last:border-0">
                <span className="text-[var(--text-secondary)]">
                  {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </span>
                <span className={t.outcome === 'WIN' ? 'text-[var(--accent-buy)]' : 'text-[var(--accent-sell)]'}>
                  {t.outcome} {t.pnlPct > 0 ? '+' : ''}{t.pnlPct}%
                </span>
              </div>
            ))}
          </div>
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

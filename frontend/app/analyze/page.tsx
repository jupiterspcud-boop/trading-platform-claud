'use client';
// Analyze module — real NIFTY option chain from Supabase via backend API.

import { useEffect, useState } from 'react';
import { fetchOptionChain, OptionChainResponse } from '@/lib/api';

export default function AnalyzePage() {
  const [data, setData] = useState<OptionChainResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOptionChain('NIFTY50')
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="px-4 pt-4 space-y-4">
      <div>
        <h1 className="text-lg font-bold">NIFTY Option Chain</h1>
        {data?.spot && (
          <p className="text-[13px] text-[var(--text-secondary)]">
            Spot {Number(data.spot).toLocaleString('en-IN')}
            {data.expiry && ` · Expiry ${new Date(data.expiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`}
          </p>
        )}
      </div>

      {error && <p className="text-[13px] text-[var(--accent-sell)]">Couldn't load option chain: {error}</p>}
      {!data && !error && <p className="text-[13px] text-[var(--text-secondary)]">Loading…</p>}

      {data && data.chain.length === 0 && (
        <p className="text-[13px] text-[var(--text-secondary)]">
          No option data synced yet. Run a sync first.
        </p>
      )}

      {data && data.chain.length > 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-3 px-4 py-2.5 text-[11px] text-[var(--text-secondary)] font-medium uppercase tracking-wide border-b border-[var(--border)]">
            <span>Call</span>
            <span className="text-center">Strike</span>
            <span className="text-right">Put</span>
          </div>
          {data.chain.map((row) => (
            <div key={row.strike} className="grid grid-cols-3 px-4 py-3 text-[14px] border-b border-[var(--border)] last:border-0">
              <span className="text-[var(--accent-buy)] font-medium">
                {row.callLtp != null ? Number(row.callLtp).toFixed(2) : '—'}
              </span>
              <span className="text-center font-semibold">{row.strike}</span>
              <span className="text-[var(--accent-sell)] font-medium text-right">
                {row.putLtp != null ? Number(row.putLtp).toFixed(2) : '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-[11px] text-[var(--text-secondary)] pt-2">
        Real data from Angel One, synced daily. Greeks and IV surface coming soon.
      </p>
    </div>
  );
}

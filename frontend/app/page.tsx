'use client';
// Dashboard — landing page. Fetches real index prices from Supabase via
// the backend API (set up in backend/src/routes/analysis.ts /latest-spot).

import { useEffect, useState } from 'react';
import { fetchLatestSpot, LatestSpot } from '@/lib/api';

const DISPLAY_NAMES: Record<string, string> = {
  NIFTY50: 'NIFTY 50',
  BANKNIFTY: 'BANK NIFTY',
  SENSEX: 'SENSEX',
  GIFTNIFTY: 'GIFT NIFTY',
};

export default function Dashboard() {
  const [indices, setIndices] = useState<LatestSpot[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLatestSpot()
      .then(setIndices)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="px-4 pt-4 space-y-5">
      {/* Index ticker cards — real data from Supabase */}
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1" style={{ scrollbarWidth: 'none' }}>
        {error && (
          <p className="text-[12px] text-[var(--accent-sell)]">Couldn't load prices: {error}</p>
        )}
        {!indices && !error && (
          <p className="text-[12px] text-[var(--text-secondary)]">Loading live prices…</p>
        )}
        {indices?.filter((idx) => idx.value !== null).map((idx) => {
          const up = (idx.change ?? 0) >= 0;
          return (
            <div
              key={idx.symbol}
              className="shrink-0 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 min-w-[130px]"
            >
              <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                {DISPLAY_NAMES[idx.symbol] || idx.symbol}
              </p>
              <p className="text-[15px] font-semibold mt-0.5">
                {idx.value?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
              <p className={`text-[11px] font-medium mt-0.5 ${up ? 'text-[var(--accent-buy)]' : 'text-[var(--accent-sell)]'}`}>
                {up ? '+' : ''}{idx.change} ({up ? '+' : ''}{idx.pct}%)
              </p>
            </div>
          );
        })}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4">
          <p className="text-[12px] text-[var(--text-secondary)]">Active Strategies</p>
          <p className="text-2xl font-bold mt-1">0</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4">
          <p className="text-[12px] text-[var(--text-secondary)]">Today's P&amp;L</p>
          <p className="text-2xl font-bold mt-1 text-[var(--text-primary)]">₹0</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 space-y-3">
        <p className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Quick Actions</p>
        <div className="grid grid-cols-2 gap-2.5">
          <a href="/build" className="bg-[var(--accent-brand)] text-white text-center text-[13px] font-semibold py-3 rounded-xl">
            + New Strategy
          </a>
          <a href="/analyze" className="bg-[var(--bg-card-hover)] border border-[var(--border)] text-center text-[13px] font-semibold py-3 rounded-xl">
            View Option Chain
          </a>
        </div>
      </div>

      <p className="text-center text-[11px] text-[var(--text-secondary)] pt-2">
        Live index prices from Angel One, synced daily via cron-job.org.
      </p>
    </div>
  );
}

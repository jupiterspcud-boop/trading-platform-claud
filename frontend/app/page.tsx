'use client';
// Dashboard — styled after Dhan's actual home screen: portfolio-grid summary,
// ticker bar, watchlist, market movers-style sections.

import { useEffect, useState } from 'react';
import { fetchLatestSpot, LatestSpot } from '@/lib/api';

const DISPLAY_NAMES: Record<string, string> = {
  NIFTY50: 'Nifty 50',
  BANKNIFTY: 'Nifty Bank',
  SENSEX: 'Sensex',
  GIFTNIFTY: 'Gift Nifty',
};

function getMarketStatus() {
  const now = new Date();
  const istOffset = 5.5 * 60;
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + istOffset * 60000);
  const day = ist.getDay();
  const minutes = ist.getHours() * 60 + ist.getMinutes();
  const isWeekday = day >= 1 && day <= 5;
  const isOpen = isWeekday && minutes >= 9 * 60 + 15 && minutes <= 15 * 60 + 30;
  if (!isOpen) return { label: 'Market Closed', open: false };
  const remaining = 15 * 60 + 30 - minutes;
  return { label: `Closes in ${Math.floor(remaining / 60)}h ${remaining % 60}m`, open: true };
}

export default function Dashboard() {
  const [indices, setIndices] = useState<LatestSpot[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [market, setMarket] = useState(getMarketStatus());

  useEffect(() => {
    fetchLatestSpot().then(setIndices).catch((err) => setError(err.message));
    const timer = setInterval(() => setMarket(getMarketStatus()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-0">
      {/* Ticker strip — Dhan shows indices right under the header */}
      <div className="flex gap-4 overflow-x-auto px-4 py-2.5 border-b border-[var(--border)]" style={{ scrollbarWidth: 'none' }}>
        {indices?.filter((i) => i.value !== null).map((idx) => {
          const up = (idx.change ?? 0) >= 0;
          return (
            <div key={idx.symbol} className="shrink-0 flex items-baseline gap-1.5">
              <span className="text-[12px] text-[var(--text-secondary)]">{DISPLAY_NAMES[idx.symbol] || idx.symbol}</span>
              <span className="text-[12px] font-semibold">{idx.value?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              <span className={`text-[11px] ${up ? 'text-[var(--accent-buy)]' : 'text-[var(--accent-sell)]'}`}>
                {up ? '+' : ''}{idx.pct}%
              </span>
            </div>
          );
        })}
        {!indices && !error && <span className="text-[12px] text-[var(--text-secondary)]">Loading tickers…</span>}
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Market status */}
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${market.open ? 'bg-[var(--accent-buy)]' : 'bg-[var(--text-secondary)]'}`} />
          <span className="text-[11px] text-[var(--text-secondary)] font-medium">{market.label}</span>
        </div>

        {/* My Portfolio — Dhan-style grid summary card */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-3.5 pb-3 border-b border-[var(--border)]">
            <span className="text-[14px] font-semibold">My Strategies</span>
            <div className="flex gap-3 text-[11px] text-[var(--text-secondary)]">
              <span className="text-[var(--text-primary)] font-medium">All</span>
              <span>Live</span>
              <span>Backtested</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-y-3.5 px-4 py-3.5">
            <div>
              <p className="text-[11px] text-[var(--text-secondary)]">Active Strategies</p>
              <p className="text-[16px] font-semibold mt-0.5">0</p>
            </div>
            <div>
              <p className="text-[11px] text-[var(--text-secondary)]">Total Backtests Run</p>
              <p className="text-[16px] font-semibold mt-0.5">0</p>
            </div>
            <div>
              <p className="text-[11px] text-[var(--text-secondary)]">Today's P&amp;L</p>
              <p className="text-[16px] font-semibold mt-0.5">₹0.00 (0.00%)</p>
            </div>
            <div>
              <p className="text-[11px] text-[var(--text-secondary)]">Available Margin</p>
              <p className="text-[16px] font-semibold mt-0.5">₹0.00</p>
            </div>
          </div>
        </div>

        {/* Invest/Trade shortcuts — Dhan's icon grid pattern */}
        <div>
          <p className="text-[13px] font-semibold mb-2.5">Analyze &amp; Trade</p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Analyze', href: '/analyze', emoji: '📊' },
              { label: 'Build', href: '/build', emoji: '🛠️' },
              { label: 'Backtest', href: '/backtest', emoji: '⏮️' },
              { label: 'Execute', href: '/execute', emoji: '⚡' },
            ].map((item) => (
              <a key={item.label} href={item.href} className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-[20px]">
                  {item.emoji}
                </div>
                <span className="text-[11px] text-[var(--text-secondary)]">{item.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Key Indices — Dhan's simple list-row pattern */}
        <div>
          <p className="text-[13px] font-semibold mb-2">Key Indices</p>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
            {error && <p className="text-[12px] text-[var(--accent-sell)] p-4">Couldn't load prices: {error}</p>}
            {indices?.filter((i) => i.value !== null).map((idx, i, arr) => {
              const up = (idx.change ?? 0) >= 0;
              return (
                <div
                  key={idx.symbol}
                  className={`flex items-center justify-between px-4 py-3 ${i !== arr.length - 1 ? 'border-b border-[var(--border)]' : ''}`}
                >
                  <span className="text-[13px]">{DISPLAY_NAMES[idx.symbol] || idx.symbol}</span>
                  <div className="text-right">
                    <p className="text-[13px] font-medium">{idx.value?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                    <p className={`text-[11px] ${up ? 'text-[var(--accent-buy)]' : 'text-[var(--accent-sell)]'}`}>
                      {up ? '+' : ''}{idx.change} ({up ? '+' : ''}{idx.pct}%)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-center text-[11px] text-[var(--text-secondary)] pt-1 pb-4">
          Live index prices from Angel One, synced daily.
        </p>
      </div>
    </div>
  );
}

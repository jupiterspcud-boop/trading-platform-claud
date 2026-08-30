'use client';
// Analyze — Option Chain with a symbol switcher (NIFTY/BANKNIFTY/SENSEX),
// styled after Dhan's tv.dhan.co layout.

import { useEffect, useState } from 'react';
import { fetchOptionChain, fetchPcrMaxPain, OptionChainResponse, PcrMaxPain } from '@/lib/api';

const SYMBOLS = [
  { value: 'NIFTY50', label: 'NIFTY 50' },
  { value: 'BANKNIFTY', label: 'BANK NIFTY' },
  { value: 'SENSEX', label: 'SENSEX' },
];

export default function AnalyzePage() {
  const [symbol, setSymbol] = useState('NIFTY50');
  const [data, setData] = useState<OptionChainResponse | null>(null);
  const [pcrData, setPcrData] = useState<PcrMaxPain | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setPcrData(null);
    setError(null);
    fetchOptionChain(symbol).then(setData).catch((err) => setError(err.message));
    fetchPcrMaxPain(symbol).then(setPcrData).catch(() => {});
  }, [symbol]);

  const spot = data?.spot ? Number(data.spot) : null;

  const atmStrike =
    data && spot && data.chain.length > 0
      ? data.chain.reduce((closest, row) =>
          Math.abs(row.strike - spot) < Math.abs(closest.strike - spot) ? row : closest
        , data.chain[0])?.strike
      : null;

  return (
    <div className="pb-4">
      {/* Instrument switcher */}
      <div className="flex gap-2 px-4 pt-4">
        {SYMBOLS.map((s) => (
          <button
            key={s.value}
            onClick={() => setSymbol(s.value)}
            className={`text-[12px] font-semibold px-3.5 py-1.5 rounded-full ${
              symbol === s.value
                ? 'bg-[var(--accent-brand)] text-white'
                : 'bg-[var(--bg-card)] glass border border-[var(--border)] text-[var(--text-secondary)]'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Header stats row */}
      <div className="px-4 pt-4 pb-3 border-b border-[var(--border)]">
        <div className="flex items-baseline gap-2">
          <h1 className="text-[15px] font-semibold">{SYMBOLS.find((s) => s.value === symbol)?.label}</h1>
          {spot && <span className="text-[15px] font-semibold">{spot.toLocaleString('en-IN')}</span>}
        </div>
        <div className="flex gap-4 mt-2 text-[11px] text-[var(--text-secondary)]">
          <span>PCR <span className="text-[var(--text-primary)] font-medium">{pcrData?.pcr ?? '--'}</span></span>
          <span>Max Pain <span className="text-[var(--text-primary)] font-medium">{pcrData?.maxPain ?? '--'}</span></span>
          {data?.expiry && (
            <span>Expiry <span className="text-[var(--text-primary)] font-medium">
              {new Date(data.expiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
            </span></span>
          )}
        </div>
        {pcrData?.note && <p className="text-[10px] text-[var(--text-secondary)] mt-1.5">{pcrData.note}</p>}
      </div>

      {error && <p className="text-[13px] text-[var(--accent-sell)] px-4 pt-4">Couldn't load option chain: {error}</p>}
      {!data && !error && <p className="text-[13px] text-[var(--text-secondary)] px-4 pt-4">Loading…</p>}
      {data && data.chain.length === 0 && (
        <p className="text-[13px] text-[var(--text-secondary)] px-4 pt-4">No option data synced yet for {symbol}.</p>
      )}

      {data && data.chain.length > 0 && (
        <div>
          <div className="grid grid-cols-3 px-4 py-2 text-[10px] text-[var(--text-secondary)] font-semibold uppercase tracking-wide bg-[var(--bg-card)] glass border-b border-[var(--border)]">
            <span>Call LTP</span>
            <span className="text-center">Strike</span>
            <span className="text-right">Put LTP</span>
          </div>

          {data.chain.map((row) => {
            const isATM = row.strike === atmStrike;
            return (
              <div
                key={row.strike}
                className={`grid grid-cols-3 px-4 py-3 text-[14px] border-b border-[var(--border)] ${isATM ? 'bg-[var(--bg-card-hover)] glass' : ''}`}
              >
                <span className="text-[var(--accent-buy)] font-medium">
                  {row.callLtp != null ? Number(row.callLtp).toFixed(2) : '—'}
                </span>
                <span className="text-center">
                  {isATM ? (
                    <span className="bg-[var(--accent-brand)] text-white text-[12px] font-semibold px-2.5 py-0.5 rounded-full">
                      {row.strike}
                    </span>
                  ) : (
                    <span className="font-semibold">{row.strike}</span>
                  )}
                </span>
                <span className="text-[var(--accent-sell)] font-medium text-right">
                  {row.putLtp != null ? Number(row.putLtp).toFixed(2) : '—'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-center text-[11px] text-[var(--text-secondary)] pt-3 px-4">
        Real data from Angel One, synced daily. Greeks and IV surface coming soon.
      </p>
    </div>
  );
}

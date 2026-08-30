'use client';
// Live-data price chart — uses real stored spot_ohlc history from Supabase.

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchSpotHistory, SpotHistoryPoint } from '@/lib/api';

export default function OIChart({ symbol = 'NIFTY50', label = 'Nifty 50' }: { symbol?: string; label?: string }) {
  const [points, setPoints] = useState<SpotHistoryPoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSpotHistory(symbol).then(setPoints).catch((err) => setError(err.message));
  }, [symbol]);

  const chartData = points?.map((p) => ({
    date: new Date(p.candle_time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    close: Number(p.close),
  }));

  const isUp = chartData && chartData.length > 1 && chartData[chartData.length - 1].close >= chartData[0].close;

  return (
    <div className="bg-[var(--bg-card)] glass border border-[var(--border)] rounded-2xl p-4">
      <p className="text-[13px] font-semibold mb-1">{label} — trend</p>
      {error && <p className="text-[12px] text-[var(--accent-sell)]">Couldn't load chart: {error}</p>}
      {!chartData && !error && <p className="text-[12px] text-[var(--text-secondary)]">Loading chart…</p>}
      {chartData && chartData.length > 0 && (
        <div style={{ width: '100%', height: 160 }}>
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8A8D91' }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip
                contentStyle={{ background: '#121315', border: '1px solid #26282B', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#8A8D91' }}
              />
              <Line
                type="monotone"
                dataKey="close"
                stroke={isUp ? '#00C896' : '#FF5B5B'}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {chartData && chartData.length === 0 && (
        <p className="text-[12px] text-[var(--text-secondary)]">No history synced yet.</p>
      )}
    </div>
  );
}

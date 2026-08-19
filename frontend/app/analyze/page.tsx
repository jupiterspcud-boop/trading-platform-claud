// Analyze module — OI, PCR, Greeks, IV Surface, Screener, Flow data.
// TODO: REAL INTEGRATION — wire to backend/src/routes/analysis.ts,
// which itself needs a licensed market data feed.

import OIChart from '@/components/Dashboard/OIChart';

export default function AnalyzePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Analyze</h1>
      <p className="text-[var(--text-muted)]">
        Option chain, Open Interest, PCR, Max Pain, Greeks, IV surface,
        institutional flow — real-time (once data feed connected).
      </p>
      <OIChart />
    </div>
  );
}

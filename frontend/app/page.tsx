// Dashboard — landing page after login.
// TODO: REAL INTEGRATION — replace mock data with live calls to
// /api/analysis/summary once marketDataService is connected.

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[var(--bg-panel)] p-4 rounded-lg border border-[var(--border-subtle)]">
          <p className="text-sm text-[var(--text-muted)]">NIFTY PCR</p>
          <p className="text-2xl font-semibold">-- (connect data feed)</p>
        </div>
        <div className="bg-[var(--bg-panel)] p-4 rounded-lg border border-[var(--border-subtle)]">
          <p className="text-sm text-[var(--text-muted)]">Active Strategies</p>
          <p className="text-2xl font-semibold">0</p>
        </div>
        <div className="bg-[var(--bg-panel)] p-4 rounded-lg border border-[var(--border-subtle)]">
          <p className="text-sm text-[var(--text-muted)]">Today's P&L</p>
          <p className="text-2xl font-semibold">₹0</p>
        </div>
      </div>
    </div>
  );
}

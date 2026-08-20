// Dashboard — landing page after login.
// TODO: REAL INTEGRATION — replace mock data with live calls to
// /api/analysis/summary once fully wired to the frontend.

const indices = [
  { name: 'NIFTY 50', value: '24,225.45', change: '+147.15', pct: '+0.61%', up: true },
  { name: 'BANK NIFTY', value: '57,507.65', change: '+267.90', pct: '+0.47%', up: true },
  { name: 'SENSEX', value: '77,468.45', change: '+558.77', pct: '+0.73%', up: true },
];

export default function Dashboard() {
  return (
    <div className="px-4 pt-4 space-y-5">
      {/* Index ticker cards */}
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1" style={{ scrollbarWidth: 'none' }}>
        {indices.map((idx) => (
          <div
            key={idx.name}
            className="shrink-0 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 min-w-[130px]"
          >
            <p className="text-[11px] text-[var(--text-secondary)] font-medium">{idx.name}</p>
            <p className="text-[15px] font-semibold mt-0.5">{idx.value}</p>
            <p className={`text-[11px] font-medium mt-0.5 ${idx.up ? 'text-[var(--accent-buy)]' : 'text-[var(--accent-sell)]'}`}>
              {idx.change} ({idx.pct})
            </p>
          </div>
        ))}
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
        Live index prices — connect market feed for full option chain data.
      </p>
    </div>
  );
}

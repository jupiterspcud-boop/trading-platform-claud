// Execute module — multi-broker order placement.
// TODO: REAL INTEGRATION — requires OAuth-connected broker account
// (Zerodha Kite Connect / Dhan / Upstox) per user, handled server-side
// in backend/src/services/brokerService.ts.

export default function ExecutePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Execute</h1>
      <div className="bg-[var(--bg-panel)] p-4 rounded-lg border border-[var(--border-subtle)]">
        <p className="text-[var(--text-muted)] text-sm">
          No broker connected. Connect a broker account to enable live
          order placement, price ladder, and position sync.
        </p>
        <button className="mt-3 px-4 py-2 rounded bg-[var(--accent-buy)] text-black text-sm font-medium">
          Connect Broker
        </button>
      </div>
    </div>
  );
}

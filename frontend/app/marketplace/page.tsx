// Marketplace module — publish/follow strategies with verified track record.
// TODO: REAL INTEGRATION — performance stats must come from actual
// executed trades in the DB, never self-reported numbers.

export default function MarketplacePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Marketplace</h1>
      <div className="bg-[var(--bg-panel)] p-4 rounded-lg border border-[var(--border-subtle)]">
        <p className="text-[var(--text-muted)] text-sm">
          No public strategies yet. Once you have a verified backtest or
          live track record, you can publish a strategy here for others
          to copy (with your consent-based revenue share).
        </p>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <div className="px-4 pt-4 space-y-4">
      <h1 className="text-lg font-bold">Marketplace</h1>
      <div className="bg-[var(--bg-card)] glass border border-[var(--border)] rounded-2xl p-4">
        <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
          No public strategies yet. Once you have a verified backtest or live track record, you can publish a strategy here for others to copy.
        </p>
      </div>
    </div>
  );
}

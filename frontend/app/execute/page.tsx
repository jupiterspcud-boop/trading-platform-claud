export default function ExecutePage() {
  return (
    <div className="px-4 pt-4 space-y-4">
      <h1 className="text-lg font-bold">Execute</h1>
      <div className="bg-[var(--bg-card)] glass border border-[var(--border)] rounded-2xl p-4 space-y-3">
        <p className="text-[13px] text-[var(--text-secondary)]">
          No broker connected. Connect a broker account to enable live order placement, price ladder, and position sync.
        </p>
        <button className="w-full bg-[var(--accent-brand)] text-white text-[13px] font-semibold py-3 rounded-xl">
          Connect Broker
        </button>
      </div>
    </div>
  );
}

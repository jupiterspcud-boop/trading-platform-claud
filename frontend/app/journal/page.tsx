export default function JournalPage() {
  return (
    <div className="px-4 pt-4 space-y-4">
      <h1 className="text-lg font-bold">Trading Journal</h1>
      <input
        className="w-full bg-[var(--bg-card)] glass border border-[var(--border)] rounded-xl px-3.5 py-3 text-[13px] placeholder:text-[var(--text-secondary)]"
        placeholder='Ask: "What is my win rate on Friday trades?"'
      />
      <div className="bg-[var(--bg-card)] glass border border-[var(--border)] rounded-2xl p-4">
        <p className="text-[13px] text-[var(--text-secondary)]">No trades logged yet.</p>
      </div>
    </div>
  );
}

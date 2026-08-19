// Journal module — trade history + AI Q&A on your own data.
// TODO: REAL INTEGRATION — /api/journal/query should send the user's
// question + their trade history to aiService.ts for a grounded answer
// (retrieval over their own trades, not open-ended generation).

export default function JournalPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Trading Journal</h1>
      <div className="bg-[var(--bg-panel)] p-4 rounded-lg border border-[var(--border-subtle)]">
        <input
          className="w-full bg-black/30 rounded p-3 text-sm border border-[var(--border-subtle)]"
          placeholder='Ask: "What is my win rate on Friday afternoon trades?"'
        />
      </div>
      <div className="bg-[var(--bg-panel)] p-4 rounded-lg border border-[var(--border-subtle)]">
        <p className="text-[var(--text-muted)] text-sm">No trades logged yet.</p>
      </div>
    </div>
  );
}

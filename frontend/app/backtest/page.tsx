export default function BacktestPage() {
  return (
    <div className="px-4 pt-4 space-y-4">
      <h1 className="text-lg font-bold">Backtest &amp; Paper Trade</h1>
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4">
        <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
          Select a saved strategy, choose a date range, and run a backtest.
          Results — equity curve, win rate, max drawdown — will render here.
        </p>
      </div>
    </div>
  );
}

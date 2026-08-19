// Backtest / Paper Trade module.
// TODO: REAL INTEGRATION — POST strategyId to /api/backtest/run,
// which pulls historical data via marketDataService and simulates fills.

export default function BacktestPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Backtest & Paper Trade</h1>
      <div className="bg-[var(--bg-panel)] p-4 rounded-lg border border-[var(--border-subtle)]">
        <p className="text-[var(--text-muted)] text-sm">
          Select a saved strategy, choose a date range, and run a backtest.
          Results (equity curve, win rate, max drawdown) will render here
          once the backtest engine is connected.
        </p>
      </div>
    </div>
  );
}

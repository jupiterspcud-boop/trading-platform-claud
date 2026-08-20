# Phased Roadmap

## Phase 1 — Analysis MVP (weeks 1-6)
- Integrate one licensed market data provider (e.g. via a broker's data API)
- Build Option Chain + OI + PCR + Max Pain view
- Basic Greeks display
- No execution yet — read-only analytics product

## Phase 2 — Strategy Builder (weeks 6-12)
- Drag-and-drop multi-leg strategy builder
- Payoff chart calculation engine
- Save/load strategies to DB

## Phase 3 — Backtesting + Paper Trading (weeks 12-18)
- Historical data ingestion pipeline
- Backtest engine (entry/exit/SL/target simulation)
- Paper trading mode using live data, virtual balance

## Phase 4 — AI Layer (weeks 18-24)
- Natural language -> strategy JSON (LLM + strict schema validation)
- Trading journal AI Q&A
- Market regime detection (basic volatility-based classifier first,
  ML model later)

## Phase 5 — Broker Execution (weeks 24-30)
- One broker integration first (pick highest user overlap, e.g. Zerodha)
- Order placement, modification, kill switch, position sync
- Add more brokers after the first is stable

## Phase 6 — Marketplace / Copy Trading (weeks 30-36)
- Strategy publishing with verified performance history
- Copy-trading engine with risk score, opt-in/opt-out controls
- Revenue share model for strategy creators

## Phase 7 — Compliance & Launch
- Legal review (SEBI registration path depending on feature set)
- Security audit (auth, encryption, rate limiting)
- Load testing for market-open traffic spikes

## Known Technical Debt (fix before real production use)

- **Angel One rate limiting**: Current fix (800ms delay + 1 retry on 403) is a
  quick patch for testing only. Before going live with real users, replace
  with a proper rate limiter/queue, exponential backoff, and check Angel
  One's documented per-second/per-minute limits.
- **Options token lookup is slow**: `searchScrip` is called per strike/expiry
  on every request. Should cache resolved symbol tokens (they don't change
  within a trading day) instead of re-searching each time.


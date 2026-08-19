# Architecture

```
FRONTEND (Next.js)
  Dashboard | Analyze | Build | Backtest | Execute | Journal | Marketplace
        |  REST / WebSocket
BACKEND API (Express)
  routes: analysis, strategy, backtest, execute, journal, marketplace
        |
  +----------+----------+----------+----------+
  MarketData   Broker      AI          Postgres
  Service      Service     Service     DB
  (NSE feed)   (multi-     (LLM +
               broker)     backtest engine)
```

## Data flow example: user creates a strategy via AI

1. User types a plain-language rule in `Build` tab.
2. Frontend calls `POST /api/strategy/generate-from-text`.
3. Backend `aiService.ts` sends the prompt to an LLM with a strict JSON
   schema (entry/exit/stop-loss/target) and returns structured strategy JSON.
4. Strategy is saved to `strategies` table, status = `draft`.
5. User clicks "Backtest" -> `POST /api/backtest/run` -> backend pulls
   historical data (from `marketDataService`) and simulates fills.
6. Results saved to `backtest_results`, shown as equity curve + stats.
7. User clicks "Paper Trade" -> same engine, but forward-simulated on live
   data feed instead of historical.
8. User clicks "Go Live" -> `execute.ts` routes orders through
   `brokerService.ts`, which is a thin adapter over each broker's real API.

## Why this needs real integrations before going live

- **Market data**: NSE/BSE real-time data is a licensed, paid feed. You
  cannot legally scrape or redistribute exchange data without a license.
- **Broker execution**: Each broker (Zerodha Kite Connect, Dhan API, Upstox
  API) requires a registered developer app, OAuth flow, and per-user token
  management.
- **AI-generated strategies**: Should never auto-execute without a human
  confirmation step and risk guardrails (max position size, kill switch).
- **Compliance**: Any platform giving trading signals/advice or automating
  execution for others in India needs to consider SEBI registration
  (Research Analyst / Investment Adviser / Algo trading approval depending
  on the exact feature set). Consult a securities lawyer before launch.

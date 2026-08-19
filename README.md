# TradePulse — Unified Options Trading Platform (Scaffold)

This is a **starter scaffold**, not a working trading system. It gives you the
folder structure, code stubs, and integration points described in our planning
conversation. Every file marked `// TODO: REAL INTEGRATION` needs a live
credential, licensed data feed, or SEBI-compliant broker connection before it
can run against real markets.

## What this is
- Full frontend layout (Next.js + React + Tailwind) with routes for every
  module: Analyze, Build, Backtest, Execute, Journal, Marketplace.
- Backend API skeleton (Node + Express + TypeScript) with routes and service
  stubs for market data, broker execution, and AI strategy generation.
- Database schema (PostgreSQL) covering users, strategies, trades, backtests,
  and journal entries.

## What this is NOT
- Not connected to any real broker (Zerodha/Dhan/Upstox APIs need your own
  registered app + API keys).
- Not connected to any real market data feed (NSE data is licensed/paid).
- Not SEBI-registered or compliant — required before you can legally offer
  execution or advisory features to the public in India.
- Not production security-hardened (auth, rate limiting, encryption all
  need proper implementation).

## Module Map (matches our planning conversation)

| Module | Folder | Status |
|---|---|---|
| Analyze (OI, PCR, Greeks, IV, Flow) | `frontend/app/analyze`, `backend/src/routes/analysis.ts` | Stub |
| Build (drag-drop + AI + code) | `frontend/app/build`, `backend/src/routes/strategy.ts` | Stub |
| Backtest / Paper Trade | `frontend/app/backtest`, `backend/src/routes/backtest.ts` | Stub |
| Execute (multi-broker) | `frontend/app/execute`, `backend/src/routes/execute.ts` | Stub |
| Journal (AI Q&A) | `frontend/app/journal`, `backend/src/routes/journal.ts` | Stub |
| Marketplace / Copy Trade | `frontend/app/marketplace`, `backend/src/routes/marketplace.ts` | Stub |

## Getting started (once you fill in real integrations)

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && npm install && npm run dev
```

See `docs/ARCHITECTURE.md` for system design and `docs/ROADMAP.md` for a
phased build-out plan.

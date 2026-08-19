-- TradePulse database schema (PostgreSQL)

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE broker_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  broker TEXT NOT NULL,               -- 'zerodha' | 'dhan' | 'upstox'
  access_token_encrypted TEXT NOT NULL,
  connected_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  legs JSONB NOT NULL,                -- [{type, action, strike, qty}, ...]
  stop_loss_pct NUMERIC,
  target_pct NUMERIC,
  source TEXT NOT NULL,               -- 'drag_drop' | 'ai_generated' | 'code'
  status TEXT DEFAULT 'draft',        -- 'draft' | 'backtested' | 'paper' | 'live'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE backtest_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID REFERENCES strategies(id),
  from_date DATE,
  to_date DATE,
  win_rate NUMERIC,
  max_drawdown NUMERIC,
  equity_curve JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  strategy_id UUID REFERENCES strategies(id),
  broker TEXT,
  symbol TEXT,
  leg_type TEXT,                      -- 'CE' | 'PE'
  action TEXT,                        -- 'BUY' | 'SELL'
  strike NUMERIC,
  qty INTEGER,
  entry_price NUMERIC,
  exit_price NUMERIC,
  pnl NUMERIC,
  entered_at TIMESTAMPTZ,
  exited_at TIMESTAMPTZ
);

CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  trade_id UUID REFERENCES trades(id),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID REFERENCES strategies(id),
  publisher_id UUID REFERENCES users(id),
  verified_win_rate NUMERIC,          -- MUST be computed from real trades, not self-reported
  followers_count INTEGER DEFAULT 0,
  revenue_share_pct NUMERIC DEFAULT 0,
  published_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE copy_trading_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES users(id),
  listing_id UUID REFERENCES marketplace_listings(id),
  is_active BOOLEAN DEFAULT true,
  max_capital_allocation NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

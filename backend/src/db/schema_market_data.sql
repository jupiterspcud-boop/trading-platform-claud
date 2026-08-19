-- Market Data Storage — OHLC for Spot + ITM/ATM Options
-- Instruments: GIFT NIFTY, NIFTY 50, BANK NIFTY, SENSEX

-- 1. Instrument master (avoid repeating instrument names everywhere)
CREATE TABLE instruments (
  id SERIAL PRIMARY KEY,
  symbol TEXT UNIQUE NOT NULL,        -- 'NIFTY50' | 'BANKNIFTY' | 'SENSEX' | 'GIFTNIFTY'
  exchange TEXT NOT NULL,             -- 'NSE' | 'BSE' | 'SGX/NSE_IX'
  lot_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Spot price OHLC (index level, e.g. NIFTY 50 spot)
CREATE TABLE spot_ohlc (
  id BIGSERIAL PRIMARY KEY,
  instrument_id INTEGER REFERENCES instruments(id),
  candle_time TIMESTAMPTZ NOT NULL,   -- e.g. 2026-08-19 09:15:00 (1-min candle)
  open NUMERIC NOT NULL,
  high NUMERIC NOT NULL,
  low NUMERIC NOT NULL,
  close NUMERIC NOT NULL,
  volume BIGINT,
  UNIQUE(instrument_id, candle_time)
);

-- 3. Options OHLC (ITM/ATM Call & Put)
CREATE TABLE options_ohlc (
  id BIGSERIAL PRIMARY KEY,
  instrument_id INTEGER REFERENCES instruments(id),
  expiry_date DATE NOT NULL,
  strike NUMERIC NOT NULL,
  option_type TEXT NOT NULL CHECK (option_type IN ('CE','PE')),
  moneyness TEXT NOT NULL CHECK (moneyness IN ('ITM','ATM','OTM')),
  candle_time TIMESTAMPTZ NOT NULL,
  open NUMERIC NOT NULL,
  high NUMERIC NOT NULL,
  low NUMERIC NOT NULL,
  close NUMERIC NOT NULL,
  volume BIGINT,
  open_interest BIGINT,
  UNIQUE(instrument_id, expiry_date, strike, option_type, candle_time)
);

-- Indexes for fast "future la yeduthu check panna" queries
CREATE INDEX idx_spot_ohlc_lookup ON spot_ohlc(instrument_id, candle_time);
CREATE INDEX idx_options_ohlc_lookup ON options_ohlc(instrument_id, expiry_date, candle_time);
CREATE INDEX idx_options_ohlc_moneyness ON options_ohlc(instrument_id, moneyness, candle_time);

-- Seed the 4 instruments
INSERT INTO instruments (symbol, exchange, lot_size) VALUES
  ('NIFTY50', 'NSE', 75),
  ('BANKNIFTY', 'NSE', 30),
  ('SENSEX', 'BSE', 20),
  ('GIFTNIFTY', 'NSE_IX', 75)
ON CONFLICT (symbol) DO NOTHING;

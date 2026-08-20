// REAL INTEGRATION — Angel One SmartAPI
// Docs: https://smartapi.angelbroking.com/docs
//
// Required env vars (set in Render dashboard, never commit to git):
//   ANGEL_API_KEY, ANGEL_CLIENT_ID, ANGEL_PIN, ANGEL_TOTP_SECRET

import axios from 'axios';
import { authenticator } from 'otplib';
import { supabase } from './supabaseClient';

const BASE_URL = 'https://apiconnect.angelone.in';

const API_KEY = process.env.ANGEL_API_KEY || '';
const CLIENT_ID = process.env.ANGEL_CLIENT_ID || '';
const PIN = process.env.ANGEL_PIN || '';
const TOTP_SECRET = process.env.ANGEL_TOTP_SECRET || '';

let cachedJwtToken: string | null = null;
let tokenExpiry = 0;

function commonHeaders(jwt?: string) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-UserType': 'USER',
    'X-SourceID': 'WEB',
    'X-ClientLocalIP': '127.0.0.1',
    'X-ClientPublicIP': '127.0.0.1',
    'X-MACAddress': '00:00:00:00:00:00',
    'X-PrivateKey': API_KEY,
    ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
  };
}

// Step 1: Login with clientcode + PIN + TOTP (generated fresh each time from secret)
async function login(): Promise<string> {
  if (cachedJwtToken && Date.now() < tokenExpiry) return cachedJwtToken;

  if (!API_KEY || !CLIENT_ID || !PIN || !TOTP_SECRET) {
    throw new Error('Angel One credentials missing in environment variables');
  }

  const totp = authenticator.generate(TOTP_SECRET);

  const res = await axios.post(
    `${BASE_URL}/rest/auth/angelbroking/user/v1/loginByPassword`,
    { clientcode: CLIENT_ID, password: PIN, totp },
    { headers: commonHeaders() }
  );

  if (!res.data?.status) {
    throw new Error(`Angel One login failed: ${JSON.stringify(res.data)}`);
  }

  cachedJwtToken = res.data.data.jwtToken;
  tokenExpiry = Date.now() + 6 * 60 * 60 * 1000; // ~6 hours, refresh before actual expiry
  return cachedJwtToken as string;
}

// Step 2: Fetch historical OHLC candles for a given symbol token
// exchange: 'NSE' | 'NFO' | 'BSE' | 'BFO'
// interval: 'ONE_MINUTE' | 'FIVE_MINUTE' | 'ONE_DAY' etc.
export async function getHistoricalOHLC(
  symbolToken: string,
  exchange: string,
  interval: string,
  fromDate: string, // 'YYYY-MM-DD HH:mm'
  toDate: string
) {
  const jwt = await login();

  const res = await axios.post(
    `${BASE_URL}/rest/secure/angelbroking/historical/v1/getCandleData`,
    {
      exchange,
      symboltoken: symbolToken,
      interval,
      fromdate: fromDate,
      todate: toDate,
    },
    { headers: commonHeaders(jwt) }
  );

  if (!res.data?.status) {
    throw new Error(`Historical data fetch failed: ${JSON.stringify(res.data)}`);
  }

  // Each row: [timestamp, open, high, low, close, volume]
  return res.data.data as [string, number, number, number, number, number][];
}

// Step 3: Save spot OHLC candles into Supabase spot_ohlc table
export async function saveSpotOHLC(instrumentSymbol: string, candles: [string, number, number, number, number, number][]) {
  const { data: instrument, error: instErr } = await supabase
    .from('instruments')
    .select('id')
    .eq('symbol', instrumentSymbol)
    .single();

  if (instErr) throw new Error(`Supabase query error: ${instErr.message} (code: ${instErr.code})`);
  if (!instrument) throw new Error(`Instrument not found: ${instrumentSymbol}`);

  const rows = candles.map(([time, open, high, low, close, volume]) => ({
    instrument_id: instrument.id,
    candle_time: time,
    open,
    high,
    low,
    close,
    volume,
  }));

  const { error } = await supabase.from('spot_ohlc').upsert(rows, {
    onConflict: 'instrument_id,candle_time',
  });

  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  return rows.length;
}

// Convenience: fetch + store in one call. Call this from a route or a scheduled job.
export async function syncSpotOHLC(
  instrumentSymbol: string,
  symbolToken: string,
  exchange: string,
  interval: string,
  fromDate: string,
  toDate: string
) {
  const candles = await getHistoricalOHLC(symbolToken, exchange, interval, fromDate, toDate);
  const saved = await saveSpotOHLC(instrumentSymbol, candles);
  return { fetched: candles.length, saved };
}

// TODO: Options OHLC (ITM/ATM/OTM) needs the correct option symboltoken for each
// strike + expiry. Angel One publishes a full instrument list here:
// https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json
// Look up the token for the strike/expiry you want, then call getHistoricalOHLC
// with exchange='NFO' and that token, and compute moneyness (ITM/ATM/OTM) by
// comparing the strike to the spot price before saving to options_ohlc.

// ============================================================
// OPTIONS DATA — ITM / ATM / OTM
// ============================================================

// Angel One trading symbol format for options: e.g. "NIFTY28AUG25C24600CE"
// (varies slightly — weekly options use DDMMMYY, monthly use DDMMMYY too but
// last Thursday of month). You must know the exact expiry date beforehand.
function buildOptionTradingSymbol(underlying: string, expiryDDMMMYY: string, strike: number, optType: 'CE' | 'PE') {
  return `${underlying}${expiryDDMMMYY}${strike}${optType}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Look up the symbol token for a given trading symbol using Angel One's search API.
// Retries once after a short pause if rate-limited (HTTP 403).
async function searchScripToken(tradingSymbol: string, exchange: string): Promise<string> {
  const jwt = await login();
  try {
    const res = await axios.post(
      `${BASE_URL}/rest/secure/angelbroking/order/v1/searchScrip`,
      { exchange, searchscrip: tradingSymbol },
      { headers: commonHeaders(jwt) }
    );
    const match = res.data?.data?.find((d: any) => d.tradingsymbol === tradingSymbol);
    if (!match) throw new Error(`Symbol token not found for ${tradingSymbol}`);
    return match.symboltoken;
  } catch (err: any) {
    if (err.response?.status === 403) {
      await sleep(1500);
      const res = await axios.post(
        `${BASE_URL}/rest/secure/angelbroking/order/v1/searchScrip`,
        { exchange, searchscrip: tradingSymbol },
        { headers: commonHeaders(jwt) }
      );
      const match = res.data?.data?.find((d: any) => d.tradingsymbol === tradingSymbol);
      if (!match) throw new Error(`Symbol token not found for ${tradingSymbol}`);
      return match.symboltoken;
    }
    throw err;
  }
}

function computeMoneyness(spot: number, strike: number, optType: 'CE' | 'PE'): 'ITM' | 'ATM' | 'OTM' {
  const diff = Math.abs(spot - strike);
  // Treat strikes within ~0.25% of spot as ATM (adjust as needed per instrument step size)
  if (diff / spot < 0.0025) return 'ATM';
  if (optType === 'CE') return strike < spot ? 'ITM' : 'OTM';
  return strike > spot ? 'ITM' : 'OTM';
}

// Get the most recent spot close price already stored, to compute moneyness against.
async function getLatestSpotPrice(instrumentSymbol: string): Promise<number> {
  const { data: instrument, error: instErr } = await supabase
    .from('instruments')
    .select('id')
    .eq('symbol', instrumentSymbol)
    .single();
  if (instErr || !instrument) throw new Error(`Instrument not found: ${instrumentSymbol}`);

  const { data, error } = await supabase
    .from('spot_ohlc')
    .select('close')
    .eq('instrument_id', instrument.id)
    .order('candle_time', { ascending: false })
    .limit(1)
    .single();
  if (error || !data) throw new Error(`No spot price found for ${instrumentSymbol} — run spot sync first`);
  return Number(data.close);
}

// Sync OHLC for a list of option strikes (both CE and PE) for one expiry.
// underlying: 'NIFTY' (Angel One's naming, not 'NIFTY50')
// instrumentSymbol: matches the `instruments` table row, e.g. 'NIFTY50'
export async function syncOptionsOHLC(
  instrumentSymbol: string,
  underlying: string,
  expiryDDMMMYY: string, // e.g. '28AUG25'
  expiryDateISO: string, // e.g. '2026-08-28' for the DB column
  strikes: number[],
  exchange: string, // 'NFO' or 'BFO'
  interval: string,
  fromDate: string,
  toDate: string
) {
  const spot = await getLatestSpotPrice(instrumentSymbol);
  const { data: instrument } = await supabase.from('instruments').select('id').eq('symbol', instrumentSymbol).single();
  if (!instrument) throw new Error(`Instrument not found: ${instrumentSymbol}`);

  const results: any[] = [];

  for (const strike of strikes) {
    for (const optType of ['CE', 'PE'] as const) {
      try {
        await sleep(800); // avoid hitting Angel One rate limits
        const tradingSymbol = buildOptionTradingSymbol(underlying, expiryDDMMMYY, strike, optType);
        const token = await searchScripToken(tradingSymbol, exchange);
        const candles = await getHistoricalOHLC(token, exchange, interval, fromDate, toDate);
        const moneyness = computeMoneyness(spot, strike, optType);

        const rows = candles.map(([time, open, high, low, close, volume]) => ({
          instrument_id: instrument.id,
          expiry_date: expiryDateISO,
          strike,
          option_type: optType,
          moneyness,
          candle_time: time,
          open,
          high,
          low,
          close,
          volume,
        }));

        const { error } = await supabase.from('options_ohlc').upsert(rows, {
          onConflict: 'instrument_id,expiry_date,strike,option_type,candle_time',
        });
        if (error) throw new Error(error.message);

        results.push({ strike, optType, moneyness, saved: rows.length });
      } catch (err: any) {
        results.push({ strike, optType, error: err.message });
      }
    }
  }

  return { spot, results };
}

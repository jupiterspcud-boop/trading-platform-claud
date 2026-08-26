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
// Angel One's candle data does NOT include Open Interest — it has a SEPARATE
// endpoint for OI history. Confirmed via Angel One SmartAPI forum.
export async function getHistoricalOI(
  symbolToken: string,
  exchange: string,
  interval: string,
  fromDate: string,
  toDate: string
): Promise<[string, number][]> {
  const jwt = await login();
  const delays = [0, 1500, 3000, 5000];

  let lastError: any;
  for (const delay of delays) {
    if (delay > 0) await sleep(delay);
    try {
      const res = await axios.post(
        `${BASE_URL}/rest/secure/angelbroking/historical/v1/getOIData`,
        { exchange, symboltoken: symbolToken, interval, fromdate: fromDate, todate: toDate },
        { headers: commonHeaders(jwt) }
      );
      if (!res.data?.status) {
        lastError = new Error(`OI data fetch failed: ${JSON.stringify(res.data)}`);
        continue;
      }
      // Angel One's response row shape isn't consistently documented — handle
      // both possible formats: [time, oi] arrays, or {time, oi} style objects.
      const raw = res.data.data || [];
      if (!Array.isArray(raw)) {
        lastError = new Error(`Unexpected OI response shape: ${JSON.stringify(res.data.data).slice(0, 200)}`);
        continue;
      }
      return raw.map((row: any): [string, number] => {
        if (Array.isArray(row)) return [row[0], Number(row[1])];
        const time = row.time || row.timestamp || row.date || row.candle_time;
        const oi = row.oi ?? row.openInterest ?? row.OI ?? row.opnInterest;
        return [time, Number(oi)];
      });
    } catch (err: any) {
      lastError = err;
    }
  }
  // OI is a nice-to-have (used for PCR/Max Pain) — don't fail the whole sync,
  // but DO surface the real reason so it's visible in the sync results instead
  // of silently saving null forever.
  throw lastError || new Error('OI fetch failed for unknown reason');
}

export async function getHistoricalOHLC(
  symbolToken: string,
  exchange: string,
  interval: string,
  fromDate: string, // 'YYYY-MM-DD HH:mm'
  toDate: string
) {
  const jwt = await login();
  const delays = [0, 1500, 3000, 5000]; // initial try + 3 retries

  let lastError: any;
  for (const delay of delays) {
    if (delay > 0) await sleep(delay);
    try {
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
        lastError = new Error(`Historical data fetch failed: ${JSON.stringify(res.data)}`);
        continue;
      }

      // Angel One returns 7 fields for F&O instruments (adds Open Interest as
      // the 7th value) but only 6 for indices/equity — type it as flexible.
      return res.data.data as [string, number, number, number, number, number, number?][];
    } catch (err: any) {
      lastError = err;
    }
  }
  throw lastError;
}

// Step 3: Save spot OHLC candles into Supabase spot_ohlc table
export async function saveSpotOHLC(instrumentSymbol: string, candles: [string, number, number, number, number, number, number?][]) {
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

// Angel One publishes their FULL tradable instrument list here, refreshed daily.
// Fetching this once and searching locally is far more reliable than their
// searchScrip API (which has been inconsistent — sometimes misses valid symbols).
const SCRIP_MASTER_URL = 'https://margincalculator.angelone.in/OpenAPI_File/files/OpenAPIScripMaster.json';

let scripMasterCache: any[] | null = null;
let scripMasterCachedAt = 0;
const SCRIP_MASTER_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function getScripMaster(): Promise<any[]> {
  if (scripMasterCache && Date.now() - scripMasterCachedAt < SCRIP_MASTER_TTL) {
    return scripMasterCache;
  }
  const res = await axios.get(SCRIP_MASTER_URL, { timeout: 30000 });
  scripMasterCache = res.data;
  scripMasterCachedAt = Date.now();
  return scripMasterCache as any[];
}

// Look up the symbol token for a given trading symbol from the full instrument list.
async function searchScripToken(tradingSymbol: string, exchange: string): Promise<string> {
  const master = await getScripMaster();
  const match = master.find((d: any) => d.symbol === tradingSymbol && d.exch_seg === exchange);
  if (!match) throw new Error(`Symbol token not found for ${tradingSymbol} on ${exchange}`);
  return match.token;
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
        await sleep(1800); // avoid hitting Angel One rate limits
        const tradingSymbol = buildOptionTradingSymbol(underlying, expiryDDMMMYY, strike, optType);
        const token = await searchScripToken(tradingSymbol, exchange);
        const candles = await getHistoricalOHLC(token, exchange, interval, fromDate, toDate);
        await sleep(1000);
        let oiRows: [string, number][] = [];
        let oiError: string | null = null;
        try {
          oiRows = await getHistoricalOI(token, exchange, interval, fromDate, toDate);
        } catch (oiErr: any) {
          oiError = oiErr.message;
        }
        const oiMap = new Map(oiRows.map(([time, oi]) => [time, oi]));
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
          open_interest: oiMap.get(time) ?? null,
        }));

        const { error } = await supabase.from('options_ohlc').upsert(rows, {
          onConflict: 'instrument_id,expiry_date,strike,option_type,candle_time',
        });
        if (error) throw new Error(error.message);

        results.push({ strike, optType, moneyness, saved: rows.length, oiError });
      } catch (err: any) {
        results.push({ strike, optType, error: err.message });
      }
    }
  }

  return { spot, results };
}

// ============================================================
// TECHNICAL LEVELS — ORB, Previous Day, Monday, OI Support/Resistance
// ============================================================

function getMostRecentMonday(from: Date): Date {
  const d = new Date(from);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? 6 : day - 1; // days since Monday
  d.setDate(d.getDate() - diff);
  return d;
}

function fmtDateForAngel(d: Date, time: string) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${time}`;
}

export async function getTechnicalLevels(instrumentSymbol: string, symbolToken: string, exchange: string) {
  const today = new Date();
  const monday = getMostRecentMonday(today);

  // 1. Today's 5-min candles (for the "2nd 5-min candle" opening range)
  const todayCandles = await getHistoricalOHLC(
    symbolToken, exchange, 'FIVE_MINUTE',
    fmtDateForAngel(today, '09:15'), fmtDateForAngel(today, '15:30')
  );

  const secondCandle = todayCandles[1]; // index 1 = 2nd candle
  const orb = secondCandle
    ? { open: secondCandle[1], high: secondCandle[2], low: secondCandle[3], close: secondCandle[4], sourceCandle: '2nd 5-min candle' }
    : null;

  // 2. Previous trading day's daily open/close (from stored spot_ohlc)
  const { data: instrument } = await supabase.from('instruments').select('id').eq('symbol', instrumentSymbol).single();
  let previousDay: any = null;
  let mondayLevel: any = null;

  if (instrument) {
    const { data: recentDays } = await supabase
      .from('spot_ohlc')
      .select('candle_time, open, close, high, low')
      .eq('instrument_id', instrument.id)
      .order('candle_time', { ascending: false })
      .limit(10);

    if (recentDays && recentDays.length > 1) {
      previousDay = { ...recentDays[1], sourceCandle: 'Previous day daily candle' };
    }

    // Find Monday's candle among recent days
    const mondayStr = monday.toISOString().slice(0, 10);
    const mondayRow = recentDays?.find((r: any) => r.candle_time.slice(0, 10) === mondayStr);
    if (mondayRow) mondayLevel = { ...mondayRow, sourceCandle: 'Monday daily candle' };
  }

  // 3. Support/Resistance from OI (reuse existing PCR/MaxPain-style OI aggregation)
  let support: number | null = null;
  let resistance: number | null = null;
  let pcr: number | null = null;
  let spot: number | null = null;

  if (instrument) {
    const { data: latestExpiryRow } = await supabase
      .from('options_ohlc').select('expiry_date').eq('instrument_id', instrument.id)
      .order('expiry_date', { ascending: false }).limit(1).single();

    if (latestExpiryRow) {
      const { data: rows } = await supabase
        .from('options_ohlc')
        .select('strike, option_type, open_interest, candle_time')
        .eq('instrument_id', instrument.id)
        .eq('expiry_date', latestExpiryRow.expiry_date)
        .order('candle_time', { ascending: false });

      const seen = new Set<string>();
      const latest = (rows || []).filter((r: any) => {
        const key = `${r.strike}-${r.option_type}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const callRows = latest.filter((r: any) => r.option_type === 'CE' && r.open_interest);
      const putRows = latest.filter((r: any) => r.option_type === 'PE' && r.open_interest);

      // Resistance = strike with max Call OI, Support = strike with max Put OI
      if (callRows.length) resistance = Number(callRows.reduce((a: any, b: any) => (b.open_interest > a.open_interest ? b : a)).strike);
      if (putRows.length) support = Number(putRows.reduce((a: any, b: any) => (b.open_interest > a.open_interest ? b : a)).strike);

      const totalCallOI = callRows.reduce((s: number, r: any) => s + r.open_interest, 0);
      const totalPutOI = putRows.reduce((s: number, r: any) => s + r.open_interest, 0);
      pcr = totalCallOI > 0 ? Number((totalPutOI / totalCallOI).toFixed(2)) : null;
    }

    const { data: spotRow } = await supabase
      .from('spot_ohlc').select('close').eq('instrument_id', instrument.id)
      .order('candle_time', { ascending: false }).limit(1).single();
    spot = spotRow ? Number(spotRow.close) : null;
  }

  // 4. ITM strike selection based on spot
  // For a bullish bias (spot above support), ITM Call = nearest strike BELOW spot.
  // This is a simple default; refine once you tell us the exact directional rule.
  let itmStrike: number | null = null;
  if (spot) {
    itmStrike = Math.floor(spot / 50) * 50; // nearest 50-point strike below spot (NIFTY step)
  }

  // 5. PCR bias interpretation
  let pcrBias: string | null = null;
  if (pcr !== null) {
    if (pcr < 0.9) pcrBias = 'Below 0.9 — bearish bias, Put buying opportunity zone';
    else if (pcr > 1.3) pcrBias = 'Above 1.3 — bullish bias, Call buying opportunity zone';
    else pcrBias = 'Neutral zone (0.9–1.3)';
  }

  return {
    note: '30-second candle marking (Point 1) needs live WebSocket data — not available from daily historical sync yet.',
    spot,
    orb,
    previousDay,
    mondayLevel,
    support: support ? { strike: support, source: 'Max Put OI' } : null,
    resistance: resistance ? { strike: resistance, source: 'Max Call OI' } : null,
    pcr,
    pcrBias,
    itmStrike: itmStrike ? { strike: itmStrike, note: 'Nearest ITM Call strike below spot — confirm this matches your intended direction rule' } : null,
  };
}

// Standalone script for the Render Cron Job.
// Fetches yesterday's daily OHLC for all supported indices and stores them.
// Run manually: `node dist/scripts/dailySync.js`

import dotenv from 'dotenv';
dotenv.config();

import { syncSpotOHLC } from '../services/marketDataService';

const INSTRUMENT_TOKENS: Record<string, { token: string; exchange: string }> = {
  NIFTY50: { token: '99926000', exchange: 'NSE' },
  BANKNIFTY: { token: '99926009', exchange: 'NSE' },
  SENSEX: { token: '99919000', exchange: 'BSE' },
};

function formatDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} 09:15`;
}

async function run() {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);

  const fromDate = formatDate(weekAgo);
  const toDate = formatDate(today).replace('09:15', '15:30');

  console.log(`Daily sync starting: ${fromDate} to ${toDate}`);

  for (const [symbol, { token, exchange }] of Object.entries(INSTRUMENT_TOKENS)) {
    try {
      const result = await syncSpotOHLC(symbol, token, exchange, 'ONE_DAY', fromDate, toDate);
      console.log(`${symbol}: OK — fetched ${result.fetched}, saved ${result.saved}`);
    } catch (err: any) {
      console.error(`${symbol}: FAILED — ${err.message}`);
    }
  }

  console.log('Daily sync complete.');
}

run().then(() => process.exit(0)).catch((err) => {
  console.error('Fatal error in daily sync:', err);
  process.exit(1);
});

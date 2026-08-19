// TODO: REAL INTEGRATION REQUIRED
// This must connect to a licensed market data provider. Options include:
//   - Your broker's data API (e.g. Zerodha Kite Connect historical/quote API)
//   - A dedicated vendor (e.g. Global Datafeeds, TrueData) — paid, licensed
// Do NOT scrape NSE/BSE websites directly — against exchange terms of use.

export async function getOptionChain(symbol: string) {
  throw new Error('Not implemented: connect a licensed market data provider');
}

export async function getGreeks(symbol: string, expiry: string) {
  throw new Error('Not implemented');
}

export async function getHistoricalData(symbol: string, from: string, to: string) {
  throw new Error('Not implemented');
}

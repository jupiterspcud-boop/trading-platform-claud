// TODO: REAL INTEGRATION REQUIRED
// Each broker needs its own registered developer app + OAuth flow.
// This file should expose one common interface, e.g.:
//
//   placeOrder(broker, userToken, orderPayload)
//
// and internally route to the right broker-specific client
// (Zerodha Kite Connect, Dhan API, Upstox API, etc).
//
// Store user broker tokens encrypted, never in plain text.

export async function placeOrder(broker: string, userToken: string, order: object) {
  throw new Error('Not implemented: connect a real broker API');
}

export async function getPositions(broker: string, userToken: string) {
  throw new Error('Not implemented');
}

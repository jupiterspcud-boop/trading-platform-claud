'use client';
// Placeholder OI chart. Replace `mockData` with a fetch to
// GET /api/analysis/oi?symbol=NIFTY once the backend is live.

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const mockData = [
  { strike: 24000, callOI: 1200, putOI: 900 },
  { strike: 24100, callOI: 1800, putOI: 1400 },
  { strike: 24200, callOI: 2600, putOI: 2100 },
  { strike: 24300, callOI: 1900, putOI: 2400 },
  { strike: 24400, callOI: 1100, putOI: 1700 },
];

export default function OIChart() {
  return (
    <div className="bg-[var(--bg-card)] p-4 rounded-lg border border-[var(--border)] h-80">
      <p className="text-sm text-[var(--text-secondary)] mb-2">
        Open Interest by Strike (mock data — connect market feed)
      </p>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={mockData}>
          <XAxis dataKey="strike" stroke="#8B96A5" />
          <YAxis stroke="#8B96A5" />
          <Tooltip />
          <Line type="monotone" dataKey="callOI" stroke="#00C896" name="Call OI" />
          <Line type="monotone" dataKey="putOI" stroke="#FF5B5B" name="Put OI" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

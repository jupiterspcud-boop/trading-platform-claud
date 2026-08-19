'use client';
// Drag & drop / template-based strategy builder (beginner mode).
// TODO: REAL INTEGRATION — leg data should POST to
// /api/strategy/create with { legs, stopLoss, target, symbol }.

import { useState } from 'react';

type Leg = { type: 'CE' | 'PE'; action: 'BUY' | 'SELL'; strike: number; qty: number };

const TEMPLATES = ['Straddle', 'Strangle', 'Iron Condor', 'Calendar Spread', 'Bull Call Spread'];

export default function DragDropBuilder() {
  const [legs, setLegs] = useState<Leg[]>([]);

  function addLeg() {
    setLegs([...legs, { type: 'CE', action: 'BUY', strike: 24200, qty: 1 }]);
  }

  return (
    <div className="bg-[var(--bg-panel)] p-4 rounded-lg border border-[var(--border-subtle)] space-y-4">
      <h2 className="font-medium">Or build manually</h2>

      <div className="flex gap-2 flex-wrap">
        {TEMPLATES.map((t) => (
          <button
            key={t}
            className="px-3 py-1.5 text-xs rounded border border-[var(--border-subtle)] hover:bg-white/5"
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {legs.map((leg, i) => (
          <div key={i} className="flex gap-2 text-sm items-center">
            <span className="text-[var(--text-muted)]">Leg {i + 1}:</span>
            <span>{leg.action} {leg.qty} {leg.type} @ {leg.strike}</span>
          </div>
        ))}
        <button onClick={addLeg} className="text-sm text-[var(--accent-buy)]">
          + Add leg
        </button>
      </div>
    </div>
  );
}

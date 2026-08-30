'use client';
import { useState } from 'react';

type Leg = { type: 'CE' | 'PE'; action: 'BUY' | 'SELL'; strike: number; qty: number };
const TEMPLATES = ['Straddle', 'Strangle', 'Iron Condor', 'Calendar', 'Bull Call'];

export default function DragDropBuilder() {
  const [legs, setLegs] = useState<Leg[]>([]);
  function addLeg() { setLegs([...legs, { type: 'CE', action: 'BUY', strike: 24200, qty: 1 }]); }

  return (
    <div className="bg-[var(--bg-card)] glass border border-[var(--border)] rounded-2xl p-4 space-y-3">
      <p className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Or build manually</p>
      <div className="flex gap-2 flex-wrap">
        {TEMPLATES.map((t) => (
          <button key={t} className="px-3 py-1.5 text-[12px] rounded-full border border-[var(--border)] bg-[var(--bg-card-hover)] glass">{t}</button>
        ))}
      </div>
      <div className="space-y-2 pt-1">
        {legs.map((leg, i) => (
          <div key={i} className="flex justify-between items-center text-[12.5px] bg-black/20 rounded-lg px-3 py-2">
            <span className="text-[var(--text-secondary)]">Leg {i + 1}</span>
            <span className="font-medium">{leg.action} {leg.qty} {leg.type} @ {leg.strike}</span>
          </div>
        ))}
        <button onClick={addLeg} className="text-[12.5px] text-[var(--accent-brand)] font-semibold">+ Add leg</button>
      </div>
    </div>
  );
}

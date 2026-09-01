'use client';
// Reusable form for creating or editing a strategy. Legs are built one at a
// time (action + type + strike) and shown as a removable list before saving.

import { useState } from 'react';
import { Strategy } from '@/lib/api';
import { authFetch } from '@/lib/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tradepulse-backend-l79z.onrender.com';

type Leg = { action: 'BUY' | 'SELL'; type: 'CE' | 'PE'; strike: string };

export default function StrategyForm({
  existing,
  prefill,
  onSaved,
  onCancel,
}: {
  existing?: Strategy;
  prefill?: any;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(existing?.name || '');
  const [symbol, setSymbol] = useState(existing?.symbol || 'NIFTY50');
  const [legs, setLegs] = useState<Leg[]>(existing?.legs || prefill?.legs || []);
  const [stopLossPct, setStopLossPct] = useState(
    existing?.stop_loss_pct?.toString() || prefill?.stopLossPct?.toString() || '20'
  );
  const [targetPct, setTargetPct] = useState(
    existing?.target_pct?.toString() || prefill?.targetPct?.toString() || '30'
  );
  const [triggerCondition, setTriggerCondition] = useState(
    (existing as any)?.trigger_condition || prefill?.triggerCondition || 'NONE'
  );
  const [legAction, setLegAction] = useState<'BUY' | 'SELL'>('BUY');
  const [legType, setLegType] = useState<'CE' | 'PE'>('CE');
  const [legStrike, setLegStrike] = useState('ATM');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addLeg() {
    setLegs([...legs, { action: legAction, type: legType, strike: legStrike }]);
  }

  function removeLeg(i: number) {
    setLegs(legs.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = {
        name,
        symbol,
        legs,
        stopLossPct: Number(stopLossPct),
        targetPct: Number(targetPct),
        source: 'manual',
        triggerCondition,
      };
      const url = existing ? `/api/strategy/${existing.id}` : `/api/strategy/create`;
      const method = existing ? 'PUT' : 'POST';
      const res = await authFetch(url, {
        method,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Save failed');
      onSaved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-[var(--bg-card)] glass border border-[var(--accent-brand)] rounded-2xl p-4 space-y-3">
      <p className="text-[14px] font-semibold">{existing ? 'Edit strategy' : 'New strategy'}</p>

      <div>
        <label className="text-[11px] text-[var(--text-secondary)]">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. My ORB Strategy"
          className="w-full bg-[var(--bg-card-hover)] glass border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] mt-1"
        />
      </div>

      <div>
        <label className="text-[11px] text-[var(--text-secondary)]">Symbol</label>
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="w-full bg-[var(--bg-card-hover)] glass border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] mt-1"
        >
          <option value="NIFTY50">NIFTY50</option>
          <option value="BANKNIFTY">BANKNIFTY</option>
          <option value="SENSEX">SENSEX</option>
        </select>
      </div>

      <div>
        <label className="text-[11px] text-[var(--text-secondary)]">Entry trigger</label>
        <select
          value={triggerCondition}
          onChange={(e) => setTriggerCondition(e.target.value)}
          className="w-full bg-[var(--bg-card-hover)] glass border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] mt-1"
        >
          <option value="NONE">None — trade every day</option>
          <option value="PREV_DAY_BREAKOUT_HIGH">Breakout above previous day's high</option>
          <option value="PREV_DAY_BREAKOUT_LOW">Breakdown below previous day's low</option>
        </select>
      </div>

      <div>
        <label className="text-[11px] text-[var(--text-secondary)]">Legs</label>
        <div className="space-y-1.5 mt-1">
          {legs.map((leg, i) => (
            <div key={i} className="flex items-center justify-between bg-[var(--bg-card-hover)] glass rounded-lg px-3 py-1.5 text-[12px]">
              <span>{leg.action} {leg.type} @ {leg.strike}</span>
              <button onClick={() => removeLeg(i)} className="text-[var(--accent-sell)] text-[11px]">Remove</button>
            </div>
          ))}
        </div>
        <div className="flex gap-1.5 mt-2">
          <select value={legAction} onChange={(e) => setLegAction(e.target.value as any)} className="bg-[var(--bg-card-hover)] glass border border-[var(--border)] rounded-lg px-2 py-1.5 text-[12px]">
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
          <select value={legType} onChange={(e) => setLegType(e.target.value as any)} className="bg-[var(--bg-card-hover)] glass border border-[var(--border)] rounded-lg px-2 py-1.5 text-[12px]">
            <option value="CE">CE</option>
            <option value="PE">PE</option>
          </select>
          <input
            value={legStrike}
            onChange={(e) => setLegStrike(e.target.value)}
            placeholder="ATM / OTM+1"
            className="flex-1 bg-[var(--bg-card-hover)] glass border border-[var(--border)] rounded-lg px-2 py-1.5 text-[12px]"
          />
          <button onClick={addLeg} className="bg-[var(--accent-brand)] text-white px-3 py-1.5 rounded-lg text-[12px] font-medium">
            + Add
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="text-[11px] text-[var(--text-secondary)]">Stop-loss %</label>
          <input
            type="number"
            value={stopLossPct}
            onChange={(e) => setStopLossPct(e.target.value)}
            className="w-full bg-[var(--bg-card-hover)] glass border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] mt-1"
          />
        </div>
        <div>
          <label className="text-[11px] text-[var(--text-secondary)]">Target %</label>
          <input
            type="number"
            value={targetPct}
            onChange={(e) => setTargetPct(e.target.value)}
            className="w-full bg-[var(--bg-card-hover)] glass border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] mt-1"
          />
        </div>
      </div>

      {error && <p className="text-[12px] text-[var(--accent-sell)]">{error}</p>}

      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <button onClick={onCancel} className="bg-[var(--bg-card-hover)] glass border border-[var(--border)] text-[13px] font-semibold py-2.5 rounded-xl">
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[var(--accent-brand)] text-white text-[13px] font-semibold py-2.5 rounded-xl disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

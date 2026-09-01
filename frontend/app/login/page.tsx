'use client';

import { useState } from 'react';
import { login } from '@/lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 pt-16 flex flex-col items-center">
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center">
          <div className="w-12 h-12 bg-[var(--accent-brand)] rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto">
            T
          </div>
          <h1 className="text-lg font-bold mt-3">Welcome back</h1>
          <p className="text-[12px] text-[var(--text-secondary)] mt-1">Log in to TradePulse</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[var(--bg-card)] glass border border-[var(--border)] rounded-xl px-4 py-3 text-[14px]"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[var(--bg-card)] glass border border-[var(--border)] rounded-xl px-4 py-3 text-[14px]"
          />
          {error && <p className="text-[12px] text-[var(--accent-sell)]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--accent-brand)] text-white font-semibold py-3 rounded-xl text-[14px] disabled:opacity-50"
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="text-center text-[12px] text-[var(--text-secondary)]">
          Don't have an account? <a href="/signup" className="text-[var(--accent-brand)] font-medium">Sign up</a>
        </p>
      </div>
    </div>
  );
}

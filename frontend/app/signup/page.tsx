'use client';

import { useState } from 'react';
import { signup } from '@/lib/auth';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signup(email, password);
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
          <h1 className="text-lg font-bold mt-3">Create your account</h1>
          <p className="text-[12px] text-[var(--text-secondary)] mt-1">Get started with TradePulse</p>
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
            minLength={6}
            placeholder="Password (min 6 characters)"
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
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <p className="text-center text-[12px] text-[var(--text-secondary)]">
          Already have an account? <a href="/login" className="text-[var(--accent-brand)] font-medium">Log in</a>
        </p>
      </div>
    </div>
  );
}

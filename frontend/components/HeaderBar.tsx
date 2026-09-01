'use client';
// Top header bar — shows logged-in user's email and a logout button on
// app pages; hides itself on /login and /signup.

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getUser, logout } from '@/lib/auth';

const PUBLIC_PATHS = ['/login', '/signup'];

export default function HeaderBar() {
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const user = getUser();
    setEmail(user?.email || null);
  }, [pathname]);

  if (PUBLIC_PATHS.includes(pathname)) return null;

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3.5 bg-[var(--bg-app)]/95 backdrop-blur border-b border-[var(--border)]">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[var(--accent-brand)] flex items-center justify-center">
          <span className="text-white text-sm font-bold">T</span>
        </div>
        <span className="font-semibold text-[15px] tracking-tight">TradePulse</span>
      </div>
      <div className="flex items-center gap-3">
        <a href="/journal" className="text-xs text-[var(--text-secondary)]">Journal</a>
        {email && (
          <button onClick={logout} className="text-xs text-[var(--accent-sell)] font-medium">
            Logout
          </button>
        )}
      </div>
    </header>
  );
}

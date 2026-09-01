'use client';
// Client-side route guard — redirects to /login if not authenticated.
// Static export can't do server-side auth checks, so this runs on mount.

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { isLoggedIn, getUser, logout } from '@/lib/auth';

const PUBLIC_PATHS = ['/login', '/signup'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    const isPublic = PUBLIC_PATHS.includes(pathname);
    if (!isLoggedIn() && !isPublic) {
      window.location.href = '/login';
      return;
    }
    setUser(getUser());
    setReady(true);
  }, [pathname]);

  if (!ready && !PUBLIC_PATHS.includes(pathname)) {
    return <div className="px-4 pt-16 text-center text-[13px] text-[var(--text-secondary)]">Loading…</div>;
  }

  return (
    <>
      {user && !PUBLIC_PATHS.includes(pathname) && (
        <div className="hidden">{/* user email available via useUser() elsewhere if needed */}</div>
      )}
      {children}
    </>
  );
}

export { logout };

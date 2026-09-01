import './../styles/globals.css';
import AuthGuard from '@/components/AuthGuard';
import HeaderBar from '@/components/HeaderBar';

export const metadata = {
  title: 'TradePulse — Analyze. Build. Execute.',
  description: 'Unified options trading platform',
};

const navItems = [
  { href: '/', label: 'Home', icon: 'M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10' },
  { href: '/analyze', label: 'Analyze', icon: 'M9 19V6l8 6.5L9 19z M3 3h18v18H3z' },
  { href: '/build', label: 'Build', icon: 'M12 4v16m8-8H4' },
  { href: '/backtest', label: 'Backtest', icon: 'M3 3v18h18 M7 14l3-3 3 3 5-6' },
  { href: '/execute', label: 'Execute', icon: 'M13 2L3 14h7l-1 8 10-12h-7l1-8z' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthGuard>
          <div className="min-h-screen flex flex-col max-w-md mx-auto relative">
            <HeaderBar />
            <main className="flex-1 pb-20">{children}</main>
            <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[var(--bg-card)] glass border-t border-[var(--border)] flex items-stretch z-20">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[var(--text-secondary)] hover:text-[var(--accent-brand)] transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={item.icon} />
                  </svg>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </a>
              ))}
            </nav>
          </div>
        </AuthGuard>
      </body>
    </html>
  );
}

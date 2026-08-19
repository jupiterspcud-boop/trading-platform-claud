import './../styles/globals.css';

export const metadata = {
  title: 'TradePulse — Analyze. Build. Execute.',
  description: 'Unified options trading platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex">
          {/* Sidebar nav — module map from architecture doc */}
          <nav className="w-56 border-r border-[var(--border-subtle)] p-4 space-y-2">
            <a href="/" className="block py-2 px-3 rounded hover:bg-white/5">Dashboard</a>
            <a href="/analyze" className="block py-2 px-3 rounded hover:bg-white/5">Analyze</a>
            <a href="/build" className="block py-2 px-3 rounded hover:bg-white/5">Build</a>
            <a href="/backtest" className="block py-2 px-3 rounded hover:bg-white/5">Backtest</a>
            <a href="/execute" className="block py-2 px-3 rounded hover:bg-white/5">Execute</a>
            <a href="/journal" className="block py-2 px-3 rounded hover:bg-white/5">Journal</a>
            <a href="/marketplace" className="block py-2 px-3 rounded hover:bg-white/5">Marketplace</a>
          </nav>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}

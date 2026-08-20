// Analyze module — Option chain, OI, PCR, Greeks.
// TODO: REAL INTEGRATION — wire to backend/src/routes/analysis.ts

const chainData = [
  { strike: 24150, callOI: '4.42L', callLtp: '220.65', putLtp: '54.20', putOI: '17.26L', side: 'call' },
  { strike: 24200, callOI: '83.01L', callLtp: '186.15', putLtp: '69.50', putOI: '1.37Cr', side: 'call' },
  { strike: 24250, callOI: '32.17L', callLtp: '153.75', putLtp: '87.40', putOI: '30.16L', side: 'atm' },
  { strike: 24300, callOI: '98.65L', callLtp: '125.80', putLtp: '109.10', putOI: '68.43L', side: 'put' },
  { strike: 24350, callOI: '33.66L', callLtp: '101.40', putLtp: '134.20', putOI: '19.23L', side: 'put' },
];

export default function AnalyzePage() {
  return (
    <div className="px-4 pt-4 space-y-4">
      <div>
        <h1 className="text-lg font-bold">NIFTY Option Chain</h1>
        <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
          Spot 24,225.45 · Expiry 25 Aug 2026
        </p>
      </div>

      <div className="flex gap-2">
        {['PCR', 'Max Pain', 'IV'].map((label) => (
          <div key={label} className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-center">
            <p className="text-[10px] text-[var(--text-secondary)]">{label}</p>
            <p className="text-[14px] font-semibold mt-0.5">--</p>
          </div>
        ))}
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-5 text-[10px] font-semibold text-[var(--text-secondary)] px-3 py-2 border-b border-[var(--border)] uppercase tracking-wide">
          <span className="text-left">OI</span>
          <span className="text-right">CALL</span>
          <span className="text-center">Strike</span>
          <span className="text-left">PUT</span>
          <span className="text-right">OI</span>
        </div>
        {chainData.map((row) => (
          <div
            key={row.strike}
            className={`grid grid-cols-5 items-center px-3 py-2.5 text-[12.5px] border-b border-[var(--border)] last:border-0 ${
              row.side === 'atm' ? 'bg-[var(--accent-brand)]/10' : ''
            }`}
          >
            <span className="text-[var(--text-secondary)]">{row.callOI}</span>
            <span className="text-right font-medium text-[var(--accent-buy)]">{row.callLtp}</span>
            <span className="text-center font-semibold">{row.strike}</span>
            <span className="font-medium text-[var(--accent-sell)]">{row.putLtp}</span>
            <span className="text-right text-[var(--text-secondary)]">{row.putOI}</span>
          </div>
        ))}
      </div>

      <p className="text-center text-[11px] text-[var(--text-secondary)] pb-2">
        Sample layout — connect live feed for real-time chain.
      </p>
    </div>
  );
}

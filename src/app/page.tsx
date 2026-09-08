export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Internal tool
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Self-Storage Opportunity Tracker
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Track self-storage investment sale opportunities from first sighting
          through client offer.
        </p>

        <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Status</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>✓ Phase 1 — project scaffolded &amp; hosting proven</li>
            <li className="text-slate-400">• Phase 2 — listing tracker (/dashboard)</li>
            <li className="text-slate-400">• Phase 3 — clients &amp; buy-box matching</li>
            <li className="text-slate-400">• Phase 4 — client share pages</li>
            <li className="text-slate-400">• Phase 5 — weekly snapshot publishing</li>
            <li className="text-slate-400">• Phase 6 — styling, mobile &amp; branding</li>
          </ul>
        </div>

        <p className="mt-8 text-xs text-slate-400">
          Deployed on Vercel · {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}

const features = [
  ['Interactive system designer', 'Add components, draw dependencies, mark hard or soft links and set up redundancy groups.'],
  ['Deterministic failure engine', 'No randomness: the same graph and the same failure always give the same result.'],
  ['Explainable propagation', 'Every affected component gets a plain-language reason and a full propagation path.'],
  ['Round-by-round playback', 'Replay a failure step by step and watch the impact spread across the system.'],
  ['Single-point-of-failure ranking', 'Every component is failed on its own and ranked by blast radius.'],
  ['Verified mitigation', 'Add a replica and the engine re-runs the failure to prove whether it actually helped.'],
];

const steps = [
  ['Model', 'Describe your system as components and dependencies.'],
  ['Break', 'Fail any component and watch what else goes down.'],
  ['Fix', 'Add redundancy and verify the improvement.'],
];

export default function Landing({ onLogin, onSignup, onGuest }: { onLogin: () => void; onSignup: () => void; onGuest: () => void }) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-xl font-bold bg-linear-to-r from-yellow-300 to-white bg-clip-text text-transparent">FailFlow</span>
        <div className="flex gap-2 text-sm">
          <button onClick={onLogin} className="px-4 py-2 rounded border border-slate-600 hover:bg-slate-800">Log in</button>
          <button onClick={onSignup} className="px-4 py-2 rounded bg-violet-600 hover:bg-violet-500">Get started</button>
        </div>
      </header>

      <main>
        <section className="max-w-6xl mx-auto px-6 py-12 md:py-20 grid gap-10 md:grid-cols-2 items-center">
          <div className="space-y-6">
            <p className="text-sm font-medium text-yellow-300">FLIPHACK '26 · What if the system breaks?</p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">See exactly how one failure takes down a whole system.</h1>
            <p className="text-lg text-slate-300">
              FailFlow turns a dependency diagram into a working simulator. Break any component, watch the impact spread, understand why,
              then add a backup and let the engine verify it helped.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={onSignup} className="px-5 py-3 rounded bg-violet-600 hover:bg-violet-500 text-base">Create free account</button>
              <button onClick={onGuest} className="px-5 py-3 rounded border border-slate-500 hover:bg-slate-800 text-base">Try it as a guest</button>
            </div>
            <p className="text-xs text-slate-400">No install, no API keys. Everything runs in your browser.</p>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <svg viewBox="0 0 520 250" role="img" aria-label="Example: a payment failure spreads to checkout, order and notification" className="w-full">
              <defs><marker id="ah" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#94a3b8" /></marker></defs>
              {[[110, 50, 190, 50], [270, 50, 350, 50], [430, 50, 430, 100]].map((l, i) => (
                <line key={i} x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} stroke="#ef4444" strokeWidth="3" markerEnd="url(#ah)" />
              ))}
              <line x1="430" y1="150" x2="430" y2="185" stroke="#f59e0b" strokeWidth="3" strokeDasharray="6 4" markerEnd="url(#ah)" />
              {[
                [20, 30, 'Payment', '#7f1d1d', '#ef4444', '✖ FAILED'],
                [190, 30, 'Checkout', '#7f1d1d', '#ef4444', '✖ FAILED'],
                [350, 30, 'Order', '#7f1d1d', '#ef4444', '✖ FAILED'],
                [350, 100, 'Notification', '#78350f', '#f59e0b', '▲ DEGRADED'],
                [20, 150, 'Client', '#14532d', '#22c55e', '● OK'],
                [190, 150, 'Database', '#14532d', '#22c55e', '● OK'],
              ].map(([x, y, n, bg, bd, st]) => (
                <g key={n as string}>
                  <rect x={x as number} y={y as number} width="90" height="40" rx="8" fill={bg as string} stroke={bd as string} strokeWidth="2" />
                  <text x={(x as number) + 45} y={(y as number) + 18} textAnchor="middle" fill="#fff" fontSize="12" fontWeight="600">{n}</text>
                  <text x={(x as number) + 45} y={(y as number) + 33} textAnchor="middle" fill="#fff" fontSize="9">{st}</text>
                </g>
              ))}
            </svg>
            <p className="text-xs text-slate-400 mt-2">Illustration: one failed payment provider cascades through the system.</p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-10 space-y-6">
          <h2 className="text-2xl font-semibold">Everything you need to reason about failure</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map(([t, d]) => (
              <div key={t} className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-1">
                <h3 className="font-semibold text-yellow-300">{t}</h3>
                <p className="text-sm text-slate-300">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-10 space-y-6">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {steps.map(([t, d], i) => (
              <li key={t} className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex gap-3">
                <span className="h-8 w-8 shrink-0 rounded-full bg-yellow-400 text-slate-900 font-bold flex items-center justify-center">{i + 1}</span>
                <div><div className="font-semibold">{t}</div><p className="text-sm text-slate-300">{d}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-12 text-center space-y-4">
          <h2 className="text-2xl font-semibold">Ready to break something safely?</h2>
          <button onClick={onSignup} className="px-6 py-3 rounded bg-violet-600 hover:bg-violet-500 text-base">Get started</button>
        </section>
      </main>

      <footer className="border-t border-slate-700 px-6 py-6 text-center text-xs text-slate-400">
        FailFlow simulates the structural model you define. It does not monitor or test real infrastructure.
      </footer>
    </div>
  );
}

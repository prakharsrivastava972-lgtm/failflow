import { useMemo } from 'react';
import { useStore } from './store/useStore';
import { scenarios } from './data/sample-scenarios';
import { rankSpofs } from './engine/spof-analysis';

export default function Overview({ onRun, onBuild }: { onRun: () => void; onBuild: () => void }) {
  const { system, loadScenario } = useStore();
  const top = useMemo(() => rankSpofs(system)[0], [system]);

  const run = (i: number) => {
    const s = scenarios[i];
    loadScenario(s.system, s.failed);
    onRun();
  };

  return (
    <div className="h-full overflow-y-auto p-6 md:p-10 text-sm">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">What if the system breaks?</h1>
          <p className="text-slate-300 text-base">
            FailFlow turns a dependency diagram into a working failure simulator. Fail any component, watch the impact spread round by round,
            read exactly why each service was affected, then add redundancy and let the engine verify whether it actually helped.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="font-semibold text-base">Try a scenario in one click</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {scenarios.map((s, i) => (
              <div key={s.id} className="bg-slate-800 rounded-lg p-4 space-y-3 flex flex-col">
                <div className="font-medium">{s.name}</div>
                <p className="text-xs text-slate-400 flex-1">{s.description}</p>
                <button onClick={() => run(i)} className="px-3 py-2 rounded bg-violet-600 hover:bg-violet-500 font-medium">Run scenario</button>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">Loading a scenario replaces the current graph. Use Undo in the top bar to get it back.</p>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <div className="bg-slate-800 rounded-lg p-4"><div className="text-2xl font-bold">{system.components.length}</div>components in the current system</div>
          <div className="bg-slate-800 rounded-lg p-4"><div className="text-2xl font-bold">{system.dependencies.length}</div>dependencies (hard, soft and redundant)</div>
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="text-2xl font-bold">{top ? top.name : '-'}</div>
            largest single point of failure{top ? ` (blast radius ${top.blastRadius})` : ''}
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-base">How it works</h2>
          <ol className="list-decimal pl-5 space-y-1 text-slate-300">
            <li>Model: components and dependencies (A → B means B needs A), hard or soft, with optional redundancy groups.</li>
            <li>Simulate: a deterministic engine propagates failures; no randomness, same input gives the same result.</li>
            <li>Explain: every affected component gets a plain-language cause and a propagation path.</li>
            <li>Mitigate: add a replica and the engine re-runs the same failure to verify the improvement.</li>
          </ol>
        </section>

        <div className="flex flex-wrap gap-3 items-center">
          <button onClick={onBuild} className="px-4 py-2 rounded border border-slate-500 hover:bg-slate-800">Open the graph editor</button>
          <span className="text-xs text-slate-500">FailFlow simulates the structural model you define; it does not monitor real infrastructure.</span>
        </div>
      </div>
    </div>
  );
}

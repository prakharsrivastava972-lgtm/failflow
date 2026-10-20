import { useMemo } from 'react';
import { Activity, AlertTriangle, Database, Gauge, History, Network, Play, ShieldCheck } from 'lucide-react';
import { useStore } from './store/useStore';
import { useHistory } from './historyStore';
import { useAuth } from './auth';
import { scenarios } from './data/sample-scenarios';
import { rankSpofs } from './engine/spof-analysis';
import { simulate } from './engine/propagation';
import { metrics } from './engine/metrics';
import Capabilities from './Capabilities';

const ICONS = [AlertTriangle, Database, ShieldCheck];
const card = 'bg-slate-800/80 border border-slate-700 rounded-xl p-4';

function Ring({ failed, degraded, ok }: { failed: number; degraded: number; ok: number }) {
  const total = failed + degraded + ok || 1;
  const C = 2 * Math.PI * 52;
  let offset = 0;
  const seg = (v: number, color: string) => {
    const len = (v / total) * C;
    const el = <circle key={color} r="52" cx="70" cy="70" fill="none" stroke={color} strokeWidth="14"
      strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} transform="rotate(-90 70 70)" />;
    offset += len;
    return el;
  };
  return (
    <svg viewBox="0 0 140 140" role="img" aria-label={`${failed} failed, ${degraded} degraded, ${ok} healthy`} className="w-36 h-36 shrink-0">
      <circle r="52" cx="70" cy="70" fill="none" stroke="#475569" strokeWidth="14" />
      {seg(ok, '#22c55e')}{seg(degraded, '#f59e0b')}{seg(failed, '#ef4444')}
      <text x="70" y="68" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="700">{Math.round((ok / total) * 100)}%</text>
      <text x="70" y="86" textAnchor="middle" fill="#cbd5e1" fontSize="10">healthy</text>
    </svg>
  );
}

export default function Overview({ onRun, onBuild }: { onRun: () => void; onBuild: () => void }) {
  const { system, failed, loadScenario } = useStore();
  const { runs } = useHistory();
  const { user } = useAuth();

  const ranking = useMemo(() => rankSpofs(system), [system]);
  const res = useMemo(() => simulate(system, failed), [system, failed]);
  const m = useMemo(() => metrics(system, res), [system, res]);

  const n = system.components.length;
  const groups = new Set(system.dependencies.filter(d => d.group).map(d => d.group)).size;
  const avgLoss = n > 1 ? ranking.reduce((a, r) => a + r.blastRadius / (n - 1), 0) / n : 0;
  const score = Math.max(0, Math.min(100, Math.round(100 * (1 - avgLoss))));
  const scoreColor = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
  const scoreLabel = score >= 70 ? 'Resilient' : score >= 40 ? 'Moderate risk' : 'High risk';
  const maxBlast = Math.max(1, ...ranking.map(r => r.blastRadius));
  const nameOf = (id: string) => system.components.find(c => c.id === id)?.name ?? id;
  const failedNames = failed.map(nameOf).join(', ');

  const simulateOne = (id: string) => { useStore.setState({ failed: [id], selected: id }); onRun(); };
  const run = (i: number) => { loadScenario(scenarios[i].system, scenarios[i].failed); onRun(); };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 text-sm bg-linear-to-b from-slate-900 to-slate-950">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Hello{user && !user.guest ? `, ${user.name}` : ''} 👋</h1>
            <p className="text-slate-300">Here is how your system holds up when things break.</p>
          </div>
          <button onClick={onBuild} className="px-4 py-2 rounded bg-violet-600 hover:bg-violet-500 flex items-center gap-2">
            <Network size={16} aria-hidden="true" /> Open graph editor
          </button>
        </header>

        <div role="status" className={`rounded-xl border p-4 flex flex-wrap items-center gap-3 ${failed.length ? 'bg-red-950/60 border-red-700' : 'bg-green-950/50 border-green-700'}`}>
          {failed.length
            ? <><AlertTriangle className="text-red-400" aria-hidden="true" />
                <div className="flex-1 min-w-[14rem]"><b>Active failure:</b> {failedNames}. {m.failed} failed, {m.degraded} degraded, {m.impactPct}% of the system impacted.</div>
                <button onClick={onRun} className="px-3 py-1 rounded bg-violet-600 hover:bg-violet-500">Open in simulator</button></>
            : <><ShieldCheck className="text-green-400" aria-hidden="true" />
                <div>All systems healthy. No failure is being simulated right now.</div></>}
        </div>

        <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <div className={card} title="100 minus the average % of the system lost when any single component fails. Computed from real simulation runs.">
            <div className="flex items-center gap-2 text-slate-300"><Gauge size={16} aria-hidden="true" /> Resilience score</div>
            <div className="text-4xl font-bold mt-1" style={{ color: scoreColor }}>{score}<span className="text-lg text-slate-400">/100</span></div>
            <div className="h-2 rounded bg-slate-700 mt-2 overflow-hidden"><div className="h-full rounded" style={{ width: `${score}%`, background: scoreColor }} /></div>
            <div className="text-xs mt-1" style={{ color: scoreColor }}>{scoreLabel}</div>
          </div>
          <div className={card}><div className="flex items-center gap-2 text-slate-300"><Activity size={16} aria-hidden="true" /> Components</div><div className="text-4xl font-bold mt-1">{n}</div><div className="text-xs text-slate-400 mt-2">{system.components.filter(c => c.critical).length} marked critical</div></div>
          <div className={card}><div className="flex items-center gap-2 text-slate-300"><Network size={16} aria-hidden="true" /> Dependencies</div><div className="text-4xl font-bold mt-1">{system.dependencies.length}</div><div className="text-xs text-slate-400 mt-2">{system.dependencies.filter(d => d.kind === 'soft').length} soft</div></div>
          <div className={card}><div className="flex items-center gap-2 text-slate-300"><ShieldCheck size={16} aria-hidden="true" /> Redundancy groups</div><div className="text-4xl font-bold mt-1">{groups}</div><div className="text-xs text-slate-400 mt-2">{groups === 0 ? 'No backups configured yet' : 'interchangeable provider sets'}</div></div>
        </section>

        <section className="grid gap-4 lg:grid-cols-5">
          <div className={`${card} lg:col-span-2 flex items-center gap-4`}>
            <Ring failed={m.failed} degraded={m.degraded} ok={m.unaffected} />
            <div className="space-y-1">
              <h2 className="font-semibold text-base">Current health</h2>
              <div><span className="text-red-400">✖</span> {m.failed} failed</div>
              <div><span className="text-amber-400">▲</span> {m.degraded} degraded</div>
              <div><span className="text-green-400">●</span> {m.unaffected} unaffected</div>
              <div className="text-xs text-slate-400">Max propagation depth: {m.maxDepth}</div>
            </div>
          </div>

          <div className={`${card} lg:col-span-3 space-y-2`}>
            <h2 className="font-semibold text-base">Biggest risks (blast radius)</h2>
            {ranking.slice(0, 5).map((r, i) => (
              <div key={r.id} className="flex items-center gap-3">
                <span className="w-4 text-slate-400">{i + 1}</span>
                <span className="w-40 truncate">{r.name}</span>
                <div className="flex-1 h-3 rounded bg-slate-700 overflow-hidden"><div className="h-full rounded bg-linear-to-r from-yellow-300 to-red-500" style={{ width: `${(r.blastRadius / maxBlast) * 100}%` }} /></div>
                <span className="w-8 text-right tabular-nums">{r.blastRadius}</span>
                <button onClick={() => simulateOne(r.id)} className="px-2 py-1 rounded border border-slate-500 hover:bg-slate-700 flex items-center gap-1" aria-label={`Simulate failure of ${r.name}`}>
                  <Play size={12} aria-hidden="true" /> Fail
                </button>
              </div>
            ))}
            <p className="text-xs text-slate-400">Each component is failed alone and the real engine is re-run. Blast radius = failed + 0.5 × degraded.</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold text-base">Run a scenario</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {scenarios.map((s, i) => {
              const Icon = ICONS[i] ?? Play;
              return (
                <div key={s.id} className={`${card} flex flex-col gap-3 hover:border-yellow-400 transition-colors`}>
                  <div className="flex items-center gap-2 font-medium"><Icon className="text-yellow-300" size={18} aria-hidden="true" /> {s.name}</div>
                  <p className="text-xs text-slate-300 flex-1">{s.description}</p>
                  <button onClick={() => run(i)} className="px-3 py-2 rounded bg-violet-600 hover:bg-violet-500 flex items-center justify-center gap-2"><Play size={14} aria-hidden="true" /> Run scenario</button>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-500">Loading a scenario replaces the current graph. Undo in the top bar brings it back.</p>
        </section>

        <Capabilities system={system} result={res} />

        <section className={`${card} space-y-2`}>
          <h2 className="font-semibold text-base flex items-center gap-2"><History size={16} aria-hidden="true" /> Recent saved runs</h2>
          {runs.length === 0 ? <p className="text-slate-400">No saved runs yet. Fail a component and save it in Scenario History.</p> : runs.slice(0, 3).map(r => (
            <div key={r.id} className="flex flex-wrap justify-between gap-2 border-b border-slate-700 pb-1 last:border-0">
              <span className="font-medium">{r.name}</span>
              <span className="text-slate-300">✖ {r.summary.failed} · ▲ {r.summary.degraded} · ● {r.summary.unaffected} · {r.summary.impactPct}% impacted</span>
            </div>
          ))}
        </section>

        <p className="text-xs text-slate-500 pb-4">FailFlow simulates the structural model you define; it does not monitor real infrastructure.</p>
      </div>
    </div>
  );
}


import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useStore } from './store/useStore';
import { rankSpofs } from './engine/spof-analysis';
import { simulate } from './engine/propagation';
import type { System } from './types/system';

/** Graph-theoretic articulation points (undirected): removing the node increases the number of connected components.
 *  Brute force is fine for MVP-sized graphs. Distinct from simulated blast radius. */
function articulationPoints(system: System): Set<string> {
  const ids = system.components.map(c => c.id);
  const adj = new Map(ids.map(i => [i, new Set<string>()]));
  for (const d of system.dependencies) { adj.get(d.provider)?.add(d.dependent); adj.get(d.dependent)?.add(d.provider); }
  const countComponents = (skip?: string) => {
    const seen = new Set<string>(); let n = 0;
    for (const s of ids) {
      if (s === skip || seen.has(s)) continue;
      n++; seen.add(s); const stack = [s];
      while (stack.length) { const u = stack.pop()!; for (const v of adj.get(u)!) if (v !== skip && !seen.has(v)) { seen.add(v); stack.push(v); } }
    }
    return n;
  };
  const base = countComponents();
  return new Set(ids.filter(i => countComponents(i) > base));
}

export default function SpofPanel({ onOpen }: { onOpen: () => void }) {
  const { system, reset, toggleFail, select } = useStore();
  const rows = useMemo(() => {
    const art = articulationPoints(system);
    return rankSpofs(system).map((r, i) => {
      const res = simulate(system, [r.id]);
      const critical = system.components.filter(c => c.critical && c.id !== r.id && res[c.id].health !== 'healthy').map(c => c.name);
      const hasSoleDependents = system.dependencies.some(d => d.provider === r.id && d.kind === 'hard' && !d.group);
      return {
        ...r, rank: i + 1, articulation: art.has(r.id), critical,
        why: r.blastRadius === 0 ? 'No downstream impact.'
          : `Failing it breaks ${r.failed} and degrades ${r.degraded} other component(s)${critical.length ? `; critical affected: ${critical.join(', ')}` : ''}.`,
        advice: r.blastRadius > 0 && hasSoleDependents ? 'Add a redundant provider (shared backup group).' : r.blastRadius > 0 ? 'Review soft/hard dependency choices.' : 'None needed.',
      };
    });
  }, [system]);

  const show = (id: string) => { reset(); toggleFail(id); select(id); onOpen(); };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 text-sm">
      <div>
        <h1 className="text-xl font-semibold">Critical Components</h1>
        <p className="text-slate-400">Each component is failed alone and the real engine is re-run. Blast radius = failed + 0.5 × degraded (excluding the component itself).
          A high blast radius is not the same as being a graph articulation point; both are shown separately.</p>
      </div>
      <div className="h-80 bg-slate-800 rounded p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ left: 20, right: 20 }}>
            <XAxis type="number" allowDecimals={false} stroke="#94a3b8" />
            <YAxis type="category" dataKey="name" width={170} stroke="#94a3b8" />
            <Tooltip /><Legend />
            <Bar dataKey="failed" stackId="a" fill="#ef4444" name="Failed" />
            <Bar dataKey="degraded" stackId="a" fill="#f59e0b" name="Degraded" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-slate-400 border-b border-slate-700">
            <tr><th className="p-2">#</th><th>Component</th><th>Failed</th><th>Degraded</th><th>Blast radius</th><th>Articulation point</th><th>Why critical</th><th>Recommendation</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b border-slate-800 align-top">
                <td className="p-2">{r.rank}</td><td className="font-medium">{r.name}</td>
                <td>{r.failed}</td><td>{r.degraded}</td><td>{r.blastRadius}</td>
                <td>{r.articulation ? 'Yes' : 'No'}</td><td className="max-w-xs">{r.why}</td><td className="max-w-xs">{r.advice}</td>
                <td><button onClick={() => show(r.id)} className="px-2 py-1 rounded bg-violet-600 hover:bg-violet-500">Show in graph</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

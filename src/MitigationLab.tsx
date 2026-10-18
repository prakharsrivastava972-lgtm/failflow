import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useStore } from './store/useStore';
import { hasBackup, withBackup, withoutBackup } from './mitigationOps';
import { compare } from './engine/mitigation';
import { makeRun, diffRuns } from './engine/reports';
import { scenarios } from './data/sample-scenarios';

export default function MitigationLab({ onOpen }: { onOpen: () => void }) {
  const { system, failed, loadScenario } = useStore();
  const backup = hasBackup(system);
  const hasPayment = system.components.some(c => c.id === 'payment');
  const failedNames = failed.map(id => system.components.find(c => c.id === id)?.name ?? id).join(', ');

  const view = useMemo(() => {
    if (!failed.length || (!backup && !hasPayment)) return null;
    const before = backup ? withoutBackup(system) : system;
    const after = backup ? system : withBackup(system);
    const cmp = compare(before, after, failed);
    const diff = diffRuns(makeRun('before', before, failed), makeRun('after', after, failed));
    const rows = [
      { metric: 'Failed', Before: cmp.before.failed, After: cmp.after.failed },
      { metric: 'Degraded', Before: cmp.before.degraded, After: cmp.after.degraded },
      { metric: 'Unaffected', Before: cmp.before.unaffected, After: cmp.after.unaffected },
    ];
    return { cmp, diff, rows };
  }, [system, failed, backup, hasPayment]);

  const load = (i: number) => {
    const s = scenarios[i];
    if (window.confirm(`Load preset "${s.name}"? This replaces your current graph. Export it first if you want to keep it.`)) {
      loadScenario(s.system, s.failed);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 text-sm">
      <div>
        <h1 className="text-xl font-semibold">Mitigation Lab</h1>
        <p className="text-slate-400">Re-runs the same failure on the system without and with a backup payment gateway, using the real engine.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {scenarios.map((s, i) => (
          <div key={s.id} className="bg-slate-800 rounded p-3 space-y-2">
            <div className="font-medium">{s.name}</div>
            <p className="text-xs text-slate-400">{s.description}</p>
            <button onClick={() => load(i)} className="px-2 py-1 rounded bg-violet-600 hover:bg-violet-500">Load preset</button>
          </div>
        ))}
      </div>

      {!view ? (
        <p className="text-slate-400">
          {!failed.length ? 'Load a preset or fail a component in the simulator to compare.' : 'This graph has no Payment Gateway (id "payment") to add a backup for.'}
        </p>
      ) : (
        <div className="space-y-4">
          <div className="text-slate-300">
            Failure: <b>{failedNames}</b> · Before: <b>{backup ? 'no backup' : 'current system'}</b> · After: <b>{backup ? 'current system (with backup)' : 'with backup payment gateway'}</b>
          </div>
          <div className={`rounded p-3 border ${view.cmp.improved ? 'bg-green-950 border-green-600' : 'bg-slate-800 border-slate-600'}`}>
            {view.cmp.improved
              ? `Verified improvement: ${view.cmp.impactReduction} fewer component(s) affected (${view.cmp.before.failed + view.cmp.before.degraded} → ${view.cmp.after.failed + view.cmp.after.degraded}).`
              : 'No improvement for this failure: the backup payment gateway does not change the outcome here.'}
          </div>
          <div className="h-64 bg-slate-800 rounded p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={view.rows}>
                <XAxis dataKey="metric" stroke="#94a3b8" /><YAxis allowDecimals={false} stroke="#94a3b8" />
                <Tooltip /><Legend />
                <Bar dataKey="Before" fill="#64748b" /><Bar dataKey="After" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-slate-800 rounded p-3">
            <h2 className="font-semibold mb-1">Components whose health changed</h2>
            {view.diff.length === 0 ? <p className="text-slate-400">None.</p> : (
              <ul className="space-y-1">{view.diff.map(d => <li key={d.name}>{d.name}: <b>{d.a}</b> → <b>{d.b}</b></li>)}</ul>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Recovery assumptions: the backup is an identical, independent provider with the same dependents, and failover is instant. Real failover delays, capacity limits and shared hidden dependencies are not modelled.
          </p>
          <button onClick={onOpen} className="px-3 py-1 rounded border border-slate-600">Open in graph</button>
        </div>
      )}
    </div>
  );
}

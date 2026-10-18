import { useState } from 'react';
import { useStore } from './store/useStore';
import { useHistory } from './historyStore';
import { makeRun, toCsv, diffRuns } from './engine/reports';

function download(filename: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function HistoryPanel({ onOpen }: { onOpen: () => void }) {
  const { system, failed, loadScenario } = useStore();
  const { runs, add, remove, duplicate } = useHistory();
  const [name, setName] = useState('');
  const [pick, setPick] = useState<string[]>([]);
  const togglePick = (id: string) => setPick(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id].slice(-2)));
  const a = runs.find(r => r.id === pick[0]);
  const b = runs.find(r => r.id === pick[1]);
  const input = 'bg-slate-800 border border-slate-600 rounded px-2 py-1';
  const failedNames = failed.map(id => system.components.find(c => c.id === id)?.name ?? id).join(', ');

  const save = () => {
    add(makeRun(name.trim() || `Scenario ${runs.length + 1}`, system, failed));
    setName('');
  };
  const report = (kind: 'json' | 'csv') => {
    const stamp = new Date().toISOString().slice(0, 10);
    if (kind === 'csv') return download(`failflow-report-${stamp}.csv`, toCsv(runs), 'text/csv');
    download(`failflow-report-${stamp}.json`, JSON.stringify({
      format: 'failflow-report', version: 1, generated: new Date().toISOString(),
      note: 'Results reflect the structural model and failure assumptions defined by the user, not real infrastructure.', runs,
    }, null, 2), 'application/json');
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 text-sm">
      <div>
        <h1 className="text-xl font-semibold">Scenario History</h1>
        <p className="text-slate-400">Each saved run stores the graph snapshot, the failed components and the engine's results. Reopening restores both.</p>
      </div>

      <div className="flex flex-wrap gap-2 items-center bg-slate-800 rounded p-3">
        <input aria-label="Scenario name" className={`${input} w-64`} placeholder="Scenario name" value={name} onChange={e => setName(e.target.value)} />
        <button disabled={failed.length === 0} onClick={save} className="px-3 py-1 rounded bg-violet-600 hover:bg-violet-500 disabled:opacity-40">Save current scenario</button>
        <span className="text-slate-400">{failed.length ? `Failed now: ${failedNames}` : 'Fail a component in the simulator first.'}</span>
      </div>

      <div className="flex gap-2">
        <button disabled={!runs.length} onClick={() => report('json')} className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40">Download report (JSON)</button>
        <button disabled={!runs.length} onClick={() => report('csv')} className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40">Download report (CSV)</button>
        <span className="text-slate-500 self-center">Tick two runs to compare them.</span>
      </div>

      {runs.length === 0 && <p className="text-slate-400">No saved scenarios yet.</p>}
      <div className="space-y-2">
        {runs.map(r => (
          <div key={r.id} className="bg-slate-800 rounded p-3 flex flex-wrap gap-3 items-center">
            <input type="checkbox" aria-label={`Compare ${r.name}`} checked={pick.includes(r.id)} onChange={() => togglePick(r.id)} />
            <div className="flex-1 min-w-[16rem]">
              <div className="font-medium">{r.name}</div>
              <div className="text-xs text-slate-400">
                {new Date(r.timestamp).toLocaleString()} · failed: {r.failed.map(id => r.results[id]?.name ?? id).join(', ')} · graph: {r.system.components.length} components
              </div>
              <div className="text-xs">✖ {r.summary.failed} failed · ▲ {r.summary.degraded} degraded · ● {r.summary.unaffected} unaffected · {r.summary.impactPct}% impacted</div>
            </div>
            <button className="px-2 py-1 rounded bg-violet-600 hover:bg-violet-500" onClick={() => { loadScenario(r.system, r.failed); onOpen(); }}>Reopen</button>
            <button className="px-2 py-1 rounded border border-slate-600" onClick={() => duplicate(r.id)}>Duplicate</button>
            <button className="px-2 py-1 rounded border border-red-500 text-red-300" onClick={() => { if (window.confirm(`Delete "${r.name}"?`)) { remove(r.id); setPick(p => p.filter(x => x !== r.id)); } }}>Delete</button>
          </div>
        ))}
      </div>

      {a && b && (
        <div className="bg-slate-800 rounded p-3 space-y-2">
          <h2 className="font-semibold">Comparison</h2>
          <table className="w-full text-left">
            <thead className="text-slate-400 border-b border-slate-700"><tr><th className="p-1"></th><th>{a.name}</th><th>{b.name}</th></tr></thead>
            <tbody>
              {(['failed', 'degraded', 'unaffected', 'impactPct'] as const).map(k => (
                <tr key={k} className="border-b border-slate-700"><td className="p-1 text-slate-400">{k === 'impactPct' ? 'impact %' : k}</td><td>{a.summary[k]}</td><td>{b.summary[k]}</td></tr>
              ))}
            </tbody>
          </table>
          <h3 className="font-medium pt-2">Components whose health differs</h3>
          {diffRuns(a, b).length === 0 ? <p className="text-slate-400">No differences in component health.</p> : (
            <ul className="space-y-1">{diffRuns(a, b).map(d => <li key={d.name}>{d.name}: <b>{d.a}</b> → <b>{d.b}</b></li>)}</ul>
          )}
          <p className="text-xs text-slate-500">Runs may use different graph snapshots; "absent" means the component did not exist in that run.</p>
        </div>
      )}
    </div>
  );
}

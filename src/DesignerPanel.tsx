import { useState } from 'react';
import { useStore } from './store/useStore';

const TYPES = ['Client', 'API Gateway', 'Authentication Service', 'Payment Service', 'Checkout Service', 'Order Service', 'Notification Service', 'Cache', 'Database', 'Monitoring Service', 'Service'];

export default function DesignerPanel() {
  const s = useStore();
  const { system, selected } = s;
  const [name, setName] = useState('');
  const [type, setType] = useState('Service');
  const [prov, setProv] = useState('');
  const comp = system.components.find(c => c.id === selected);
  const incoming = system.dependencies.filter(d => d.dependent === selected);
  const candidates = system.components.filter(c => c.id !== selected && !incoming.some(d => d.provider === c.id));
  const nameOf = (id: string) => system.components.find(c => c.id === id)?.name ?? id;
  const input = 'bg-slate-800 border border-slate-600 rounded px-2 py-1';

  return (
    <section className="space-y-3 border-t border-slate-700 pt-3">
      <h2 className="font-semibold">System designer</h2>
      <div className="flex gap-2">
        <input aria-label="New component name" className={`${input} flex-1 min-w-0`} placeholder="New component name"
          value={name} onChange={e => setName(e.target.value)} />
        <select aria-label="Component type" className={input} value={type} onChange={e => setType(e.target.value)}>
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <button className="px-2 rounded bg-violet-600 hover:bg-violet-500 disabled:opacity-40" disabled={!name.trim()}
          onClick={() => { s.addComponent(name.trim(), type); setName(''); }}>Add</button>
      </div>

      {comp ? (
        <div className="space-y-2 bg-slate-800/60 rounded p-2">
          <input aria-label="Component name" className={`${input} w-full`} value={comp.name} onChange={e => s.renameComponent(comp.id, e.target.value)} />
          <label className="flex items-center gap-2"><input type="checkbox" checked={!!comp.critical} onChange={() => s.toggleCritical(comp.id)} /> Mark as critical ★</label>

          <div className="text-xs text-slate-400">{comp.name} depends on (provider → {comp.name}):</div>
          {incoming.length === 0 && <div className="text-xs text-slate-500">No dependencies.</div>}
          {incoming.map(d => (
            <div key={d.provider} className="flex gap-1 items-center">
              <span className="flex-1 min-w-0 truncate">{nameOf(d.provider)}</span>
              <select aria-label="Dependency type" className={input} value={d.kind} onChange={e => s.setDepKind(d.provider, d.dependent, e.target.value as 'hard' | 'soft')}>
                <option value="hard">hard</option><option value="soft">soft</option>
              </select>
              <input aria-label="Backup group" className={`${input} w-24`} placeholder="group" value={d.group ?? ''} onChange={e => s.setDepGroup(d.provider, d.dependent, e.target.value)} />
              <button aria-label="Remove dependency" className="px-2 rounded border border-slate-600" onClick={() => s.removeDependency(d.provider, d.dependent)}>✕</button>
            </div>
          ))}
          <p className="text-xs text-slate-500">Providers with the same group name are interchangeable (any one healthy is enough).</p>

          {candidates.length > 0 && (
            <div className="flex gap-2">
              <select aria-label="Add provider" className={`${input} flex-1 min-w-0`} value={prov} onChange={e => setProv(e.target.value)}>
                <option value="">Add provider…</option>
                {candidates.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button className="px-2 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40" disabled={!prov}
                onClick={() => { s.addDependency(prov, comp.id); setProv(''); }}>Add</button>
            </div>
          )}
          <button className="px-2 py-1 rounded border border-red-500 text-red-300 hover:bg-red-950"
            onClick={() => { if (window.confirm(`Delete "${comp.name}" and its dependencies?`)) s.deleteComponent(comp.id); }}>Delete component</button>
        </div>
      ) : (
        <p className="text-xs text-slate-400">Select a component to edit it. You can also drag from one node's right handle to another node's left handle to add a dependency.</p>
      )}

      <button className="px-2 py-1 rounded border border-slate-600 text-xs"
        onClick={() => { if (window.confirm('Reset the whole system to the sample e-commerce graph? Your edits will be lost.')) s.resetSystem(); }}>Reset to sample system</button>
    </section>
  );
}

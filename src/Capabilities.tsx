import { useState } from 'react';
import { Target } from 'lucide-react';
import type { SimResult, System } from './types/system';
import { capabilityStatus } from './engine/capabilities';
import { useCapabilities } from './capabilitiesStore';

const LABEL = { healthy: ['✔ Available', 'text-green-400'], degraded: ['▲ Degraded', 'text-amber-400'], failed: ['✖ Down', 'text-red-400'] } as const;

export default function Capabilities({ system, result }: { system: System; result: SimResult }) {
  const { capabilities, add, remove, resetDefaults } = useCapabilities();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const nameOf = (id: string) => system.components.find(c => c.id === id)?.name ?? id;
  const ids = new Set(system.components.map(c => c.id));
  const visible = capabilities.filter(c => c.requires.some(r => ids.has(r)));
  const choices = system.components.filter(c => !c.id.endsWith('-replica'));
  const input = 'bg-slate-900 border border-slate-600 rounded px-2 py-1';

  const down = visible.filter(c => capabilityStatus(c, result).health === 'failed').length;

  return (
    <section className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-base flex items-center gap-2"><Target size={16} aria-hidden="true" /> Business capabilities</h2>
        <span className="text-xs text-slate-400">{down === 0 ? 'All available' : `${down} down`}</span>
      </div>
      <p className="text-xs text-slate-400">What users can actually do right now. A capability needs all of its components (or their replicas).</p>

      {visible.length === 0 && <p className="text-slate-400">No capabilities defined for this system yet.</p>}
      {visible.map(c => {
        const st = capabilityStatus(c, result);
        const [text, color] = LABEL[st.health];
        return (
          <div key={c.id} className="border-b border-slate-700 pb-2 last:border-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{c.name}</span>
              <span className={`font-semibold whitespace-nowrap ${color}`}>{text}</span>
            </div>
            {st.blockers.length > 0 && <div className="text-xs text-slate-400">Blocked by: {st.blockers.map(nameOf).join(', ')}</div>}
            <button className="text-xs text-slate-500 hover:text-red-300 underline" onClick={() => { if (window.confirm(`Remove "${c.name}"?`)) remove(c.id); }}>Remove</button>
          </div>
        );
      })}

      <button className="text-xs underline text-yellow-300" onClick={() => setOpen(!open)}>{open ? 'Close editor' : '+ Add a capability'}</button>
      {open && (
        <div className="space-y-2 bg-slate-900/60 rounded p-2">
          <input aria-label="Capability name" className={`${input} w-full`} placeholder='e.g. "Customers can pay"' value={name} onChange={e => setName(e.target.value)} />
          <div className="text-xs text-slate-400">Requires these components:</div>
          <div className="grid grid-cols-2 gap-1 max-h-36 overflow-y-auto">
            {choices.map(c => (
              <label key={c.id} className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={picked.includes(c.id)} onChange={() => setPicked(p => (p.includes(c.id) ? p.filter(x => x !== c.id) : [...p, c.id]))} /> {c.name}
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button disabled={!name.trim() || picked.length === 0} className="px-3 py-1 rounded bg-violet-600 hover:bg-violet-500 disabled:opacity-40"
              onClick={() => { add(name.trim(), picked); setName(''); setPicked([]); setOpen(false); }}>Add</button>
            <button className="px-3 py-1 rounded border border-slate-600" onClick={() => { if (window.confirm('Restore the default capabilities?')) resetDefaults(); }}>Restore defaults</button>
          </div>
        </div>
      )}
    </section>
  );
}

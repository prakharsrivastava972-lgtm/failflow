import { useRef, useState } from 'react';
import { useStore } from './store/useStore';
import { validateSystem } from './engine/graph-validation';

export default function ProjectBar() {
  const { system, replaceSystem } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; lines: string[] } | null>(null);
  const warnings = validateSystem(system).warnings;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ format: 'failflow', version: 1, system }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'failflow-system.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 2_000_000) return setMsg({ ok: false, lines: ['File is too large (2 MB max).'] });
    let parsed: unknown;
    try { parsed = JSON.parse(await file.text()); } catch { return setMsg({ ok: false, lines: ['File is not valid JSON.'] }); }
    const v = validateSystem((parsed as { system?: unknown } | null)?.system ?? parsed);
    if (!v.ok || !v.system) return setMsg({ ok: false, lines: ['Import rejected:', ...v.errors.slice(0, 6), ...(v.errors.length > 6 ? [`…and ${v.errors.length - 6} more.`] : [])] });
    if (window.confirm(`Import "${file.name}" (${v.system.components.length} components)? This replaces your current system. Export first if you want to keep it.`)) {
      replaceSystem(v.system);
      setMsg({ ok: true, lines: [`Imported ${v.system.components.length} components.`, ...v.warnings] });
    }
  };

  return (
    <div className="ml-auto flex items-center gap-2">
      {warnings.length > 0 && <span title={warnings.join(' ')} className="text-amber-400">▲ Cycle warning</span>}
      <span className="text-xs text-slate-400">Saved in this browser</span>
      <button onClick={exportJson} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700">Export JSON</button>
      <button onClick={() => fileRef.current?.click()} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700">Import JSON</button>
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} aria-label="Import system JSON" />
      {msg && (
        <div role="alert" className={`absolute right-3 top-12 z-50 max-w-sm rounded border p-3 text-xs ${msg.ok ? 'bg-green-950 border-green-600' : 'bg-red-950 border-red-600'}`}>
          {msg.lines.map((l, i) => <div key={i}>{l}</div>)}
          <button onClick={() => setMsg(null)} className="mt-2 underline">Dismiss</button>
        </div>
      )}
    </div>
  );
}

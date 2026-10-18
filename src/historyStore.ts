import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { newId, type Run } from './engine/reports';
import { validateSystem } from './engine/graph-validation';

interface H {
  runs: Run[];
  add: (r: Run) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
}

export const useHistory = create<H>()(persist(set => ({
  runs: [],
  add: r => set(s => ({ runs: [r, ...s.runs].slice(0, 50) })),
  remove: id => set(s => ({ runs: s.runs.filter(r => r.id !== id) })),
  duplicate: id => set(s => {
    const r = s.runs.find(x => x.id === id);
    if (!r) return s;
    return { runs: [{ ...structuredClone(r), id: newId(), name: `${r.name} (copy)`, timestamp: new Date().toISOString() }, ...s.runs].slice(0, 50) };
  }),
}), {
  name: 'failflow:history:v1',
  partialize: s => ({ runs: s.runs }),
  // Stored data is untrusted: drop any run that does not validate.
  merge: (persisted, current) => {
    const raw = (persisted as { runs?: unknown } | undefined)?.runs;
    if (!Array.isArray(raw)) return current;
    const runs = raw.filter(r => {
      const o = r as Partial<Run> | null;
      return !!o && typeof o.id === 'string' && typeof o.name === 'string' && Array.isArray(o.failed) && !!o.results && !!o.summary && validateSystem(o.system).ok;
    }) as Run[];
    return { ...current, runs };
  },
}));

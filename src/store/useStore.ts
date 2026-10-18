import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { System, DepKind } from '../types/system';
import { sampleSystem } from '../data/sample-system';
import { hasBackup, withBackup, withoutBackup } from '../mitigationOps';
import { validateSystem } from '../engine/graph-validation';

interface State {
  system: System;
  failed: string[];
  selected: string | null;
  backup: boolean;
  select: (id: string | null) => void;
  toggleFail: (id: string) => void;
  reset: () => void;
  toggleBackup: () => void;
  addComponent: (name: string, type: string) => void;
  deleteComponent: (id: string) => void;
  renameComponent: (id: string, name: string) => void;
  toggleCritical: (id: string) => void;
  addDependency: (provider: string, dependent: string, kind?: DepKind) => void;
  removeDependency: (provider: string, dependent: string) => void;
  setDepKind: (provider: string, dependent: string, kind: DepKind) => void;
  setDepGroup: (provider: string, dependent: string, group: string) => void;
  resetSystem: () => void;
  replaceSystem: (system: System) => void;
  loadScenario: (system: System, failed: string[]) => void;
}

const next = (system: System) => ({ system, backup: hasBackup(system) });
const same = (d: { provider: string; dependent: string }, p: string, t: string) => d.provider === p && d.dependent === t;

export const useStore = create<State>()(persist((set, get) => ({
  system: sampleSystem, failed: [], selected: null, backup: false,
  select: id => set({ selected: id }),
  toggleFail: id => set(s => ({ failed: s.failed.includes(id) ? s.failed.filter(f => f !== id) : [...s.failed, id] })),
  reset: () => set({ failed: [], selected: null }),
  toggleBackup: () => {
    const { system } = get();
    set({ ...next(hasBackup(system) ? withoutBackup(system) : withBackup(system)) });
    set(s => ({ failed: s.failed.filter(f => s.system.components.some(c => c.id === f)) }));
  },
  addComponent: (name, type) => set(s => {
    const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
    return { ...next({ ...s.system, components: [...s.system.components, { id, name, type }] }), selected: id };
  }),
  deleteComponent: id => set(s => ({
    ...next({
      components: s.system.components.filter(c => c.id !== id),
      dependencies: s.system.dependencies.filter(d => d.provider !== id && d.dependent !== id),
    }),
    failed: s.failed.filter(f => f !== id), selected: null,
  })),
  renameComponent: (id, name) => set(s => next({ ...s.system, components: s.system.components.map(c => (c.id === id ? { ...c, name } : c)) })),
  toggleCritical: id => set(s => next({ ...s.system, components: s.system.components.map(c => (c.id === id ? { ...c, critical: !c.critical } : c)) })),
  addDependency: (provider, dependent, kind = 'hard') => set(s => {
    const ids = s.system.components.map(c => c.id);
    if (provider === dependent || !ids.includes(provider) || !ids.includes(dependent)) return s;
    if (s.system.dependencies.some(d => same(d, provider, dependent))) return s;
    return next({ ...s.system, dependencies: [...s.system.dependencies, { provider, dependent, kind }] });
  }),
  removeDependency: (p, t) => set(s => next({ ...s.system, dependencies: s.system.dependencies.filter(d => !same(d, p, t)) })),
  setDepKind: (p, t, kind) => set(s => next({ ...s.system, dependencies: s.system.dependencies.map(d => (same(d, p, t) ? { ...d, kind } : d)) })),
  setDepGroup: (p, t, group) => set(s => next({ ...s.system, dependencies: s.system.dependencies.map(d => (same(d, p, t) ? { ...d, group: group.trim() || undefined } : d)) })),
  resetSystem: () => set({ system: sampleSystem, backup: false, failed: [], selected: null }),
  replaceSystem: system => set({ ...next(system), failed: [], selected: null }),
  loadScenario: (system, failed) => set({ ...next(system), failed: failed.filter(f => system.components.some(c => c.id === f)), selected: null }),
}), {
  name: 'failflow:v1',
  partialize: s => ({ system: s.system }),
  // Stored data is untrusted: re-validate on load, fall back to the sample system if it is corrupt.
  merge: (persisted, current) => {
    const v = validateSystem((persisted as { system?: unknown } | undefined)?.system);
    return v.ok && v.system ? { ...current, system: v.system, backup: hasBackup(v.system) } : current;
  },
}));


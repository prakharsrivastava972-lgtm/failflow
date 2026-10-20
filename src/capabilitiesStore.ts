import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Capability } from './engine/capabilities';
import { DEFAULT_CAPABILITIES } from './data/sample-capabilities';

interface S {
  capabilities: Capability[];
  add: (name: string, requires: string[]) => void;
  remove: (id: string) => void;
  resetDefaults: () => void;
}

export const useCapabilities = create<S>()(persist(set => ({
  capabilities: DEFAULT_CAPABILITIES,
  add: (name, requires) => set(s => ({ capabilities: [...s.capabilities, { id: `cap-${Date.now().toString(36)}`, name: name.slice(0, 60), requires }].slice(0, 30) })),
  remove: id => set(s => ({ capabilities: s.capabilities.filter(c => c.id !== id) })),
  resetDefaults: () => set({ capabilities: DEFAULT_CAPABILITIES }),
}), {
  name: 'failflow:capabilities:v1',
  partialize: s => ({ capabilities: s.capabilities }),
  // Stored data is untrusted: keep only well-formed entries.
  merge: (persisted, current) => {
    const raw = (persisted as { capabilities?: unknown } | undefined)?.capabilities;
    if (!Array.isArray(raw)) return current;
    const ok = raw.filter((c): c is Capability => !!c && typeof c.id === 'string' && typeof c.name === 'string'
      && Array.isArray(c.requires) && c.requires.every((r: unknown) => typeof r === 'string'));
    return { ...current, capabilities: ok };
  },
}));

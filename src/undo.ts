import { create } from 'zustand';
import { useStore } from './store/useStore';
import { hasBackup } from './mitigationOps';
import type { System } from './types/system';

interface U { past: System[]; future: System[]; undo: () => void; redo: () => void }

let applying = false;
const apply = (system: System) => {
  applying = true;
  useStore.setState(s => ({ system, backup: hasBackup(system), failed: s.failed.filter(f => system.components.some(c => c.id === f)), selected: null }));
  applying = false;
};

export const useUndo = create<U>((set, get) => ({
  past: [], future: [],
  undo: () => {
    const { past, future } = get();
    if (!past.length) return;
    const cur = useStore.getState().system;
    apply(past[past.length - 1]);
    set({ past: past.slice(0, -1), future: [cur, ...future] });
  },
  redo: () => {
    const { past, future } = get();
    if (!future.length) return;
    const cur = useStore.getState().system;
    apply(future[0]);
    set({ past: [...past, cur], future: future.slice(1) });
  },
}));

// Record every change to the system graph (except undo/redo themselves).
let last = useStore.getState().system;
useStore.subscribe(s => {
  if (s.system === last) return;
  if (!applying) useUndo.setState(u => ({ past: [...u.past, last].slice(-50), future: [] }));
  last = s.system;
});

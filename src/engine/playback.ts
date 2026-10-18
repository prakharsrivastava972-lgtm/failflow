import type { SimResult } from '../types/system';

/** Highest round at which anything changed (1 = injected failures). */
export const maxStep = (r: SimResult) => Math.max(0, ...Object.values(r).map(x => x.step));

/** The system as it looks after `step` rounds: later impacts are not yet visible. */
export function resultAtStep(r: SimResult, step: number): SimResult {
  const out: SimResult = {};
  for (const [id, v] of Object.entries(r))
    out[id] = v.step <= step ? v : { health: 'healthy', step: 0, direct: false, path: [], reason: 'Not affected yet at this round.' };
  return out;
}

/** Component ids whose state changed exactly in round `step`. */
export const eventsAtStep = (r: SimResult, step: number) =>
  Object.entries(r).filter(([, v]) => v.step === step && v.health !== 'healthy').map(([id]) => id).sort();

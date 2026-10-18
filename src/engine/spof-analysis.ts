import type { System } from '../types/system';
import { simulate } from './propagation';
/** Blast radius from actual simulation (failed + 0.5*degraded, excluding the injected node).
 *  NOTE: a large blast radius is NOT the same as a graph-theoretic articulation point. */
export function rankSpofs(system: System) {
  return system.components.map(c => {
    const r = simulate(system, [c.id]);
    const others = Object.entries(r).filter(([id]) => id !== c.id);
    const failed = others.filter(([, v]) => v.health === 'failed').length;
    const degraded = others.filter(([, v]) => v.health === 'degraded').length;
    return { id: c.id, name: c.name, failed, degraded, blastRadius: failed + 0.5 * degraded };
  }).sort((a, b) => b.blastRadius - a.blastRadius || a.id.localeCompare(b.id));
}

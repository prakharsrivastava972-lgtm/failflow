import type { Health, SimResult } from '../types/system';

export interface Capability { id: string; name: string; requires: string[] }
const sev: Record<Health, number> = { healthy: 0, degraded: 1, failed: 2 };

/** A required component counts as available if it OR its replica is (the healthier one wins). null = not in this graph. */
export function effectiveHealth(result: SimResult, id: string): Health | null {
  if (!(id in result)) return null;
  return [id, `${id}-replica`].filter(x => x in result).map(x => result[x].health)
    .reduce((best, h) => (sev[h] < sev[best] ? h : best));
}

/** Down if any required component is lost, degraded if any is degraded, otherwise available. */
export function capabilityStatus(cap: Capability, result: SimResult): { health: Health; blockers: string[] } {
  let health: Health = 'healthy';
  const blockers: string[] = [];
  for (const id of cap.requires) {
    const h = effectiveHealth(result, id);
    if (!h) continue; // component no longer exists in this graph
    if (h !== 'healthy') blockers.push(id);
    if (sev[h] > sev[health]) health = h;
  }
  return { health, blockers };
}

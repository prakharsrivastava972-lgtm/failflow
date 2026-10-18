import type { Health, System, SimResult, Impact, Dependency } from '../types/system';

const sev: Record<Health, number> = { healthy: 0, degraded: 1, failed: 2 };
const byId = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Units of a dependent: ungrouped edge = own unit; shared `group` = interchangeable providers. */
function unitsFor(deps: Dependency[]): Dependency[][] {
  const groups = new Map<string, Dependency[]>();
  const units: Dependency[][] = [];
  for (const d of deps) {
    if (!d.group) { units.push([d]); continue; }
    const k = `${d.kind}:${d.group}`;
    if (!groups.has(k)) { groups.set(k, []); units.push(groups.get(k)!); }
    groups.get(k)!.push(d);
  }
  return units;
}

/**
 * Monotone fixed-point propagation. Health only worsens, so it terminates even on cycles
 * (<= 2n rounds). Each round reads the previous round's snapshot => deterministic.
 */
export function simulate(system: System, failedIds: string[]): SimResult {
  const names = new Map(system.components.map(c => [c.id, c.name]));
  const incoming = new Map<string, Dependency[]>();
  for (const c of system.components) incoming.set(c.id, []);
  for (const d of system.dependencies) incoming.get(d.dependent)?.push(d);
  const injected = new Set(failedIds.filter(id => names.has(id)));
  const ids = system.components.map(c => c.id).sort(byId);

  let state: SimResult = {};
  for (const id of ids) {
    state[id] = injected.has(id)
      ? { health: 'failed', step: 1, direct: true, root: id, path: [id], reason: `${names.get(id)} was failed directly.` }
      : { health: 'healthy', step: 0, direct: false, path: [], reason: 'All dependencies are available.' };
  }

  for (let round = 2, changed = true; changed && round <= 2 * ids.length + 2; round++) {
    changed = false;
    const next: SimResult = { ...state };
    for (const id of ids) {
      if (injected.has(id)) continue;
      let worst: Impact | undefined;
      for (const unit of unitsFor(incoming.get(id)!)) {
        // Unit health = healthiest provider (ANY_AVAILABLE; a lone edge is a unit of one).
        const best = [...unit].sort((a, b) => sev[state[a.provider].health] - sev[state[b.provider].health] || byId(a.provider, b.provider))[0];
        const ph = state[best.provider].health;
        const h: Health = best.kind === 'soft' ? (ph === 'healthy' ? 'healthy' : 'degraded') : ph;
        if (h === 'healthy' || sev[h] <= sev[worst?.health ?? 'healthy']) continue;
        const p = state[best.provider];
        const redundancy = unit.length > 1 ? ` No healthy backup provider remained (${unit.map(u => names.get(u.provider)).join(', ')}).` : '';
        worst = {
          health: h, step: round, direct: false, root: p.root, via: best.provider, kind: best.kind,
          path: [...p.path, id],
          reason: `${names.get(id)} ${h === 'failed' ? 'failed' : 'is degraded'} because ${names.get(best.provider)} is ${ph === 'failed' ? 'unavailable' : 'degraded'} (${best.kind} dependency).${redundancy}`,
        };
      }
      if (worst && sev[worst.health] > sev[state[id].health]) { next[id] = worst; changed = true; }
    }
    state = next;
  }
  return state;
}

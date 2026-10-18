import type { System, SimResult } from '../types/system';
export function metrics(system: System, r: SimResult) {
  const all = Object.entries(r), n = all.length;
  const failed = all.filter(([, v]) => v.health === 'failed').length;
  const degraded = all.filter(([, v]) => v.health === 'degraded').length;
  const direct = all.filter(([, v]) => v.direct).length;
  return {
    total: n, failed, degraded, unaffected: n - failed - degraded, direct, cascading: failed + degraded - direct,
    impactPct: n ? Math.round(((failed + degraded) / n) * 100) : 0,
    criticalAffected: system.components.filter(c => c.critical && r[c.id].health !== 'healthy').map(c => c.id),
    maxDepth: Math.max(0, ...all.map(([, v]) => v.path.length - 1)),
  };
}

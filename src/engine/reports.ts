import type { Health, System } from '../types/system';
import { simulate } from './propagation';
import { metrics } from './metrics';

export interface RunResult { name: string; health: Health; direct: boolean; reason: string; path: string[] }
export interface Run {
  id: string; name: string; timestamp: string; failed: string[]; system: System;
  summary: { failed: number; degraded: number; unaffected: number; impactPct: number; maxDepth: number };
  results: Record<string, RunResult>;
}

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6); // ids only; simulation never uses randomness

/** Runs the real engine and snapshots system + outcome so the run can be reopened or compared later. */
export function makeRun(name: string, system: System, failed: string[], now = new Date()): Run {
  const res = simulate(system, failed);
  const m = metrics(system, res);
  const nameOf = (id: string) => system.components.find(c => c.id === id)?.name ?? id;
  const results: Run['results'] = {};
  for (const c of system.components)
    results[c.id] = { name: c.name, health: res[c.id].health, direct: res[c.id].direct, reason: res[c.id].reason, path: res[c.id].path.map(nameOf) };
  return {
    id: newId(), name, timestamp: now.toISOString(), failed: [...failed], system: structuredClone(system),
    summary: { failed: m.failed, degraded: m.degraded, unaffected: m.unaffected, impactPct: m.impactPct, maxDepth: m.maxDepth },
    results,
  };
}

/** Components whose health differs between two runs ('absent' = not in that run's graph). */
export function diffRuns(a: Run, b: Run) {
  const ids = [...new Set([...Object.keys(a.results), ...Object.keys(b.results)])].sort();
  return ids
    .map(id => ({ name: (a.results[id] ?? b.results[id]).name, a: a.results[id]?.health ?? 'absent', b: b.results[id]?.health ?? 'absent' }))
    .filter(r => r.a !== r.b);
}

/** CSV cell: quote everything, double inner quotes, neutralise spreadsheet formulas. */
export function csvCell(v: unknown): string {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

export function toCsv(runs: Run[]): string {
  const head = ['scenario', 'timestamp', 'failed_injected', 'component', 'health', 'direct_failure', 'propagation_path', 'reason'];
  const rows = runs.flatMap(r => Object.values(r.results).map(x => [
    r.name, r.timestamp, r.failed.map(id => r.results[id]?.name ?? id).join('; '), x.name, x.health, x.direct, x.path.join(' > '), x.reason,
  ]));
  return [head, ...rows].map(row => row.map(csvCell).join(',')).join('\n');
}

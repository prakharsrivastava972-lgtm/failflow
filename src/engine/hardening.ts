import type { System } from '../types/system';
import { rankSpofs } from './spof-analysis';
import { addRedundant, hasReplica } from '../mitigationOps';

/** 0-100. 100 minus the average % of the system lost when any single component fails (same formula as the dashboard). */
export function resilienceScore(system: System): number {
  const n = system.components.length;
  if (n < 2) return 100;
  const avgLoss = rankSpofs(system).reduce((a, r) => a + r.blastRadius / (n - 1), 0) / n;
  return Math.max(0, Math.min(100, 100 * (1 - avgLoss)));
}

export interface HardenStep {
  id: string;        // component that gets a replica
  name: string;
  before: number;    // score before this step
  after: number;     // score after this step, measured by re-simulating every single failure
  gain: number;
  system: System;    // the graph after applying steps 1..this one
}

/**
 * Greedy, deterministic plan. Each round: try a replica for every component that currently causes impact,
 * measure the real resilience score of each candidate, keep the best one if it gains at least 1 point.
 */
export function planHardening(start: System, maxSteps = 3): HardenStep[] {
  const steps: HardenStep[] = [];
  let cur = start;
  let score = resilienceScore(cur);
  for (let k = 0; k < maxSteps; k++) {
    const risky = new Set(rankSpofs(cur).filter(r => r.blastRadius > 0).map(r => r.id));
    let best: HardenStep | null = null;
    for (const c of cur.components) {
      if (!risky.has(c.id) || c.id.endsWith('-replica') || hasReplica(cur, c.id)) continue;
      const next = addRedundant(cur, c.id);
      const s = resilienceScore(next);
      if (s - score >= 1 && (!best || s > best.after)) best = { id: c.id, name: c.name, before: score, after: s, gain: s - score, system: next };
    }
    if (!best) break;
    steps.push(best);
    cur = best.system;
    score = best.after;
  }
  return steps;
}

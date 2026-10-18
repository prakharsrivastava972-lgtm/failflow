import { describe, it, expect } from 'vitest';
import { planHardening, resilienceScore } from '../engine/hardening';
import { simulate } from '../engine/propagation';
import { metrics } from '../engine/metrics';
import { validateSystem } from '../engine/graph-validation';
import { sampleSystem } from '../data/sample-system';

describe('hardening plan', () => {
  const steps = planHardening(sampleSystem, 3);

  it('recommends the database first', () => {
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].id).toBe('db');
  });
  it('every step strictly improves the measured score and stays within the limit', () => {
    expect(steps.length).toBeLessThanOrEqual(3);
    steps.forEach(s => expect(s.after).toBeGreaterThan(s.before));
    expect(steps[0].before).toBeCloseTo(resilienceScore(sampleSystem), 6);
  });
  it('each step produces a valid graph, and the first step contains a database outage', () => {
    steps.forEach(s => expect(validateSystem(s.system).ok).toBe(true));
    expect(metrics(steps[0].system, simulate(steps[0].system, ['db']))).toMatchObject({ failed: 1, degraded: 0 });
  });
  it('is deterministic and does not modify the input graph', () => {
    const copy = JSON.parse(JSON.stringify(sampleSystem));
    expect(planHardening(sampleSystem, 3).map(s => s.id)).toEqual(steps.map(s => s.id));
    expect(sampleSystem).toEqual(copy);
  });
  it('returns no steps for a trivial system', () => {
    expect(planHardening({ components: [{ id: 'a', name: 'A', type: 'x' }], dependencies: [] })).toEqual([]);
  });
});

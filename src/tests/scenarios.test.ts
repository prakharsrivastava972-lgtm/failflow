import { describe, it, expect } from 'vitest';
import { scenarios } from '../data/sample-scenarios';
import { simulate } from '../engine/propagation';
import { metrics } from '../engine/metrics';

const run = (i: number) => { const s = scenarios[i]; return metrics(s.system, simulate(s.system, s.failed)); };

describe('preset scenarios (hand-calculated)', () => {
  it('A: payment failure -> 3 failed, 1 degraded', () => {
    expect(run(0)).toMatchObject({ failed: 3, degraded: 1, unaffected: 6 });
  });
  it('B: database failure -> 8 failed, 1 degraded, payment unaffected', () => {
    expect(run(1)).toMatchObject({ failed: 8, degraded: 1, unaffected: 1 });
  });
  it('C: backup gateway contains the failure to the gateway itself', () => {
    expect(run(2)).toMatchObject({ failed: 1, degraded: 0 });
  });
});

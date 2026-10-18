import { describe, it, expect } from 'vitest';
import { simulate } from '../engine/propagation';
import { metrics } from '../engine/metrics';
import { maxStep, resultAtStep, eventsAtStep } from '../engine/playback';
import { addRedundant, removeRedundant, hasReplica } from '../mitigationOps';
import { sampleSystem } from '../data/sample-system';

describe('generic redundancy', () => {
  it('a database replica contains a database outage to the database itself', () => {
    const s = addRedundant(sampleSystem, 'db');
    expect(hasReplica(s, 'db')).toBe(true);
    expect(metrics(s, simulate(s, ['db']))).toMatchObject({ failed: 1, degraded: 0 });
  });
  it('failing both the database and its replica brings the cascade back', () => {
    const s = addRedundant(sampleSystem, 'db');
    expect(metrics(s, simulate(s, ['db', 'db-replica']))).toMatchObject({ failed: 9, degraded: 1 });
  });
  it('removeRedundant restores the original system', () => {
    expect(removeRedundant(addRedundant(sampleSystem, 'db'), 'db')).toEqual(sampleSystem);
  });
  it('a replica of a dependent service shares its upstream, so upstream failures still hit it', () => {
    const s = addRedundant(sampleSystem, 'checkout');
    expect(simulate(s, ['inventory']).order.health).toBe('failed');
  });
  it('a replica of auth keeps the gateway and client up when auth fails', () => {
    const s = addRedundant(sampleSystem, 'auth');
    const r = simulate(s, ['auth']);
    expect(r.client.health).toBe('healthy');
    expect(r.checkout.health).toBe('healthy');
  });
});

describe('playback', () => {
  const r = simulate(sampleSystem, ['payment']);
  it('knows the number of rounds', () => expect(maxStep(r)).toBe(4));
  it('reveals impact round by round', () => {
    expect(resultAtStep(r, 0).payment.health).toBe('healthy');
    expect(resultAtStep(r, 1).payment.health).toBe('failed');
    expect(resultAtStep(r, 2).checkout.health).toBe('failed');
    expect(resultAtStep(r, 2).order.health).toBe('healthy');
    expect(resultAtStep(r, 4).notify.health).toBe('degraded');
  });
  it('lists the events of a round', () => {
    expect(eventsAtStep(r, 3)).toEqual(['order']);
  });
});

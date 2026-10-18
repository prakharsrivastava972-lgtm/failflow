import { describe, it, expect } from 'vitest';
import { simulate } from '../engine/propagation';
import { rankSpofs } from '../engine/spof-analysis';
import { compare } from '../engine/mitigation';
import { sampleSystem, withBackupPayment } from '../data/sample-system';
const h = (r: ReturnType<typeof simulate>, id: string) => r[id].health;

describe('engine', () => {
  it('payment failure cascades checkout -> order, degrades notify', () => {
    const r = simulate(sampleSystem, ['payment']);
    expect(['payment', 'checkout', 'order'].map(i => h(r, i))).toEqual(['failed', 'failed', 'failed']);
    expect(h(r, 'notify')).toBe('degraded');
    expect(['client', 'gateway', 'auth', 'db'].every(i => h(r, i) === 'healthy')).toBe(true);
    expect(r.order.path).toEqual(['payment', 'checkout', 'order']);
  });
  it('db failure reaches auth, gateway, client', () => {
    const r = simulate(sampleSystem, ['db']);
    expect(h(r, 'auth')).toBe('failed'); expect(h(r, 'gateway')).toBe('failed');
    expect(h(r, 'client')).toBe('failed'); expect(h(r, 'notify')).toBe('degraded');
  });
  it('soft dependency only degrades', () => {
    const r = simulate(sampleSystem, ['catalog']);
    expect(h(r, 'client')).toBe('degraded'); expect(h(r, 'gateway')).toBe('healthy');
  });
  it('explicit backup prevents cascade; improvement is verified', () => {
    expect(h(simulate(withBackupPayment, ['payment']), 'checkout')).toBe('healthy');
    const cmp = compare(sampleSystem, withBackupPayment, ['payment']);
    expect(cmp.improved).toBe(true); expect(cmp.impactReduction).toBe(3);
    expect(h(simulate(withBackupPayment, ['payment', 'payment2']), 'checkout')).toBe('failed');
  });
  it('is deterministic, handles cycles and unknown ids', () => {
    expect(simulate(sampleSystem, ['db'])).toEqual(simulate(sampleSystem, ['db']));
    const cyc = { components: [{ id: 'a', name: 'A', type: 'x' }, { id: 'b', name: 'B', type: 'x' }],
      dependencies: [{ provider: 'a', dependent: 'b', kind: 'hard' as const }, { provider: 'b', dependent: 'a', kind: 'hard' as const }] };
    expect(h(simulate(cyc, ['a']), 'b')).toBe('failed');
    expect(Object.values(simulate(sampleSystem, ['nope'])).every(v => v.health === 'healthy')).toBe(true);
  });
  it('ranks database as top blast radius', () => {
    expect(rankSpofs(sampleSystem)[0].id).toBe('db');
  });
});

import { describe, it, expect } from 'vitest';
import { makeRun, diffRuns, csvCell, toCsv } from '../engine/reports';
import { sampleSystem, withBackupPayment } from '../data/sample-system';

describe('reports', () => {
  it('makeRun summarises the real simulation', () => {
    const r = makeRun('Payment down', sampleSystem, ['payment']);
    expect(r.summary).toMatchObject({ failed: 3, degraded: 1, unaffected: 6, impactPct: 40 });
    expect(r.results.order.path).toEqual(['Payment Gateway', 'Checkout Service', 'Order Service']);
  });
  it('csvCell quotes values and neutralises formulas', () => {
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('=HYPERLINK("x")').startsWith('"\'=')).toBe(true);
  });
  it('toCsv has one row per component plus a header', () => {
    expect(toCsv([makeRun('x', sampleSystem, ['db'])]).split('\n').length).toBe(1 + sampleSystem.components.length);
  });
  it('diffRuns shows what the backup changed', () => {
    const base = makeRun('base', sampleSystem, ['payment']);
    const mit = makeRun('mitigated', withBackupPayment, ['payment']);
    const d = diffRuns(base, mit);
    expect(d.find(x => x.name === 'Checkout Service')).toMatchObject({ a: 'failed', b: 'healthy' });
    expect(d.find(x => x.name === 'Backup Payment Gateway')).toMatchObject({ a: 'absent', b: 'healthy' });
  });
});

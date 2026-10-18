import { describe, it, expect } from 'vitest';
import { validateSystem } from '../engine/graph-validation';
import { sampleSystem } from '../data/sample-system';

describe('validateSystem', () => {
  it('accepts the sample system with no warnings', () => {
    const v = validateSystem(sampleSystem);
    expect(v.ok).toBe(true);
    expect(v.warnings).toEqual([]);
  });
  it('rejects non-objects and empty systems', () => {
    expect(validateSystem(null).ok).toBe(false);
    expect(validateSystem('x').ok).toBe(false);
    expect(validateSystem({ components: [], dependencies: [] }).ok).toBe(false);
  });
  it('rejects duplicate ids, unknown refs, self-loops and bad kinds', () => {
    const v = validateSystem({
      components: [{ id: 'a', name: 'A' }, { id: 'a', name: 'A2' }],
      dependencies: [
        { provider: 'a', dependent: 'zz', kind: 'hard' },
        { provider: 'a', dependent: 'a', kind: 'hard' },
        { provider: 'a', dependent: 'a', kind: 'weird' },
      ],
    });
    expect(v.ok).toBe(false);
    expect(v.errors.length).toBeGreaterThanOrEqual(4);
  });
  it('warns about cycles but still accepts the system', () => {
    const v = validateSystem({
      components: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }],
      dependencies: [{ provider: 'a', dependent: 'b', kind: 'hard' }, { provider: 'b', dependent: 'a', kind: 'hard' }],
    });
    expect(v.ok).toBe(true);
    expect(v.warnings.length).toBe(1);
  });
});

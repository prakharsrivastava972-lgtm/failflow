import { describe, it, expect } from 'vitest';
import { capabilityStatus } from '../engine/capabilities';
import { simulate } from '../engine/propagation';
import { addRedundant } from '../mitigationOps';
import { DEFAULT_CAPABILITIES as CAPS } from '../data/sample-capabilities';
import { sampleSystem } from '../data/sample-system';

const get = (id: string) => CAPS.find(c => c.id === id)!;
const health = (id: string, failed: string[], sys = sampleSystem) => capabilityStatus(get(id), simulate(sys, failed)).health;

describe('capabilities', () => {
  it('payment failure breaks buying and updates but not browsing or login', () => {
    expect(health('buy', ['payment'])).toBe('failed');
    expect(health('updates', ['payment'])).toBe('failed');
    expect(health('browse', ['payment'])).toBe('healthy');
    expect(health('login', ['payment'])).toBe('healthy');
  });
  it('database failure takes every capability down', () => {
    CAPS.forEach(c => expect(health(c.id, ['db'])).toBe('failed'));
  });
  it('a soft-dependency loss only degrades', () => {
    expect(health('login', ['catalog'])).toBe('degraded');
    expect(health('buy', ['catalog'])).toBe('degraded');
    expect(health('browse', ['catalog'])).toBe('failed');
    expect(health('updates', ['catalog'])).toBe('healthy');
  });
  it('lists the blocking components', () => {
    expect(capabilityStatus(get('buy'), simulate(sampleSystem, ['payment'])).blockers).toEqual(['checkout', 'order']);
  });
  it('a replica restores a capability that requires the failed component', () => {
    const cap = { id: 'x', name: 'Needs db', requires: ['db'] };
    expect(capabilityStatus(cap, simulate(sampleSystem, ['db'])).health).toBe('failed');
    const hardened = addRedundant(sampleSystem, 'db');
    expect(capabilityStatus(cap, simulate(hardened, ['db'])).health).toBe('healthy');
    CAPS.forEach(c => expect(health(c.id, ['db'], hardened)).toBe('healthy'));
  });
  it('ignores components that do not exist', () => {
    expect(capabilityStatus({ id: 'y', name: 'Y', requires: ['nope'] }, simulate(sampleSystem, ['db'])).health).toBe('healthy');
  });
});

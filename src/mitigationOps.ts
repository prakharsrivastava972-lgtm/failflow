import type { System } from './types/system';

export const hasBackup = (s: System) => s.components.some(c => c.id === 'payment2');

/** Adds a backup payment provider that mirrors every dependent of `payment`, in one redundancy group. */
export function withBackup(s: System): System {
  if (hasBackup(s) || !s.components.some(c => c.id === 'payment')) return s;
  const edges = s.dependencies.filter(d => d.provider === 'payment');
  return {
    components: [...s.components, { id: 'payment2', name: 'Backup Payment Gateway', type: 'Payment Service' }],
    dependencies: [
      ...s.dependencies.map(d => (d.provider === 'payment' ? { ...d, group: 'payments' } : d)),
      ...edges.map(d => ({ provider: 'payment2', dependent: d.dependent, kind: d.kind, group: 'payments' })),
    ],
  };
}

export function withoutBackup(s: System): System {
  if (!hasBackup(s)) return s;
  return {
    components: s.components.filter(c => c.id !== 'payment2'),
    dependencies: s.dependencies
      .filter(d => d.provider !== 'payment2')
      .map(d => (d.provider === 'payment' && d.group === 'payments' ? { ...d, group: undefined } : d)),
  };
}

/** Generic redundancy: adds an identical replica of `id` in the same redundancy group for every dependent. */
const replicaId = (id: string) => `${id}-replica`;
const groupName = (id: string) => `${id}-ha`;

export const hasReplica = (s: System, id: string) => s.components.some(c => c.id === replicaId(id));

export function addRedundant(s: System, id: string): System {
  const orig = s.components.find(c => c.id === id);
  if (!orig || hasReplica(s, id)) return s;
  const rid = replicaId(id), g = groupName(id);
  const downstream = s.dependencies.filter(d => d.provider === id);
  const upstream = s.dependencies.filter(d => d.dependent === id);
  return {
    components: [...s.components, { id: rid, name: `${orig.name} (replica)`, type: orig.type }],
    dependencies: [
      ...s.dependencies.map(d => (d.provider === id ? { ...d, group: d.group ?? g } : d)),
      // replica serves the same dependents, in the same group as the original
      ...downstream.map(d => ({ provider: rid, dependent: d.dependent, kind: d.kind, group: d.group ?? g })),
      // replica needs the same upstream providers as the original, so shared upstream failures still hit both
      ...upstream.map(d => ({ provider: d.provider, dependent: rid, kind: d.kind, group: d.group })),
    ],
  };
}

export function removeRedundant(s: System, id: string): System {
  if (!hasReplica(s, id)) return s;
  const rid = replicaId(id), g = groupName(id);
  return {
    components: s.components.filter(c => c.id !== rid),
    dependencies: s.dependencies
      .filter(d => d.provider !== rid && d.dependent !== rid)
      .map(d => (d.provider === id && d.group === g ? { ...d, group: undefined } : d)),
  };
}

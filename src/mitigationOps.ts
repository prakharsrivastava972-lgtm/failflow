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

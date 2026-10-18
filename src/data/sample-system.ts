import type { System } from '../types/system';
const c = (id: string, name: string, type: string, critical = false) => ({ id, name, type, critical });
export const sampleSystem: System = {
  components: [
    c('client', 'Client Application', 'client'), c('gateway', 'API Gateway', 'gateway', true),
    c('auth', 'Authentication Service', 'auth', true), c('catalog', 'Product Catalogue', 'service'),
    c('inventory', 'Inventory Service', 'service'), c('payment', 'Payment Gateway', 'payment', true),
    c('checkout', 'Checkout Service', 'service', true), c('order', 'Order Service', 'service', true),
    c('notify', 'Notification Service', 'notification'), c('db', 'Database', 'database', true),
  ],
  dependencies: [
    { provider: 'gateway', dependent: 'client', kind: 'hard' },
    { provider: 'catalog', dependent: 'client', kind: 'soft' },
    { provider: 'auth', dependent: 'gateway', kind: 'hard' },
    { provider: 'db', dependent: 'auth', kind: 'hard' },
    { provider: 'db', dependent: 'catalog', kind: 'hard' },
    { provider: 'db', dependent: 'inventory', kind: 'hard' },
    { provider: 'inventory', dependent: 'checkout', kind: 'hard' },
    { provider: 'payment', dependent: 'checkout', kind: 'hard' },
    { provider: 'auth', dependent: 'checkout', kind: 'hard' },
    { provider: 'checkout', dependent: 'order', kind: 'hard' },
    { provider: 'db', dependent: 'order', kind: 'hard' },
    { provider: 'order', dependent: 'notify', kind: 'soft' },
  ],
};
/** Scenario C: add a secondary provider in the same redundancy group. */
export const withBackupPayment: System = {
  components: [...sampleSystem.components, c('payment2', 'Backup Payment Gateway', 'payment')],
  dependencies: [
    ...sampleSystem.dependencies.map(d => d.provider === 'payment' ? { ...d, group: 'payments' } : d),
    { provider: 'payment2', dependent: 'checkout', kind: 'hard', group: 'payments' },
  ],
};

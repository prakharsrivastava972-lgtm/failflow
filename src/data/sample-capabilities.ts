import type { Capability } from '../engine/capabilities';

export const DEFAULT_CAPABILITIES: Capability[] = [
  { id: 'browse', name: 'Customers can browse products', requires: ['client', 'gateway', 'catalog'] },
  { id: 'login', name: 'Customers can log in', requires: ['client', 'gateway', 'auth'] },
  { id: 'buy', name: 'Customers can buy', requires: ['client', 'gateway', 'checkout', 'order'] },
  { id: 'updates', name: 'Customers get order updates', requires: ['order', 'notify'] },
];

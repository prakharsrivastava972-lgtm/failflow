import type { System } from '../types/system';
import { sampleSystem, withBackupPayment } from './sample-system';

export interface Scenario { id: string; name: string; description: string; system: System; failed: string[] }

export const scenarios: Scenario[] = [
  { id: 'A', name: 'A: Payment Gateway failure', system: sampleSystem, failed: ['payment'],
    description: 'Fails the payment provider on the baseline system. Checkout and Order break; Notification degrades.' },
  { id: 'B', name: 'B: Database failure', system: sampleSystem, failed: ['db'],
    description: 'Fails the shared database. Most of the system goes down, which makes it the largest single point of failure.' },
  { id: 'C', name: 'C: Backup payment gateway', system: withBackupPayment, failed: ['payment'],
    description: 'Same payment failure, but with a backup provider in the same redundancy group. The engine verifies whether the cascade is prevented.' },
];

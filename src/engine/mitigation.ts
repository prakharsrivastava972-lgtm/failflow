import type { System } from '../types/system';
import { simulate } from './propagation';
import { metrics } from './metrics';
export function compare(before: System, after: System, failedIds: string[]) {
  const b = metrics(before, simulate(before, failedIds)), a = metrics(after, simulate(after, failedIds));
  const bi = b.failed + b.degraded, ai = a.failed + a.degraded;
  return { before: b, after: a, improved: ai < bi, impactReduction: bi - ai }; // "improved" only if verified
}

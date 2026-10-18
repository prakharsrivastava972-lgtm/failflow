import type { System } from './types/system';
/** Simple layered layout: column = longest provider chain leading to the component (cycle-safe). */
export function layout(sys: System) {
  const n = sys.components.length;
  const depth: Record<string, number> = {};
  sys.components.forEach(c => (depth[c.id] = 0));
  for (let i = 0; i < n; i++)
    for (const d of sys.dependencies)
      depth[d.dependent] = Math.max(depth[d.dependent], Math.min(depth[d.provider] + 1, n - 1));
  const rows: Record<number, number> = {};
  const pos: Record<string, { x: number; y: number }> = {};
  for (const c of sys.components) {
    const col = depth[c.id], r = rows[col] ?? 0;
    rows[col] = r + 1;
    pos[c.id] = { x: col * 250, y: r * 100 };
  }
  return pos;
}

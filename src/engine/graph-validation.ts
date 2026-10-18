import type { System, Component, Dependency } from '../types/system';

export interface Validation { ok: boolean; errors: string[]; warnings: string[]; system?: System }
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Components that sit on a cycle: repeatedly prune nodes with no incoming or no outgoing edges; what remains is cyclic. */
export function cyclicNodes(system: System): string[] {
  let alive = new Set(system.components.map(c => c.id));
  for (let changed = true; changed; ) {
    changed = false;
    for (const id of [...alive]) {
      const hasIn = system.dependencies.some(d => d.dependent === id && alive.has(d.provider));
      const hasOut = system.dependencies.some(d => d.provider === id && alive.has(d.dependent));
      if (!hasIn || !hasOut) { alive.delete(id); changed = true; }
    }
  }
  return [...alive];
}

/** Validates untrusted data (imports, stored data) and returns a cleaned System or readable errors. */
export function validateSystem(input: unknown): Validation {
  const errors: string[] = [], warnings: string[] = [];
  if (!isObj(input) || !Array.isArray(input.components) || !Array.isArray(input.dependencies))
    return { ok: false, errors: ['Expected an object with "components" and "dependencies" arrays.'], warnings };

  const components: Component[] = [], ids = new Set<string>();
  input.components.forEach((c, i) => {
    if (!isObj(c) || typeof c.id !== 'string' || !c.id.trim()) return void errors.push(`components[${i}]: missing text "id".`);
    if (typeof c.name !== 'string' || !c.name.trim()) return void errors.push(`components[${i}] ("${c.id}"): missing "name".`);
    if (ids.has(c.id)) return void errors.push(`Duplicate component id "${c.id}".`);
    ids.add(c.id);
    components.push({ id: c.id, name: c.name.slice(0, 80), type: typeof c.type === 'string' ? c.type : 'Service',
      description: typeof c.description === 'string' ? c.description : undefined, critical: c.critical === true });
  });
  if (components.length === 0 && errors.length === 0) errors.push('System has no components.');

  const dependencies: Dependency[] = [], pairs = new Set<string>();
  input.dependencies.forEach((d, i) => {
    if (!isObj(d) || typeof d.provider !== 'string' || typeof d.dependent !== 'string')
      return void errors.push(`dependencies[${i}]: "provider" and "dependent" must be text.`);
    if (!ids.has(d.provider)) return void errors.push(`dependencies[${i}]: unknown provider "${d.provider}".`);
    if (!ids.has(d.dependent)) return void errors.push(`dependencies[${i}]: unknown dependent "${d.dependent}".`);
    if (d.provider === d.dependent) return void errors.push(`dependencies[${i}]: "${d.provider}" cannot depend on itself.`);
    if (d.kind !== 'hard' && d.kind !== 'soft') return void errors.push(`dependencies[${i}]: "kind" must be "hard" or "soft".`);
    const key = `${d.provider}->${d.dependent}`;
    if (pairs.has(key)) return void errors.push(`Duplicate dependency ${key}.`);
    pairs.add(key);
    dependencies.push({ provider: d.provider, dependent: d.dependent, kind: d.kind,
      group: typeof d.group === 'string' && d.group.trim() ? d.group.trim().slice(0, 40) : undefined });
  });

  if (errors.length) return { ok: false, errors, warnings };
  const system = { components, dependencies };
  const cyc = cyclicNodes(system);
  if (cyc.length) {
    const names = cyc.map(id => components.find(c => c.id === id)!.name).join(', ');
    warnings.push(`Cyclic dependency involving: ${names}. The engine handles cycles, but check that this is intended.`);
  }
  return { ok: true, errors, warnings, system };
}

export type Health = 'healthy' | 'degraded' | 'failed';
export type DepKind = 'hard' | 'soft';

export interface Component {
  id: string;
  name: string;
  type: string;
  description?: string;
  critical?: boolean;
}

/** provider -> dependent: `dependent` needs `provider`.
 *  Edges to the same dependent sharing a `group` are interchangeable (ANY_AVAILABLE). */
export interface Dependency {
  provider: string;
  dependent: string;
  kind: DepKind;
  group?: string;
}

export interface System {
  components: Component[];
  dependencies: Dependency[];
}

export interface Impact {
  health: Health;
  step: number;              // 0 = untouched, 1 = injected, n = propagation round
  direct: boolean;           // injected failure
  root?: string;             // originating failed component
  via?: string;              // immediate cause (provider)
  kind?: DepKind;            // dependency type responsible
  path: string[];            // root -> ... -> this component
  reason: string;
}
export type SimResult = Record<string, Impact>;

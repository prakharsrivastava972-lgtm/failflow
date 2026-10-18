# FailFlow

Interactive system dependency modelling and failure simulation (FLIPHACK '26, PS-03: "What If the System Breaks?").
Build a dependency graph, fail any component, watch the impact propagate, read why each service was affected,
add a backup, and verify whether the system became more resilient.

> FailFlow simulates the **structural model you define**. It does not monitor or test real infrastructure,
> and results are only as accurate as your dependency graph and failure assumptions.

## Quick start

```bash
npm install
npm run dev      # start the app
npm test         # engine, validation, report and scenario tests
npm run build    # type-check and production build
```

## Features

- **System Designer:** add, rename, delete components; drag to connect; hard/soft dependencies; redundancy groups; critical flags.
- **Failure Simulator:** fail any set of components; red/amber/green status with text labels; animated propagation edges; per-component explanations and paths.
- **Critical Components:** every component is failed alone and ranked by simulated blast radius, with a separate graph articulation-point check.
- **Mitigation Lab:** presets A (payment failure), B (database failure), C (backup gateway) and a before/after comparison.
- **Scenario History:** save, reopen, duplicate and compare runs; export JSON or CSV reports.
- **Import/Export:** validated JSON; malformed files are rejected with readable errors and never silently overwrite your system.

## Architecture\src/
types/system.ts data model
engine/propagation.ts failure propagation (pure, no React)
engine/metrics.ts impact metrics
engine/spof-analysis.ts per-component blast radius ranking
engine/mitigation.ts before/after comparison
engine/graph-validation.ts import validation and cycle detection
engine/reports.ts run snapshots, diffs, CSV
data/ sample system and preset scenarios
store/useStore.ts Zustand state (persisted to LocalStorage)
*.tsx UI panels
tests/ Vitest tests\
The engine is independent of React and fully unit-tested.

## Dependency semantics

An edge `provider -> dependent` means the **dependent needs the provider**.

- A dependent's incoming edges form **units**. An ungrouped edge is its own unit; edges sharing a `group` are interchangeable providers (any one healthy provider satisfies the unit). Redundancy is never inferred.
- A unit's health is the healthiest of its providers.
- **Hard** unit: passes that health through (provider lost -> dependent failed; provider degraded -> dependent degraded).
- **Soft** unit: caps at degraded.
- A component's health is the worst of its units.

## Algorithm

Monotone fixed-point propagation in synchronous rounds. Health only gets worse, so the loop always terminates (at most 2n rounds), including on cyclic graphs, and gives identical results for identical inputs. No randomness is used in simulation. Each affected component records its root cause, immediate cause, dependency type, propagation path and a generated explanation.

**Blast radius** = failed + 0.5 x degraded downstream components, taken from real simulation runs. It is distinct from a graph articulation point, which FailFlow computes separately.

## Limitations

- Binary component failure only; no partial capacity, latency, load or failover delay.
- Backups are assumed identical, independent and instant.
- Hidden shared dependencies not in the graph are not modelled.
- The mitigation button targets a component with id `payment`.
- Data is stored in the browser (LocalStorage); there is no backend or multi-user sync.

## Deployment

**Vercel:** import the GitHub repository; framework preset "Vite"; build command `npm run build`; output directory `dist`.

**GitHub Pages:** set `base: '/<repo-name>/'` in `vite.config.ts`, run `npm run build`, and publish the `dist` folder (for example with the `gh-pages` package or a GitHub Actions workflow).

## Screenshots

Add screenshots to `docs/` and link them here (graph view, failure propagation, critical components, mitigation comparison).

## 90-second demo script

1. **Overview:** "FailFlow turns a dependency diagram into a working failure simulator. Nothing is hardcoded; every result comes from a deterministic engine."
2. **Scenario A (Payment Gateway failure):** click *Run scenario*, then **Play**. "Round 1 the gateway fails, round 2 Checkout, round 3 Order, round 4 Notification degrades. The client stays up because the catalogue link is soft."
3. **Explain:** click *Order Service* and read the generated explanation and propagation path.
4. **Critical Components:** "Every component was failed alone and ranked by blast radius. Database is the biggest single point of failure."
5. **Fix it live:** fail *Database*, select it, click *Add replica*. "8 components down becomes 1, and the engine verified it."
6. **Prove it is real:** fail the replica too and the cascade returns.
7. **History and reports:** save the runs, compare them, export a CSV/JSON report.
8. **Honesty:** "It simulates the structural model you define; it does not monitor real infrastructure."

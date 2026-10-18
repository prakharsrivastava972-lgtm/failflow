import { useEffect, useMemo, useState } from 'react';
import { ReactFlow, Background, Controls, MiniMap, MarkerType, Position, useNodesState, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStore } from './store/useStore';
import { simulate } from './engine/propagation';
import { metrics } from './engine/metrics';
import { compare } from './engine/mitigation';
import { maxStep, resultAtStep, eventsAtStep } from './engine/playback';
import { addRedundant, removeRedundant, hasReplica, hasBackup } from './mitigationOps';
import DesignerPanel from './DesignerPanel';
import { layout } from './layout';

// Status is shown by colour AND an icon/label (non-colour indicator).
const STYLE = {
  healthy: { bg: '#14532d', border: '#22c55e', icon: '● OK' },
  degraded: { bg: '#78350f', border: '#f59e0b', icon: '▲ DEGRADED' },
  failed: { bg: '#7f1d1d', border: '#ef4444', icon: '✖ FAILED' },
} as const;

export default function Simulator() {
  const { system, failed, selected, select, toggleFail, reset, addDependency } = useStore();
  const [playStep, setPlayStep] = useState<number | null>(null); // null = final state
  const [playing, setPlaying] = useState(false);

  const result = useMemo(() => simulate(system, failed), [system, failed]);
  const max = useMemo(() => maxStep(result), [result]);
  const cur = playStep ?? max;
  const shown = useMemo(() => resultAtStep(result, cur), [result, cur]);
  const m = useMemo(() => metrics(system, shown), [system, shown]);
  const nameOf = (id: string) => system.components.find(c => c.id === id)?.name ?? id;
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);

  // New scenario or edited graph: drop back to the final state.
  useEffect(() => { setPlayStep(null); setPlaying(false); }, [system, failed]);

  // Auto-play: advance one round per second.
  useEffect(() => {
    if (!playing || playStep === null) return;
    if (playStep >= max) { setPlaying(false); return; }
    const t = setTimeout(() => setPlayStep(playStep + 1), 1000);
    return () => clearTimeout(t);
  }, [playing, playStep, max]);

  useEffect(() => {
    const pos = layout(system);
    setNodes(prev => system.components.map(c => {
      const st = STYLE[shown[c.id].health];
      return {
        id: c.id,
        position: prev.find(n => n.id === c.id)?.position ?? pos[c.id], // keep dragged positions
        sourcePosition: Position.Right, targetPosition: Position.Left,
        data: { label: `${st.icon}  ${c.name}${c.critical ? ' ★' : ''}` },
        selected: c.id === selected,
        style: { background: st.bg, border: `2px solid ${st.border}`, color: '#fff', borderRadius: 8, width: 200, fontSize: 13 },
      };
    }));
  }, [system, shown, selected, setNodes]);

  const edges = useMemo<Edge[]>(() => system.dependencies.map(d => {
    const hot = shown[d.dependent].health !== 'healthy' && shown[d.dependent].via === d.provider;
    return {
      id: `${d.provider}->${d.dependent}`, source: d.provider, target: d.dependent, animated: hot,
      markerEnd: { type: MarkerType.ArrowClosed, color: hot ? '#ef4444' : '#64748b' },
      label: d.group ? `backup group: ${d.group}` : d.kind === 'soft' ? 'soft' : undefined,
      labelStyle: { fontSize: 10, fill: '#cbd5e1' }, labelBgStyle: { fill: '#0f172a' },
      style: { stroke: hot ? '#ef4444' : '#64748b', strokeWidth: hot ? 3 : 1.5, strokeDasharray: d.kind === 'soft' ? '6 4' : undefined },
    };
  }), [system, shown]);

  const sel = selected ? shown[selected] : null;
  const canRedundant = !!selected && !selected.endsWith('-replica');
  const hasRep = selected ? hasReplica(system, selected) : false;
  const cmp = failed.length && selected && canRedundant
    ? (hasRep ? compare(removeRedundant(system, selected), system, failed) : compare(system, addRedundant(system, selected), failed))
    : null;

  const toggleRedundant = (id: string) => {
    const ns = hasReplica(system, id) ? removeRedundant(system, id) : addRedundant(system, id);
    useStore.setState(s => ({ system: ns, backup: hasBackup(ns), failed: s.failed.filter(f => ns.components.some(c => c.id === f)) }));
  };

  const events = eventsAtStep(result, cur);
  const ctl = 'px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40';

  return (
    <div className="h-full flex bg-slate-900 text-slate-100">
      <div className="flex-1 relative">
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange}
          onConnect={c => addDependency(c.source, c.target)}
          onNodeClick={(_, n) => select(n.id)} onPaneClick={() => select(null)} fitView colorMode="dark">
          <Background /><Controls /><MiniMap pannable zoomable />
        </ReactFlow>
        <div className="absolute top-3 left-3 text-xs bg-slate-800/90 rounded p-2 border border-slate-700">
          <b>FailFlow</b> — edge A → B means B depends on A. Dashed = soft dependency. ★ = critical.
        </div>

        {failed.length > 0 && max >= 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[30rem] max-w-[90%] bg-slate-800/95 border border-slate-700 rounded p-3 text-xs space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <button className={ctl} onClick={() => { setPlayStep(0); setPlaying(true); }}>▶ Play</button>
              <button className={ctl} disabled={cur <= 0} onClick={() => { setPlaying(false); setPlayStep(Math.max(0, cur - 1)); }}>◀ Prev</button>
              <button className={ctl} disabled={cur >= max} onClick={() => { setPlaying(false); setPlayStep(Math.min(max, cur + 1)); }}>Next ▶</button>
              <button className={ctl} onClick={() => { setPlaying(false); setPlayStep(null); }}>Show final</button>
              <span className="ml-auto text-slate-300">{playStep === null ? `Final state (${max} rounds)` : `Round ${cur} of ${max}`}</span>
            </div>
            <div aria-live="polite" className="space-y-1">
              {cur === 0 && <div className="text-slate-400">Before the failure: everything is healthy.</div>}
              {events.map(id => <div key={id}>Round {cur}: {result[id].reason}</div>)}
              {cur > 0 && events.length === 0 && <div className="text-slate-400">No new changes this round.</div>}
            </div>
          </div>
        )}
      </div>

      <aside className="w-96 border-l border-slate-700 p-4 overflow-y-auto space-y-4 text-sm">
        <section className="grid grid-cols-3 gap-2 text-center">
          {[['Failed', m.failed, 'text-red-400'], ['Degraded', m.degraded, 'text-amber-400'], ['Unaffected', m.unaffected, 'text-green-400']].map(([l, v, c]) => (
            <div key={l as string} className="bg-slate-800 rounded p-2"><div className={`text-2xl font-bold ${c}`}>{v}</div>{l}</div>
          ))}
          <div className="col-span-3 text-xs text-slate-400">
            {m.impactPct}% impacted · {m.direct} direct, {m.cascading} cascading · max depth {m.maxDepth} · critical hit: {m.criticalAffected.map(nameOf).join(', ') || 'none'}
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Selected component</h2>
          {selected && sel ? (<>
            <div className="font-medium">{nameOf(selected)} — {STYLE[sel.health].icon}</div>
            <button onClick={() => toggleFail(selected)} className="px-3 py-1 rounded bg-violet-600 hover:bg-violet-500">
              {failed.includes(selected) ? 'Restore component' : 'Simulate failure'}
            </button>
            <p className="bg-slate-800 rounded p-2">{sel.reason}</p>
            {sel.path.length > 1 && <p className="text-xs text-slate-400">Path: {sel.path.map(nameOf).join(' → ')}</p>}
          </>) : <p className="text-slate-400">Click a node on the graph.</p>}
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Mitigation: redundancy</h2>
          {canRedundant ? (<>
            <button onClick={() => toggleRedundant(selected!)} className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600">
              {hasRep ? `Remove replica of ${nameOf(selected!)}` : `Add replica of ${nameOf(selected!)}`}
            </button>
            {cmp ? (
              <p className="bg-slate-800 rounded p-2">
                With vs. without a replica of {nameOf(selected!)}, same failure: {cmp.before.failed + cmp.before.degraded} → {cmp.after.failed + cmp.after.degraded} affected.{' '}
                {cmp.improved ? `Verified improvement (${cmp.impactReduction} fewer).` : 'No improvement for this failure.'}
              </p>
            ) : <p className="text-xs text-slate-400">Fail a component, then select one to test whether a replica helps.</p>}
          </>) : <p className="text-xs text-slate-400">Select a component to add a replica (same dependents, same redundancy group).</p>}
        </section>

        <button onClick={reset} className="px-3 py-1 rounded border border-slate-600">Reset all failures</button>
        <DesignerPanel />

        <section className="space-y-1">
          <h2 className="font-semibold">All components</h2>
          {system.components.map(c => (
            <div key={c.id} onClick={() => select(c.id)} className="cursor-pointer flex justify-between hover:bg-slate-800 rounded px-1">
              <span>{c.name}</span><span className="text-xs">{STYLE[shown[c.id].health].icon}</span>
            </div>
          ))}
        </section>
        <p className="text-xs text-slate-500">Results simulate the structural model you define; they do not monitor real infrastructure.</p>
      </aside>
    </div>
  );
}

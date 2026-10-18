import { useMemo } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useStore } from './store/useStore';
import { planHardening, resilienceScore } from './engine/hardening';

const card = 'bg-slate-800/80 border border-slate-700 rounded-xl p-4';
const colorOf = (s: number) => (s >= 70 ? '#22c55e' : s >= 40 ? '#f59e0b' : '#ef4444');

function Bar({ value }: { value: number }) {
  return <div className="h-2 rounded bg-slate-700 overflow-hidden"><div className="h-full rounded" style={{ width: `${value}%`, background: colorOf(value) }} /></div>;
}

export default function HardenPanel({ onOpen }: { onOpen: () => void }) {
  const { system, replaceSystem } = useStore();
  const before = useMemo(() => resilienceScore(system), [system]);
  const steps = useMemo(() => planHardening(system, 3), [system]);
  const finalScore = steps.length ? steps[steps.length - 1].after : before;

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 text-sm bg-linear-to-b from-slate-900 to-slate-950">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="text-yellow-300" aria-hidden="true" /> Harden my system</h1>
          <p className="text-slate-300">
            FailFlow tries adding a replica to each risky component, re-runs every single-component failure, and recommends the changes that
            raise your resilience score the most. Every number below is measured by the simulation engine, not estimated.
          </p>
        </header>

        <div className={`${card} grid gap-4 md:grid-cols-2`}>
          <div className="space-y-2">
            <div className="text-slate-300">Current resilience score</div>
            <div className="text-4xl font-bold" style={{ color: colorOf(before) }}>{Math.round(before)}<span className="text-lg text-slate-400">/100</span></div>
            <Bar value={before} />
          </div>
          <div className="space-y-2">
            <div className="text-slate-300">After the recommended plan</div>
            <div className="text-4xl font-bold" style={{ color: colorOf(finalScore) }}>{Math.round(finalScore)}<span className="text-lg text-slate-400">/100</span></div>
            <Bar value={finalScore} />
          </div>
        </div>

        {steps.length === 0 ? (
          <div className={`${card} text-slate-300`}>
            No replica improves the score by a meaningful amount. Either the system is already well hardened, or the remaining risk
            comes from dependencies that a replica cannot fix (for example, shared upstream components or soft links).
          </div>
        ) : (
          <ol className="space-y-3">
            {steps.map((s, i) => (
              <li key={s.id} className={`${card} flex flex-wrap items-center gap-3`}>
                <span className="h-8 w-8 shrink-0 rounded-full bg-yellow-400 text-slate-900 font-bold flex items-center justify-center">{i + 1}</span>
                <div className="flex-1 min-w-[14rem]">
                  <div className="font-semibold">Add a replica of {s.name}</div>
                  <div className="text-slate-300">
                    Score {Math.round(s.before)} → <b style={{ color: colorOf(s.after) }}>{Math.round(s.after)}</b>{' '}
                    <span className="text-green-400">(+{Math.round(s.gain)})</span>
                  </div>
                </div>
                <button onClick={() => replaceSystem(s.system)} className="px-3 py-1.5 rounded bg-violet-600 hover:bg-violet-500">
                  {i === 0 ? 'Apply this step' : `Apply steps 1–${i + 1}`}
                </button>
              </li>
            ))}
          </ol>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {steps.length > 0 && (
            <button onClick={() => replaceSystem(steps[steps.length - 1].system)} className="px-4 py-2 rounded bg-violet-600 hover:bg-violet-500">Apply the whole plan</button>
          )}
          <button onClick={onOpen} className="px-4 py-2 rounded border border-slate-500 hover:bg-slate-800">Open graph</button>
          <span className="text-xs text-slate-400">Applying changes your graph. Use ↶ Undo in the top bar to revert.</span>
        </div>

        <p className="text-xs text-slate-500">
          Assumptions: a replica is identical, independent of its original and fails over instantly, but it shares the original's upstream
          dependencies, so an outage upstream still affects both. Real failover time, capacity and hidden shared dependencies are not modelled.
        </p>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';

export type TabId = 'home' | 'sim' | 'spof' | 'lab' | 'history';
export const TOUR_KEY = 'failflow:tour:v1';

interface Step { tab: TabId; title: string; body: string[]; action?: { label: string; run: () => void } }

// Non-destructive demo helper: fails the Payment Gateway in the current graph, if it exists.
const failPayment = () => {
  if (useStore.getState().system.components.some(c => c.id === 'payment'))
    useStore.setState({ failed: ['payment'], selected: 'payment' });
};

const STEPS: Step[] = [
  { tab: 'home', title: 'Welcome to FailFlow',
    body: ['FailFlow answers one question: "What if this component breaks?"',
      'You describe a system as components and dependencies. Then you break something and watch what else fails, and why.',
      'Reading the graph: an arrow A → B means B depends on A. If A goes down, B is at risk.'] },
  { tab: 'home', title: 'Overview: one-click scenarios',
    body: ['"Run scenario" loads a ready-made example and jumps to the simulator with a failure already applied.',
      'A = Payment Gateway fails. B = Database fails. C = the same payment failure, but with a backup provider.',
      'Loading a scenario replaces your current graph. The Undo button in the top bar brings it back.'] },
  { tab: 'sim', title: 'The graph',
    body: ['Each box is a component. Click one to select it and see its details on the right.',
      'Colour and a text label show its health: ● OK (green), ▲ DEGRADED (amber), ✖ FAILED (red). ★ means critical.',
      'You can drag boxes around, zoom with the wheel, and use the minimap in the corner. Dashed arrows are soft dependencies.'] },
  { tab: 'sim', title: 'Break something',
    body: ['Select a component, then press "Simulate failure". The engine marks it failed and works out everything that depends on it.',
      '"Restore component" undoes that one failure. "Reset all failures" clears every failure at once.',
      'You can fail several components at the same time.'],
    action: { label: 'Fail Payment Gateway for me', run: failPayment } },
  { tab: 'sim', title: 'Watch it spread (playback)',
    body: ['The bar at the bottom of the graph replays the failure round by round.',
      '▶ Play runs it automatically. ◀ Prev and Next ▶ step manually. "Show final" jumps to the end result.',
      'Each round has a caption explaining exactly why a component failed.'],
    action: { label: 'Fail Payment Gateway for me', run: failPayment } },
  { tab: 'sim', title: 'Read the explanation',
    body: ['The panel on the right shows how many components are failed, degraded or unaffected, and what percentage of the system is hit.',
      'Select any affected component to read a plain-language reason and its propagation path, for example Payment Gateway → Checkout → Order.',
      'These explanations are generated from your actual graph, not written in advance.'] },
  { tab: 'sim', title: 'Fix it with a replica',
    body: ['"Add replica of …" creates a second, interchangeable copy of the selected component.',
      'FailFlow then re-runs the same failure and tells you the measured result, for example "9 → 1 affected, verified improvement".',
      'If the replica would not help, it says so. Failing the replica as well brings the cascade back.'] },
  { tab: 'sim', title: 'Build your own system (System designer)',
    body: ['Type a name and click "Add" to create a component. Select a component to rename it, mark it critical, or delete it (it asks first).',
      '"Add provider…" or dragging from one box\'s right dot to another\'s left dot creates a dependency.',
      'Hard = the dependent fails when the provider is lost. Soft = it only becomes degraded. Providers sharing a "group" name are interchangeable backups.',
      '"Reset to sample system" restores the example.'] },
  { tab: 'spof', title: 'Critical Components',
    body: ['FailFlow fails every component one at a time and ranks them by how much damage each one causes.',
      'The chart and table show failed and degraded counts, the blast radius, and a recommendation.',
      '"Show in graph" jumps back to the simulator with that component failed. "Articulation point" is a separate graph-theory check: a large blast radius does not automatically mean it is one.'] },
  { tab: 'lab', title: 'Mitigation Lab',
    body: ['Compare the same failure before and after adding a backup payment gateway, with a chart and a list of what changed.',
      'The three preset cards load scenarios A, B and C. The result box only says "verified improvement" when the numbers actually improve.',
      'Recovery assumptions are listed at the bottom: backups are assumed identical, independent and instant.'] },
  { tab: 'history', title: 'Scenario History and reports',
    body: ['"Save current scenario" stores the graph and failures with their results, so you can compare runs later.',
      'Reopen restores a saved run in the simulator. Duplicate copies it. Tick two runs to compare them side by side.',
      '"Download report" exports every saved run as JSON or CSV.'] },
  { tab: 'sim', title: 'Top bar and your data',
    body: ['Undo and Redo step back and forward through your graph edits.',
      'Export JSON saves your system to a file. Import JSON loads one; bad files are rejected with a clear error and nothing is overwritten without asking.',
      'Everything is saved privately in your own browser. Nothing is sent to a server, and other visitors cannot see your work.',
      'FailFlow simulates the model you define. It does not monitor real infrastructure.'] },
];

export default function Tour({ open, onClose, goTo }: { open: boolean; onClose: () => void; goTo: (t: TabId) => void }) {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  const finish = () => {
    try { localStorage.setItem(TOUR_KEY, '1'); } catch { /* storage can be unavailable */ }
    onClose();
  };

  useEffect(() => { if (open) setI(0); }, [open]);
  useEffect(() => { if (open) goTo(STEPS[i].tab); }, [open, i]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') finish(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;
  const btn = 'px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40';

  return (
    <div role="dialog" aria-label="FailFlow guided tour"
      className="fixed bottom-4 left-4 z-50 w-[26rem] max-w-[92vw] rounded-lg border border-yellow-400 bg-slate-800 p-4 shadow-2xl text-sm space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-300">
        <span>Step {i + 1} of {STEPS.length}</span>
        <button onClick={finish} className="underline hover:text-white">Skip tour</button>
      </div>
      <h2 className="text-base font-semibold text-white">{step.title}</h2>
      <div className="space-y-2 text-slate-200">{step.body.map((p, k) => <p key={k}>{p}</p>)}</div>
      {step.action && <button onClick={step.action.run} className="px-3 py-1 rounded bg-violet-600 hover:bg-violet-500">{step.action.label}</button>}
      <div className="flex items-center gap-1" aria-hidden="true">
        {STEPS.map((_, k) => <span key={k} className={`h-1.5 flex-1 rounded ${k <= i ? 'bg-yellow-400' : 'bg-slate-600'}`} />)}
      </div>
      <div className="flex justify-between">
        <button className={btn} disabled={i === 0} onClick={() => setI(i - 1)}>← Back</button>
        <button className="px-3 py-1 rounded bg-violet-600 hover:bg-violet-500" onClick={() => (last ? finish() : setI(i + 1))}>{last ? 'Finish' : 'Next →'}</button>
      </div>
    </div>
  );
}

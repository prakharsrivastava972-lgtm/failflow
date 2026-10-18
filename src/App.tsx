import { useState } from 'react';
import Overview from './Overview';
import Simulator from './Simulator';
import SpofPanel from './SpofPanel';
import MitigationLab from './MitigationLab';
import HistoryPanel from './HistoryPanel';
import ProjectBar from './ProjectBar';
import { useUndo } from './undo';

type Tab = 'home' | 'sim' | 'spof' | 'lab' | 'history';

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const { past, future, undo, redo } = useUndo();
  const btn = (t: Tab, label: string) => (
    <button onClick={() => setTab(t)} aria-current={tab === t}
      className={`px-3 py-1 rounded ${tab === t ? 'bg-violet-600' : 'bg-slate-800 hover:bg-slate-700'}`}>{label}</button>
  );
  const toSim = () => setTab('sim');
  const small = 'px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40';
  return (
    <div className="h-screen flex flex-col bg-slate-900 text-slate-100 relative">
      <nav className="flex flex-wrap items-center gap-2 p-2 border-b border-slate-700 text-sm">
        <span className="font-bold px-2">FailFlow</span>
        {btn('home', 'Overview')}
        {btn('sim', 'Failure Simulator')}
        {btn('spof', 'Critical Components')}
        {btn('lab', 'Mitigation Lab')}
        {btn('history', 'Scenario History')}
        <button className={small} onClick={undo} disabled={!past.length} aria-label="Undo" title="Undo">↶ Undo</button>
        <button className={small} onClick={redo} disabled={!future.length} aria-label="Redo" title="Redo">↷ Redo</button>
        <ProjectBar />
      </nav>
      <div className="flex-1 min-h-0">
        {tab === 'home' && <Overview onRun={toSim} onBuild={toSim} />}
        {tab === 'sim' && <Simulator />}
        {tab === 'spof' && <SpofPanel onOpen={toSim} />}
        {tab === 'lab' && <MitigationLab onOpen={toSim} />}
        {tab === 'history' && <HistoryPanel onOpen={toSim} />}
      </div>
    </div>
  );
}

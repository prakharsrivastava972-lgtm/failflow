import { useState } from 'react';
import Simulator from './Simulator';
import SpofPanel from './SpofPanel';
import MitigationLab from './MitigationLab';
import HistoryPanel from './HistoryPanel';
import ProjectBar from './ProjectBar';

type Tab = 'sim' | 'spof' | 'lab' | 'history';

export default function App() {
  const [tab, setTab] = useState<Tab>('sim');
  const btn = (t: Tab, label: string) => (
    <button onClick={() => setTab(t)} aria-current={tab === t}
      className={`px-3 py-1 rounded ${tab === t ? 'bg-violet-600' : 'bg-slate-800 hover:bg-slate-700'}`}>{label}</button>
  );
  const toSim = () => setTab('sim');
  return (
    <div className="h-screen flex flex-col bg-slate-900 text-slate-100 relative">
      <nav className="flex flex-wrap items-center gap-2 p-2 border-b border-slate-700 text-sm">
        <span className="font-bold px-2">FailFlow</span>
        {btn('sim', 'Failure Simulator')}
        {btn('spof', 'Critical Components')}
        {btn('lab', 'Mitigation Lab')}
        {btn('history', 'Scenario History')}
        <ProjectBar />
      </nav>
      <div className="flex-1 min-h-0">
        {tab === 'sim' && <Simulator />}
        {tab === 'spof' && <SpofPanel onOpen={toSim} />}
        {tab === 'lab' && <MitigationLab onOpen={toSim} />}
        {tab === 'history' && <HistoryPanel onOpen={toSim} />}
      </div>
    </div>
  );
}

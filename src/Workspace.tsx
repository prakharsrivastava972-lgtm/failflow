import { useState } from 'react';
import { LogOut, Redo2, Undo2, User } from 'lucide-react';
import Overview from './Overview';
import Simulator from './Simulator';
import SpofPanel from './SpofPanel';
import MitigationLab from './MitigationLab';
import HistoryPanel from './HistoryPanel';
import ProjectBar from './ProjectBar';
import Tour, { TOUR_KEY, type TabId } from './Tour';
import { useUndo } from './undo';

const TABS: [TabId, string][] = [
  ['home', 'Overview'], ['sim', 'Failure Simulator'], ['spof', 'Critical Components'], ['lab', 'Mitigation Lab'], ['history', 'Scenario History'],
];

export default function Workspace({ userName, onLogout }: { userName: string; onLogout: () => void }) {
  const [tab, setTab] = useState<TabId>('home');
  const [tour, setTour] = useState<boolean>(() => {
    try { return localStorage.getItem(TOUR_KEY) !== '1'; } catch { return true; } // first visit => show the tour
  });
  const { past, future, undo, redo } = useUndo();
  const toSim = () => setTab('sim');
  const icon = 'h-8 w-8 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800';

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-slate-100 relative">
      <nav className="flex items-center gap-3 px-3 py-2 border-b border-slate-700 text-sm">
        <span className="font-bold text-lg bg-linear-to-r from-yellow-300 to-white bg-clip-text text-transparent shrink-0">FailFlow</span>

        <div className="flex items-center gap-1 overflow-x-auto min-w-0 flex-1" role="tablist" aria-label="Sections">
          {TABS.map(([t, label]) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded whitespace-nowrap shrink-0 ${tab === t ? 'bg-violet-600' : 'bg-slate-800 hover:bg-slate-700'}`}>{label}</button>
          ))}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button className={icon} onClick={undo} disabled={!past.length} aria-label="Undo" title="Undo"><Undo2 size={16} aria-hidden="true" /></button>
          <button className={icon} onClick={redo} disabled={!future.length} aria-label="Redo" title="Redo"><Redo2 size={16} aria-hidden="true" /></button>
          <ProjectBar />
          <button className={`${icon} font-bold`} onClick={() => setTour(true)} aria-label="Open step-by-step guide" title="Step-by-step guide">?</button>
          <span className="hidden md:flex items-center gap-1 pl-2 ml-1 border-l border-slate-700 text-slate-200" title="Signed in on this browser">
            <User size={14} aria-hidden="true" /> {userName}
          </span>
          <button className={icon} onClick={onLogout} aria-label="Log out" title="Log out"><LogOut size={16} aria-hidden="true" /></button>
        </div>
      </nav>

      <div className="flex-1 min-h-0">
        {tab === 'home' && <Overview onRun={toSim} onBuild={toSim} />}
        {tab === 'sim' && <Simulator />}
        {tab === 'spof' && <SpofPanel onOpen={toSim} />}
        {tab === 'lab' && <MitigationLab onOpen={toSim} />}
        {tab === 'history' && <HistoryPanel onOpen={toSim} />}
      </div>
      <Tour open={tour} onClose={() => setTour(false)} goTo={setTab} />
    </div>
  );
}

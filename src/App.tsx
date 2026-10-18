import { useState } from 'react';
import Workspace from './Workspace';
import Landing from './Landing';
import Login, { type Mode } from './Login';
import { useAuth } from './auth';

export default function App() {
  const { user, logOut, guest } = useAuth();
  const [view, setView] = useState<'landing' | Mode>('landing');

  if (user) {
    return <Workspace userName={user.guest ? 'Guest' : user.name} onLogout={() => { logOut(); setView('landing'); }} />;
  }
  if (view === 'landing') {
    return <Landing onLogin={() => setView('login')} onSignup={() => setView('signup')} onGuest={guest} />;
  }
  return <Login mode={view} setMode={setView} onBack={() => setView('landing')} />;
}

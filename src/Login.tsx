import { useState } from 'react';
import { useAuth } from './auth';

export type Mode = 'login' | 'signup';

export default function Login({ mode, setMode, onBack }: { mode: Mode; setMode: (m: Mode) => void; onBack: () => void }) {
  const { logIn, signUp, guest } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const signup = mode === 'signup';
  const field = 'w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 focus:outline-none focus:border-yellow-400';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const err = signup ? await signUp(name, email, password) : await logIn(email, password);
      if (err) setError(err); // on success the store sets the user and the app switches screens
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">
      <button onClick={onBack} className="mb-4 text-sm text-slate-300 hover:text-white underline">← Back to home</button>
      <div className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-5">
        <div className="text-center space-y-1">
          <div className="text-2xl font-bold bg-linear-to-r from-yellow-300 to-white bg-clip-text text-transparent">FailFlow</div>
          <h1 className="text-lg font-semibold">{signup ? 'Create your account' : 'Welcome back'}</h1>
        </div>

        <form onSubmit={submit} className="space-y-3" noValidate>
          {signup && (
            <label className="block text-sm space-y-1"><span>Name</span>
              <input className={field} value={name} onChange={e => setName(e.target.value)} autoComplete="name" maxLength={40} required /></label>
          )}
          <label className="block text-sm space-y-1"><span>Email</span>
            <input className={field} type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required /></label>
          <label className="block text-sm space-y-1"><span>Password{signup && ' (at least 8 characters)'}</span>
            <input className={field} type="password" value={password} onChange={e => setPassword(e.target.value)}
              autoComplete={signup ? 'new-password' : 'current-password'} maxLength={128} required /></label>
          {error && <p role="alert" className="text-sm text-red-300 bg-red-950 border border-red-700 rounded p-2">{error}</p>}
          <button type="submit" disabled={busy} className="w-full py-2 rounded bg-violet-600 hover:bg-violet-500 disabled:opacity-50">
            {busy ? 'Please wait…' : signup ? 'Create account' : 'Log in'}
          </button>
        </form>

        <p className="text-sm text-center text-slate-300">
          {signup ? 'Already have an account? ' : 'New to FailFlow? '}
          <button onClick={() => { setMode(signup ? 'login' : 'signup'); setError(null); }} className="underline text-yellow-300">
            {signup ? 'Log in' : 'Create an account'}
          </button>
        </p>

        <div className="border-t border-slate-700 pt-4 space-y-2">
          <button onClick={guest} className="w-full py-2 rounded border border-slate-500 hover:bg-slate-700">Continue as guest</button>
          <p className="text-xs text-slate-400">
            Demo login: accounts are stored only in this browser, with the password salted and hashed. This is not a secure authentication
            system, so do not reuse a real password. Your work is saved in this browser too.
          </p>
        </div>
      </div>
    </div>
  );
}

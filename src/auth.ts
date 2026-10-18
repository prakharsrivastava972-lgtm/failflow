import { create } from 'zustand';

export interface User { name: string; email: string; guest: boolean }
type Account = { name: string; salt: string; hash: string };

const ACCOUNTS = 'failflow:accounts:v1';
const SESSION = 'failflow:session:v1';

function read<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
function write(key: string, value: unknown): boolean {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

const toHex = (u: Uint8Array) => Array.from(u, x => x.toString(16).padStart(2, '0')).join('');

/** Salted PBKDF2-SHA256. The password itself is never stored. */
async function derive(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', iterations: 150000, salt: enc.encode(salt) }, key, 256);
  return toHex(new Uint8Array(bits));
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function loadSession(): User | null {
  const s = read<Partial<User> | null>(SESSION, null);
  return s && typeof s.name === 'string' && typeof s.email === 'string' ? { name: s.name, email: s.email, guest: s.guest === true } : null;
}

interface AuthState {
  user: User | null;
  signUp: (name: string, email: string, password: string) => Promise<string | null>;
  logIn: (email: string, password: string) => Promise<string | null>;
  guest: () => void;
  logOut: () => void;
}

export const useAuth = create<AuthState>(set => ({
  user: loadSession(),
  signUp: async (name, email, password) => {
    const n = name.trim(), e = email.trim().toLowerCase();
    if (!n || n.length > 40) return 'Enter a name (up to 40 characters).';
    if (!EMAIL.test(e)) return 'Enter a valid email address.';
    if (password.length < 8 || password.length > 128) return 'Password must be 8 to 128 characters.';
    const accounts = read<Record<string, Account>>(ACCOUNTS, {});
    if (accounts[e]) return 'An account with this email already exists in this browser.';
    const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
    accounts[e] = { name: n, salt, hash: await derive(password, salt) };
    if (!write(ACCOUNTS, accounts)) return 'Could not save the account (browser storage is unavailable).';
    const user = { name: n, email: e, guest: false };
    write(SESSION, user);
    set({ user });
    return null;
  },
  logIn: async (email, password) => {
    const e = email.trim().toLowerCase();
    const acc = read<Record<string, Account>>(ACCOUNTS, {})[e];
    // Same message for unknown email and wrong password.
    if (!acc || (await derive(password, acc.salt)) !== acc.hash) return 'Incorrect email or password.';
    const user = { name: acc.name, email: e, guest: false };
    write(SESSION, user);
    set({ user });
    return null;
  },
  guest: () => {
    const user = { name: 'Guest', email: '', guest: true };
    write(SESSION, user);
    set({ user });
  },
  logOut: () => {
    try { localStorage.removeItem(SESSION); } catch { /* ignore */ }
    set({ user: null });
  },
}));

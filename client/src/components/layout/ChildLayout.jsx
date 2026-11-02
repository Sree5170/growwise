import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Compass, Lock, Puzzle, Rocket, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { avatarEmoji } from '../../utils/constants.js';
import { LogoMark } from '../navigation/Logo.jsx';
import Modal from '../modals/Modal.jsx';
import { Field, ErrorSummary } from '../forms/Field.jsx';
import Button from '../ui/Button.jsx';
import { useNavigate } from 'react-router-dom';

const tabs = [['/child/dashboard', 'Today', Rocket], ['/activities', 'Ideas', Compass], ['/games', 'Brain games', Puzzle], ['/safety-academy', 'Safety', ShieldAlert]];

export default function ChildLayout() {
  const { child, exitChildMode } = useAuth();
  const [gate, setGate] = useState(false); const [pw, setPw] = useState(''); const [err, setErr] = useState(null); const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try { await exitChildMode(pw); navigate('/parent/dashboard'); } catch (x) { setErr(x); } finally { setBusy(false); }
  };
  return (
    <div className={`min-h-screen bg-gradient-to-b from-sky-50 via-paper to-mint-50 ${child?.accessibilityPreferences?.largeText ? 'text-lg' : ''}`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">Skip to content</a>
      <header className="sticky top-0 z-30 border-b border-ink/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3"><LogoMark className="h-9 w-9" />
            <p className="font-display text-lg font-extrabold"><span aria-hidden="true">{avatarEmoji(child?.avatar)} </span>{child?.displayName}</p></div>
          <button type="button" onClick={() => { setGate(true); setErr(null); setPw(''); }} className="btn-ghost text-sm"><Lock className="h-4 w-4" aria-hidden="true" />Grown-ups</button>
        </div>
        <nav aria-label="Child navigation" className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-3 pb-2">
          {tabs.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold ${isActive ? 'bg-mint-700 text-white' : 'text-ink-soft hover:bg-mint-50'}`}>
              <Icon className="h-5 w-5" aria-hidden="true" />{label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main id="main" className="mx-auto max-w-5xl px-4 py-6"><Outlet /></main>
      <Modal open={gate} onClose={() => setGate(false)} title="Grown-ups only">
        <form onSubmit={submit} noValidate>
          <p className="mb-4 text-ink-soft">Enter the parent account password to go back to the parent area.</p>
          <ErrorSummary error={err} />
          <Field label="Parent password" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} required />
          <div className="mt-5 flex justify-end gap-2"><Button variant="secondary" onClick={() => setGate(false)}>Cancel</Button><Button type="submit" loading={busy} disabled={!pw}>Continue</Button></div>
        </form>
      </Modal>
    </div>
  );
}

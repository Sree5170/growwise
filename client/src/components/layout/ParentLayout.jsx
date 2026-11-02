import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { BarChart3, Compass, LayoutDashboard, ListChecks, LogOut, Menu, Puzzle, Settings, ShieldAlert, Users, X } from 'lucide-react';
import Logo from '../navigation/Logo.jsx';
import ChildSwitcher from '../navigation/ChildSwitcher.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const nav = [
  ['/parent/dashboard', 'Dashboard', LayoutDashboard], ['/parent/children', 'Children', Users], ['/parent/tasks', 'Tasks', ListChecks],
  ['/activities', 'Activity library', Compass], ['/games', 'Brain games', Puzzle], ['/safety-academy', 'Safety Academy', ShieldAlert],
  ['/parent/progress', 'Progress', BarChart3], ['/parent/settings', 'Settings', Settings],
];

function NavList({ onNavigate }) {
  return (
    <nav aria-label="Parent navigation" className="flex flex-col gap-1">
      {nav.map(([to, label, Icon]) => (
        <NavLink key={to} to={to} onClick={onNavigate} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${isActive ? 'bg-mint-700 text-white' : 'text-ink-soft hover:bg-mint-50'}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />{label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function ParentLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  useEffect(() => { setOpen(false); }, [pathname]);
  return (
    <div className="min-h-screen lg:flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">Skip to content</a>
      <aside className="no-print hidden w-64 shrink-0 flex-col border-r border-ink/5 bg-white p-4 lg:flex lg:h-screen lg:sticky lg:top-0">
        <div className="mb-5 px-1"><Logo to="/parent/dashboard" /></div>
        <ChildSwitcher />
        <div className="mt-5 flex-1 overflow-y-auto"><NavList /></div>
        <div className="mt-4 border-t border-ink/5 pt-4">
          <p className="truncate px-1 text-sm font-semibold">{user?.name}</p>
          <button type="button" onClick={logout} className="btn-ghost mt-1 w-full justify-start"><LogOut className="h-5 w-5" aria-hidden="true" />Log out</button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-ink/5 bg-paper/90 px-4 py-3 backdrop-blur lg:hidden">
          <Logo to="/parent/dashboard" />
          <button type="button" className="rounded-lg p-2" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="parent-drawer" onClick={() => setOpen((o) => !o)}>{open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button>
        </header>
        {open && (
          <div id="parent-drawer" className="no-print fixed inset-x-0 top-[57px] z-20 max-h-[calc(100vh-57px)] overflow-y-auto border-b border-ink/10 bg-white p-4 shadow-lift lg:hidden">
            <div className="mb-4"><ChildSwitcher /></div>
            <NavList onNavigate={() => setOpen(false)} />
            <button type="button" onClick={logout} className="btn-ghost mt-3 w-full justify-start"><LogOut className="h-5 w-5" aria-hidden="true" />Log out</button>
          </div>
        )}
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8"><Outlet /></main>
      </div>
    </div>
  );
}
export { Link };

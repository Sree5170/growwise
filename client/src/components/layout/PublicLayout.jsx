import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from '../navigation/Logo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useEffect } from 'react';

const links = [['/about', 'About'], ['/features', 'Features'], ['/how-it-works', 'How it works']];

export default function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { user, isChild } = useAuth();
  const { pathname } = useLocation();
  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [pathname]);
  const home = user ? (isChild ? '/child/dashboard' : '/parent/dashboard') : '/login';
  const link = ({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? 'bg-mint-100 text-mint-800' : 'text-ink-soft hover:bg-ink/5'}`;
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">Skip to content</a>
      <header className="sticky top-0 z-30 border-b border-ink/5 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {links.map(([to, label]) => <NavLink key={to} to={to} className={link}>{label}</NavLink>)}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            {user ? <Link to={home} className="btn-primary">Open dashboard</Link> : <><Link to="/login" className="btn-ghost">Log in</Link><Link to="/register" className="btn-primary">Get started</Link></>}
          </div>
          <button type="button" className="rounded-lg p-2 md:hidden" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((o) => !o)}>
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
        {open && (
          <nav id="mobile-menu" aria-label="Mobile" className="flex flex-col gap-1 border-t border-ink/5 px-4 py-3 md:hidden">
            {links.map(([to, label]) => <NavLink key={to} to={to} className={link}>{label}</NavLink>)}
            {user ? <Link to={home} className="btn-primary mt-2">Open dashboard</Link> : <div className="mt-2 flex gap-2"><Link to="/login" className="btn-secondary flex-1">Log in</Link><Link to="/register" className="btn-primary flex-1">Get started</Link></div>}
          </nav>
        )}
      </header>
      <main id="main" className="flex-1"><Outlet /></main>
      <footer className="border-t border-ink/5 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} GrowWise — a college minor project.</p>
          <nav aria-label="Footer" className="flex flex-wrap gap-4"><Link to="/privacy" className="hover:underline">Privacy policy</Link><Link to="/about" className="hover:underline">About</Link><Link to="/features" className="hover:underline">Features</Link></nav>
        </div>
      </footer>
    </div>
  );
}

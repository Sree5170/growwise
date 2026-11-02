import { Link } from 'react-router-dom';
import { ArrowRight, HeartHandshake, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { CATEGORIES } from '../../utils/constants.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useAuth } from '../../context/AuthContext.jsx';

// Decorative adventure trail: purely illustrative (no data).
function Trail() {
  const stops = [[60, 250, '🌱', 'bg-mint-200'], [170, 150, '🏃', 'bg-sun-200'], [290, 215, '🧩', 'bg-sky-200'], [400, 105, '🎨', 'bg-coral-200'], [510, 170, '🛟', 'bg-mint-200']];
  return (
    <div className="relative mx-auto aspect-[570/320] w-full max-w-lg" aria-hidden="true">
      <svg viewBox="0 0 570 320" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path d="M60 250 C110 230 130 160 170 150 S250 235 290 215 S360 100 400 105 S470 175 510 170" fill="none" stroke="#1a6a4f" strokeWidth="6" strokeLinecap="round" strokeDasharray="2 16" opacity=".5" />
      </svg>
      {stops.map(([x, y, emoji, bg], i) => (
        <span key={i} className={`absolute grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-white text-3xl shadow-lift ${bg}`} style={{ left: `${(x / 570) * 100}%`, top: `${(y / 320) * 100}%` }}>{emoji}</span>
      ))}
      <span className="absolute right-0 top-0 hidden rounded-2xl sm:block bg-white px-4 py-3 text-sm font-bold shadow-card">Today’s Adventure ✨</span>
      <span className="absolute bottom-0 left-0 hidden rounded-2xl sm:block bg-white px-4 py-3 text-sm font-bold shadow-card">Real-world missions</span>
    </div>
  );
}

export default function Landing() {
  useDocumentTitle();
  const { user, isChild } = useAuth();
  const home = isChild ? '/child/dashboard' : '/parent/dashboard';
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-mint-50 to-paper">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-sun-100 px-3.5 py-1.5 text-sm font-bold text-sun-700"><Sparkles className="h-4 w-4" aria-hidden="true" />Smart parenting, made playful</p>
            <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">Turn everyday growing up into an <span className="text-mint-700">adventure</span>.</h1>
            <p className="mt-5 max-w-xl text-lg text-ink-soft">GrowWise helps parents encourage movement, curiosity, creativity, life skills and safety awareness — with offline missions, brain games and gentle rewards that never push for more screen time.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {user ? <Link to={home} className="btn-primary px-6 py-3 text-base">Open dashboard<ArrowRight className="h-5 w-5" aria-hidden="true" /></Link>
                : <><Link to="/register" className="btn-primary px-6 py-3 text-base">Create a free parent account<ArrowRight className="h-5 w-5" aria-hidden="true" /></Link>
                  <Link to="/how-it-works" className="btn-secondary px-6 py-3 text-base">See how it works</Link></>}
            </div>
          </div>
          <Trail />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="pillars">
        <h2 id="pillars" className="text-3xl font-extrabold">Seven ways to grow, one friendly place</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">Every activity is age-appropriate, includes clear steps and safety notes, and rewards effort — not speed.</p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <li key={c.value} className="card flex items-center gap-3 p-4"><span className="grid h-12 w-12 place-items-center rounded-xl bg-mint-50 text-2xl" aria-hidden="true">{c.emoji}</span><span className="font-bold">{c.label}</span></li>
          ))}
        </ul>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-3">
          {[[HeartHandshake, 'Parent-guided', 'Parents assign missions, review submissions and decide what earns rewards. Children never verify their own work.'],
            [ShieldCheck, 'Safety-first', 'Disaster-preparedness lessons with quizzes and printable checklists. Clearly an educational exercise, never a live alert.'],
            [Lock, 'Private by design', 'No child email, photos or location tracking. Only a nickname and age group. Delete everything at any time.']].map(([Icon, t, d]) => (
            <div key={t} className="rounded-xl2 bg-mint-50 p-6"><Icon className="mb-3 h-8 w-8 text-mint-700" aria-hidden="true" /><h3 className="text-xl font-bold">{t}</h3><p className="mt-1.5 text-ink-soft">{d}</p></div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 text-center">
        <h2 className="text-3xl font-extrabold">Ready for the first mission?</h2>
        <p className="mx-auto mt-2 max-w-xl text-ink-soft">Create a parent account, add a child profile and assign a first activity in a few minutes.</p>
        {!user && <Link to="/register" className="btn-primary mt-6 px-6 py-3 text-base">Get started</Link>}
      </section>
    </>
  );
}

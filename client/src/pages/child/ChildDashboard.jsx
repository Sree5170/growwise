import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Clock, Footprints, Lock, ShieldAlert, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { childService } from '../../services/childService.js';
import { taskService } from '../../services/taskService.js';
import { AsyncBoundary, CardSkeleton, EmptyState } from '../../components/feedback/Feedback.jsx';
import { Pill, ProgressBar, Section } from '../../components/ui/Bits.jsx';
import Button from '../../components/ui/Button.jsx';
import ActivityCard from '../../components/cards/ActivityCard.jsx';
import ActivityDetailModal from '../../components/modals/ActivityDetailModal.jsx';
import LogPhysicalModal from '../../components/modals/LogPhysicalModal.jsx';
import { Field, ErrorSummary } from '../../components/forms/Field.jsx';
import { categoryInfo, DIFFICULTY_LABELS, STATUS_LABELS } from '../../utils/constants.js';
import { greeting } from '../../utils/format.js';

function MissionCard({ task, onOpen }) {
  const a = task.activity; const cat = categoryInfo(a?.category);
  const done = task.status === 'approved'; const waiting = task.status === 'submitted';
  return (
    <li>
      <button type="button" onClick={() => onOpen(task)} className={`card flex w-full items-center gap-4 p-4 text-left transition-shadow hover:shadow-lift ${done ? 'opacity-80' : ''}`}>
        <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-3xl ${done ? 'bg-mint-100' : 'bg-sun-100'}`} aria-hidden="true">{done ? '✅' : cat.emoji}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-extrabold leading-tight">{a?.title}</span>
          <span className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
            <Pill tone={cat.tone}>{cat.label}</Pill><Pill>{DIFFICULTY_LABELS[a?.difficulty]}</Pill>
            <span className="inline-flex items-center gap-1 text-ink-soft"><Clock className="h-4 w-4" aria-hidden="true" />{a?.durationMinutes} min</span>
            <span className="inline-flex items-center gap-1 font-bold text-sun-700"><Star className="h-4 w-4" aria-hidden="true" />{a?.points}</span>
          </span>
          {(waiting || task.status === 'needs-revision' || done) && <span className={`mt-2 block text-sm font-bold ${task.status === 'needs-revision' ? 'text-coral-700' : 'text-mint-800'}`}>{STATUS_LABELS[task.status]}{task.status === 'needs-revision' && task.parentNote ? `: ${task.parentNote}` : ''}</span>}
        </span>
      </button>
    </li>
  );
}

function MissionModal({ task, onClose, onSubmitted }) {
  const [note, setNote] = useState(''); const [mins, setMins] = useState(''); const [error, setError] = useState(null); const [busy, setBusy] = useState(false);
  if (!task) return null;
  const canSubmit = ['assigned', 'needs-revision'].includes(task.status);
  const submit = async () => {
    setBusy(true); setError(null);
    try {
      await taskService.submit(task._id, { childNote: note.trim(), ...(mins !== '' ? { minutesSpent: Number(mins) } : {}) });
      toast.success('Great work! A grown-up will take a look.', { icon: '🌟', duration: 5000 }); setNote(''); setMins(''); onSubmitted(); onClose();
    } catch (e) { setError(e); } finally { setBusy(false); }
  };
  return (
    <ActivityDetailModal activity={task.activity} onClose={onClose} footer={
      <div className="space-y-4 border-t border-ink/10 pt-4">
        {task.parentNote && <p className="rounded-xl bg-sky-50 p-3 text-sm"><span className="font-bold">Note from your grown-up: </span>{task.parentNote}</p>}
        {canSubmit ? (
          <>
            <ErrorSummary error={error} />
            <Field as="textarea" label="Tell us how it went (optional)" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
            <Field type="number" label="Minutes it took (optional)" min={0} max={480} value={mins} onChange={(e) => setMins(e.target.value)} />
            <Button className="w-full py-3 text-base" loading={busy} onClick={submit}>I did it! Ask a grown-up to check</Button>
          </>
        ) : <p className="font-bold text-mint-800">{STATUS_LABELS[task.status]}</p>}
      </div>} />
  );
}

export default function ChildDashboard() {
  useDocumentTitle('Today’s Adventure');
  const { child } = useAuth();
  const id = child?._id;
  const start = new Date(); start.setHours(0, 0, 0, 0); const end = new Date(); end.setHours(23, 59, 59, 999);
  const summary = useAsync(() => childService.get(id), [id], { enabled: !!id });
  const today = useAsync(() => taskService.list({ from: start.toISOString(), to: end.toISOString(), limit: 50 }), [id], { enabled: !!id });
  const retry = useAsync(() => taskService.list({ status: 'needs-revision', limit: 20 }), [id], { enabled: !!id });
  const recs = useAsync(() => childService.recommendations(id, { limit: 3 }), [id], { enabled: !!id });
  const badges = useAsync(() => childService.badges(id), [id], { enabled: !!id });
  const [mission, setMission] = useState(null); const [idea, setIdea] = useState(null); const [log, setLog] = useState(false);
  const reload = () => [summary, today, retry, badges].forEach((s) => s.reload());
  const s = summary.data?.summary;
  const retryOutsideToday = (retry.data?.data || []).filter((t) => !(today.data?.data || []).some((x) => x._id === t._id));

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-mint-700 p-6 text-white shadow-lift">
        <p className="font-semibold text-mint-100">{greeting()}, {child?.displayName}!</p>
        <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">Today’s Adventure</h1>
        {s ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="flex items-center justify-between text-sm font-bold"><span>Level {s.points.level} · {s.points.name}</span><span>{s.points.total} points</span></p>
              <ProgressBar className="mt-2 [&>div]:bg-white/25" tone="sun" value={s.points.pointsIntoLevel} max={s.points.pointsForNextLevel} label="Progress to the next level" />
              <p className="mt-1.5 text-sm text-mint-100">{s.points.pointsForNextLevel - s.points.pointsIntoLevel} more points to level {s.points.level + 1}</p>
            </div>
            <div>
              <p className="flex items-center justify-between text-sm font-bold"><span>Today’s missions</span><span>{s.today.done} / {s.today.total}</span></p>
              <ProgressBar className="mt-2 [&>div]:bg-white/25" tone="sun" value={s.today.percent} label="Today’s mission progress" />
              <p className="mt-1.5 text-sm text-mint-100">{s.today.total === 0 ? 'No missions yet — ask a grown-up to add some!' : s.today.percent === 100 ? 'All done for today. Amazing! 🎉' : 'Keep going, one step at a time.'}</p>
            </div>
          </div>) : <div className="mt-5 h-16" aria-hidden="true" />}
        {s && <ol aria-label="Level path" className="mt-6 flex items-center gap-1.5 overflow-x-auto px-1 py-1.5">
          {Array.from({ length: 8 }, (_, i) => i + 1).map((lv) => <li key={lv} className="flex items-center gap-1.5">
            <span className={`grid h-9 w-9 place-items-center rounded-full text-sm font-extrabold ${lv < s.points.level ? 'bg-sun-300 text-ink' : lv === s.points.level ? 'bg-white text-mint-800 ring-4 ring-sun-300' : 'bg-white/20 text-white'}`} aria-label={`Level ${lv}${lv === s.points.level ? ', current' : lv < s.points.level ? ', reached' : ', locked'}`}>{lv < s.points.level ? '✓' : lv}</span>
            {lv < 8 && <span className="h-1 w-5 rounded bg-white/30" aria-hidden="true" />}</li>)}
        </ol>}
      </section>

      <Section title="My missions">
        <AsyncBoundary state={today} skeleton={<CardSkeleton lines={3} />}>
          {(r) => (r.data.length === 0 && retryOutsideToday.length === 0) ? (
            <EmptyState emoji="🧭" title="No missions today">Ask a grown-up to add a mission, or look at the ideas below.</EmptyState>
          ) : <ul className="space-y-3">{[...retryOutsideToday, ...r.data].map((t) => <MissionCard key={t._id} task={t} onOpen={setMission} />)}</ul>}
        </AsyncBoundary>
      </Section>

      <section aria-label="Quick access" className="grid gap-3 sm:grid-cols-3">
        {[[Brain, 'Brain games', 'Puzzles and memory fun', '/games', 'bg-sky-100 text-sky-700'], [ShieldAlert, 'Safety lessons', 'Be ready and stay safe', '/safety-academy', 'bg-coral-100 text-coral-700']].map(([Icon, t, d, to, tone]) => (
          <Link key={to} to={to} className="card flex items-center gap-3 p-4 hover:shadow-lift"><span className={`grid h-12 w-12 place-items-center rounded-xl ${tone}`}><Icon className="h-6 w-6" aria-hidden="true" /></span><span><span className="block font-extrabold">{t}</span><span className="text-sm text-ink-soft">{d}</span></span></Link>))}
        <button type="button" onClick={() => setLog(true)} className="card flex items-center gap-3 p-4 text-left hover:shadow-lift"><span className="grid h-12 w-12 place-items-center rounded-xl bg-mint-100 text-mint-700"><Footprints className="h-6 w-6" aria-hidden="true" /></span><span><span className="block font-extrabold">I moved today</span><span className="text-sm text-ink-soft">Log your active time</span></span></button>
      </section>

      <Section title="Offline ideas for you" action={<Link to="/activities" className="text-sm font-bold text-mint-700 underline">More ideas</Link>}>
        <AsyncBoundary state={recs} skeleton={<CardSkeleton lines={3} />}>
          {(r) => r.recommendations.length === 0 ? <EmptyState emoji="💡" title="No ideas right now">Check back soon!</EmptyState> : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{r.recommendations.map((x) => <ActivityCard key={x.activity._id} activity={x.activity} compact reason={x.reason} onOpen={setIdea}
              action={<p className="flex items-center gap-1.5 text-sm text-ink-soft"><Lock className="h-4 w-4" aria-hidden="true" />Ask a grown-up to add it</p>} />)}</div>)}
        </AsyncBoundary>
      </Section>

      <Section title="My badges">
        <AsyncBoundary state={badges} skeleton={<CardSkeleton lines={2} />}>
          {(r) => (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {r.badges.map((b) => (
                <li key={b.id} className={`card p-4 text-center ${b.earned ? '' : 'bg-ink/[0.04]'}`}>
                  <span className={`mx-auto grid h-14 w-14 place-items-center rounded-full text-3xl ${b.earned ? 'bg-sun-100 animate-pop' : 'bg-ink/10 grayscale'}`} aria-hidden="true">{b.emoji}</span>
                  <p className="mt-2 font-extrabold leading-tight">{b.name}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">{b.earned ? 'Earned!' : b.description}</p>
                  <span className="sr-only">{b.earned ? 'Earned' : 'Not earned yet'}</span>
                </li>))}
            </ul>)}
        </AsyncBoundary>
      </Section>

      <MissionModal task={mission} onClose={() => setMission(null)} onSubmitted={reload} />
      <ActivityDetailModal activity={idea} onClose={() => setIdea(null)} />
      <LogPhysicalModal open={log} onClose={() => setLog(false)} isParent={false} onSaved={reload} />
    </div>
  );
}


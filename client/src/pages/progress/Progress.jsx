import { useState } from 'react';
import { Printer, Plus, Trash2, BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useChildren } from '../../context/ChildrenContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { progressService } from '../../services/progressService.js';
import { childService } from '../../services/childService.js';
import { AsyncBoundary, CardSkeleton, EmptyState } from '../../components/feedback/Feedback.jsx';
import { PageHeader, Pill, ProgressBar, Section, StatCard } from '../../components/ui/Bits.jsx';
import Button from '../../components/ui/Button.jsx';
import { CategoryBarChart, DailyBarChart, TrendLineChart } from '../../components/charts/Charts.jsx';
import LogPhysicalModal from '../../components/modals/LogPhysicalModal.jsx';
import { ConfirmDialog } from '../../components/modals/Modal.jsx';
import { GAME_LABELS, physicalLabel } from '../../utils/constants.js';
import { fmtDate } from '../../utils/format.js';

const RANGES = [['day', 'Today'], ['week', 'This week'], ['month', 'This month']];

function WeeklyReport({ childId }) {
  const state = useAsync(() => progressService.weeklyReport(childId), [childId]);
  return (
    <Section title="Weekly report" action={<Button variant="secondary" className="no-print" onClick={() => window.print()}><Printer className="h-4 w-4" aria-hidden="true" />Print</Button>}>
      <AsyncBoundary state={state} skeleton={<CardSkeleton lines={4} />}>
        {(r) => (
          <div className="card space-y-4 p-5">
            <p className="text-sm text-ink-soft">{fmtDate(r.from, { day: 'numeric', month: 'short', year: 'numeric' })} – {fmtDate(r.to, { day: 'numeric', month: 'short', year: 'numeric' })} · {r.child.displayName}</p>
            {r.hasData && r.highlights.length ? <ul className="ml-5 list-disc space-y-1">{r.highlights.map((h) => <li key={h}>{h}</li>)}</ul> : <p className="text-ink-soft">No activity recorded yet this week.</p>}
            <div className="grid gap-3 sm:grid-cols-3">
              {[['Missions approved', r.comparison.approvedTasks, ''], ['Movement minutes', r.comparison.physicalMinutes, ' min'], ['Brain game rounds', r.comparison.gameAttempts, '']].map(([l, c, u]) => (
                <div key={l} className="rounded-xl bg-paper p-3"><p className="text-sm text-ink-soft">{l}</p><p className="font-display text-xl font-bold">{c.now}{u}</p>
                  <p className="text-xs text-ink-faint">{c.change === 0 ? 'Same as last week' : `${c.change > 0 ? '+' : ''}${c.change}${u} vs last week`}</p></div>))}
            </div>
            {r.childNotes?.length > 0 && <div><h3 className="mb-1 font-bold">Notes from {r.child.displayName}</h3><ul className="ml-5 list-disc space-y-1 text-sm text-ink-soft">{r.childNotes.map((n, i) => <li key={i}>{n}</li>)}</ul></div>}
            <p className="text-xs text-ink-faint">{r.disclaimer}</p>
          </div>)}
      </AsyncBoundary>
    </Section>
  );
}

export default function Progress() {
  useDocumentTitle('Progress');
  const { selected, list } = useChildren(); const id = selected?._id;
  const [range, setRange] = useState('week'); const [log, setLog] = useState(false); const [del, setDel] = useState(null); const [busy, setBusy] = useState(false);
  const prog = useAsync(() => progressService.progress(id, range), [id, range], { enabled: !!id });
  const phys = useAsync(() => progressService.physical(id, { limit: 8 }), [id], { enabled: !!id });
  const badges = useAsync(() => childService.badges(id), [id], { enabled: !!id });
  const refresh = () => { prog.reload(); phys.reload(); badges.reload(); };
  if (!list.length) return <EmptyState emoji="📊" title="No child selected">Add a child profile to see progress here.</EmptyState>;

  const verify = async (r) => { try { await progressService.verifyPhysical(r._id); toast.success('Marked as parent-verified'); refresh(); } catch (e) { toast.error(e.message); } };
  const remove = async () => { setBusy(true); try { await progressService.removePhysical(del._id); toast('Record deleted'); setDel(null); refresh(); } catch (e) { toast.error(e.message); } finally { setBusy(false); } };

  return (
    <>
      <PageHeader title="Progress" subtitle={`How ${selected.displayName} is growing`} actions={<Button onClick={() => setLog(true)}><Plus className="h-5 w-5" aria-hidden="true" />Log movement</Button>} />
      <div role="group" aria-label="Time range" className="no-print mb-5 inline-flex rounded-xl bg-ink/[0.06] p-1">
        {RANGES.map(([v, l]) => <button key={v} type="button" aria-pressed={range === v} onClick={() => setRange(v)} className={`min-h-[40px] rounded-lg px-4 text-sm font-semibold ${range === v ? 'bg-white shadow-card' : 'text-ink-soft'}`}>{l}</button>)}
      </div>

      <AsyncBoundary state={prog} skeleton={<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>}>
        {(p) => !p.hasData ? (
          <EmptyState emoji="🌱" title="Nothing to show yet" action={<Button onClick={() => setLog(true)}>Log movement</Button>}>Progress is built from real records. Assign and approve missions, log movement, or let {selected.displayName} play a brain game, and charts will appear here.</EmptyState>
        ) : (
          <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Missions approved" value={`${p.tasks.approved} / ${p.tasks.assigned}`} hint={p.tasks.approvalRate == null ? 'None scheduled' : `${p.tasks.approvalRate}% of scheduled`} tone="mint" />
              <StatCard label="Movement logged" value={`${p.physical.totalMinutes} min`} hint={`${p.physical.parentVerifiedMinutes} parent-reported · ${p.physical.selfReportedMinutes} child-reported`} tone="sky" />
              <StatCard label="Brain game rounds" value={p.games.attempts} hint={`${p.safety.completed} of ${p.safety.total} safety lessons done`} tone="coral" />
              <StatCard label="Active days" value={p.streak.activeDaysInRange} hint={`Longest run: ${p.streak.longestRunDays} ${p.streak.longestRunDays === 1 ? 'day' : 'days'}`} tone="sun" />
            </div>
            <p className="-mt-4 text-xs text-ink-faint">{p.streak.note} {p.physical.note}</p>

            {range !== 'day' && (
              <div className="grid gap-4 lg:grid-cols-2">
                <DailyBarChart title="Missions per day" description="Scheduled vs approved" data={p.daily} series={[{ key: 'assigned', name: 'Scheduled', color: 'sky' }, { key: 'approved', name: 'Approved', color: 'mint' }]} summary={`Missions scheduled and approved per day. ${p.tasks.approved} approved of ${p.tasks.assigned}.`} />
                <DailyBarChart title="Movement per day (minutes)" description="Self-reported or parent-reported — not device-measured" data={p.daily} series={[{ key: 'physicalMinutes', name: 'Minutes', color: 'coral' }]} summary={`Logged movement per day, ${p.physical.totalMinutes} minutes in total.`} />
              </div>)}
            <div className="grid gap-4 lg:grid-cols-2">
              <CategoryBarChart title="Time by category" description="Minutes from approved missions" data={p.byCategory} summary="Minutes spent in each activity category from approved missions." />
              <TrendLineChart title="Eight-week trend" description="Approved missions, movement minutes and game rounds" data={p.weeklyTrend} series={[{ key: 'approved', name: 'Approved missions', color: 'mint' }, { key: 'physicalMinutes', name: 'Movement (min)', color: 'coral' }, { key: 'games', name: 'Game rounds', color: 'sky' }]} summary="Weekly totals for the last eight weeks." />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Section title="Brain games"><div className="card divide-y divide-ink/5">
                {p.games.byGame.map((g) => <div key={g.gameType} className="flex items-center justify-between p-4"><span className="font-semibold">{GAME_LABELS[g.gameType]}</span><span className="text-sm text-ink-soft">{g.attempts ? `${g.attempts} ${g.attempts === 1 ? 'round' : 'rounds'}${g.averagePercent != null ? ` · avg ${g.averagePercent}%` : ''}` : 'Not played'}</span></div>)}
                <p className="p-4 text-xs text-ink-faint">Scores show practice and are not a measure of intelligence.</p></div></Section>
              <Section title="Safety lessons"><div className="card p-4">
                <ProgressBar value={p.safety.completed} max={p.safety.total || 1} label="Safety lessons completed" /><ul className="mt-3 grid gap-1.5 sm:grid-cols-2">{p.safety.lessons.map((l) => <li key={l.id} className="flex items-center gap-2 text-sm"><span aria-hidden="true">{l.completed ? '✅' : '⬜'}</span><span className={l.completed ? 'font-semibold' : 'text-ink-soft'}>{l.title}</span><span className="sr-only">{l.completed ? 'completed' : 'not completed'}</span></li>)}</ul>
                <p className="mt-3 text-sm text-ink-soft">Creative missions approved: <strong>{p.creativeAndLifeSkills.creativity}</strong> · Life-skill missions approved: <strong>{p.creativeAndLifeSkills.lifeSkills}</strong></p></div></Section>
            </div>
          </div>)}
      </AsyncBoundary>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Section title="Recent movement records">
          <AsyncBoundary state={phys} skeleton={<CardSkeleton lines={3} />}>
            {(r) => r.records.length === 0 ? <p className="card p-4 text-ink-soft">No movement logged yet.</p> : (
              <ul className="card divide-y divide-ink/5">{r.records.map((rec) => (
                <li key={rec._id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <div><p className="font-semibold">{physicalLabel(rec.activityType)} · {rec.durationMinutes} min</p><p className="text-sm text-ink-soft">{fmtDate(rec.activityDate)}{rec.note ? ` — ${rec.note}` : ''}</p></div>
                  <div className="flex items-center gap-2">
                    {rec.verificationStatus === 'parent-verified' ? <Pill tone="mint"><BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />Parent-reported</Pill> : <><Pill>Child-reported</Pill><Button variant="secondary" onClick={() => verify(rec)}>Verify</Button></>}
                    <Button variant="ghost" aria-label="Delete record" onClick={() => setDel(rec)}><Trash2 className="h-4 w-4 text-coral-600" aria-hidden="true" /></Button>
                  </div></li>))}
              </ul>)}
          </AsyncBoundary>
          <p className="mt-2 text-xs text-ink-faint">Entered by hand. Not measured by a device and not a medical measure.</p>
        </Section>
        <Section title="Badges">
          <AsyncBoundary state={badges} skeleton={<CardSkeleton lines={3} />}>
            {(r) => <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">{r.badges.map((b) => <li key={b.id} className={`card p-3 text-center ${b.earned ? '' : 'bg-ink/[0.04]'}`}><span className={`text-3xl ${b.earned ? '' : 'grayscale'}`} aria-hidden="true">{b.emoji}</span><p className="mt-1 text-sm font-bold leading-tight">{b.name}</p><p className="text-xs text-ink-faint">{b.earned ? 'Earned' : 'Locked'}</p></li>)}</ul>}
          </AsyncBoundary>
        </Section>
      </div>

      <div className="mt-8"><WeeklyReport childId={id} /></div>
      <LogPhysicalModal open={log} onClose={() => setLog(false)} childId={id} isParent onSaved={refresh} />
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={remove} loading={busy} danger confirmLabel="Delete" title="Delete this record?" message="This removes the movement record from reports and charts." />
    </>
  );
}

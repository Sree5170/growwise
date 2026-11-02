import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Award, Brain, Dumbbell, Leaf, ListChecks, Plus, Rocket, UserPlus, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';
import { useChildren } from '../../context/ChildrenContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { childService } from '../../services/childService.js';
import { taskService } from '../../services/taskService.js';
import { progressService } from '../../services/progressService.js';
import { AsyncBoundary, CardSkeleton, EmptyState, ErrorState } from '../../components/feedback/Feedback.jsx';
import { PageHeader, ProgressBar, Section, StatCard } from '../../components/ui/Bits.jsx';
import Button from '../../components/ui/Button.jsx';
import ActivityCard from '../../components/cards/ActivityCard.jsx';
import TaskRow from '../../components/cards/TaskRow.jsx';
import { DailyBarChart } from '../../components/charts/Charts.jsx';
import AssignTaskModal from '../../components/modals/AssignTaskModal.jsx';
import TaskReviewModal from '../../components/modals/TaskReviewModal.jsx';
import { fmtDate, greeting } from '../../utils/format.js';

export default function ParentDashboard() {
  useDocumentTitle('Dashboard');
  const { user, startChildMode } = useAuth();
  const { selected, list, loading: kidsLoading, error: kidsError, reload } = useChildren();
  const navigate = useNavigate();
  const id = selected?._id;
  const [assign, setAssign] = useState(null); const [review, setReview] = useState(null);

  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0); const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
  const summary = useAsync(() => childService.get(id), [id], { enabled: !!id });
  const today = useAsync(() => taskService.list({ childId: id, from: startOfDay.toISOString(), to: endOfDay.toISOString(), limit: 50 }), [id], { enabled: !!id });
  const waiting = useAsync(() => taskService.list({ childId: id, status: 'submitted', limit: 20 }), [id], { enabled: !!id });
  const upcoming = useAsync(() => taskService.list({ childId: id, status: 'assigned', from: startOfDay.toISOString(), limit: 5 }), [id], { enabled: !!id });
  const week = useAsync(() => progressService.progress(id, 'week'), [id], { enabled: !!id });
  const recs = useAsync(() => childService.recommendations(id, { limit: 3 }), [id], { enabled: !!id });
  const refreshAll = () => [summary, today, waiting, upcoming, week, recs].forEach((s) => s.reload());

  if (kidsLoading && !list.length) return <CardSkeleton lines={5} />;
  if (kidsError) return <ErrorState error={kidsError} onRetry={reload} />;
  if (!list.length) return (
    <EmptyState emoji="👋" title={`Welcome, ${user?.name?.split(' ')[0]}!`} action={<Link to="/parent/children?new=1" className="btn-primary"><UserPlus className="h-5 w-5" aria-hidden="true" />Add your first child</Link>}>
      Create a child profile to start assigning missions, tracking progress and exploring safety lessons.
    </EmptyState>
  );

  const openChildMode = async () => { try { await startChildMode(id); navigate('/child/dashboard'); } catch (e) { toast.error(e.message); } };
  const s = summary.data?.summary;

  return (
    <>
      <PageHeader title={`${greeting()}, ${user?.name?.split(' ')[0]}`} subtitle={`Here is how ${selected?.displayName} is doing today.`}
        actions={<>
          <Button onClick={() => setAssign({})}><Plus className="h-5 w-5" aria-hidden="true" />Assign a task</Button>
          <Link to="/parent/children?new=1" className="btn-secondary"><UserPlus className="h-5 w-5" aria-hidden="true" />Add a child</Link>
          <Button variant="secondary" onClick={openChildMode}><Rocket className="h-5 w-5" aria-hidden="true" />Open child mode</Button>
        </>} />

      <AsyncBoundary state={summary} skeleton={<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>}>
        {() => (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard icon={ListChecks} label="Today’s completion" value={`${s.today.percent}%`} hint={s.today.total ? `${s.today.done} of ${s.today.total} missions done or submitted` : 'No missions scheduled today'}>
              <ProgressBar className="mt-3" value={s.today.percent} label="Today’s completion" /></StatCard>
            <StatCard icon={Dumbbell} tone="sky" label="Movement this week" value={`${s.week.physicalMinutes} min`} hint={s.week.goalMinutes ? `Goal: ${s.week.goalMinutes} min (self-reported)` : 'Self-reported minutes'}>
              <ProgressBar className="mt-3" tone="sky" value={s.week.physicalMinutes} max={s.week.goalMinutes || 1} label="Weekly movement goal" /></StatCard>
            <StatCard icon={Leaf} tone="mint" label="Screen-free activities" value={s.week.screenFreeActivities} hint="Approved missions plus logged movement this week" />
            <StatCard icon={Brain} tone="coral" label="Brain game rounds" value={s.week.gameAttempts} hint="Played this week — practice, not an IQ score" />
            <StatCard icon={Award} tone="sun" label="Badges earned" value={`${s.badges.earned} / ${s.badges.total}`} hint={`Level ${s.points.level} · ${s.points.name} · ${s.points.total} points`}>
              <ProgressBar className="mt-3" tone="sun" value={s.points.pointsIntoLevel} max={s.points.pointsForNextLevel} label="Progress to next level" /></StatCard>
            <StatCard icon={ListChecks} tone="sky" label="Approved this week" value={`${s.week.approvedTasks}${s.week.goalTasks ? ` / ${s.week.goalTasks}` : ''}`} hint={s.week.goalTasks ? 'Weekly mission goal' : undefined} />
          </div>
        )}
      </AsyncBoundary>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Section title="Needs your review" action={<Link to="/parent/tasks" className="text-sm font-semibold text-mint-700 underline">All tasks</Link>}>
            <AsyncBoundary state={waiting} skeleton={<CardSkeleton lines={2} />}>
              {(r) => r.data.length === 0 ? <p className="card p-4 text-ink-soft">Nothing is waiting for review. 🎉</p> : (
                <ul className="space-y-3">{r.data.map((t) => <TaskRow key={t._id} task={t} actions={<Button onClick={() => setReview(t)}>Review</Button>} />)}</ul>)}
            </AsyncBoundary>
          </Section>
          <Section title="Today’s missions">
            <AsyncBoundary state={today} skeleton={<CardSkeleton lines={3} />}>
              {(r) => r.data.length === 0 ? <EmptyState emoji="🗓️" title="No missions scheduled today" action={<Button onClick={() => setAssign({})}>Assign a task</Button>}>Pick an activity from the library or the recommendations.</EmptyState>
                : <ul className="space-y-3">{r.data.map((t) => <TaskRow key={t._id} task={t} actions={t.status === 'submitted' ? <Button onClick={() => setReview(t)}>Review</Button> : null} />)}</ul>}
            </AsyncBoundary>
          </Section>
          <AsyncBoundary state={week} skeleton={<CardSkeleton lines={4} />}>
            {(p) => p.hasData ? (
              <DailyBarChart title="This week’s progress" description="Missions scheduled and approved each day" data={p.daily} series={[{ key: 'assigned', name: 'Scheduled', color: 'sky' }, { key: 'approved', name: 'Approved', color: 'mint' }]}
                summary={`Missions scheduled and approved per day. ${p.tasks.approved} of ${p.tasks.assigned} approved this week.`} />
            ) : <EmptyState emoji="📈" title="No progress yet">Charts appear here after you assign and approve missions or log activity.</EmptyState>}
          </AsyncBoundary>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Section title="Recommended for today" action={<Link to="/activities" className="text-sm font-semibold text-mint-700 underline">Browse all</Link>}>
            <AsyncBoundary state={recs} skeleton={<CardSkeleton lines={4} />}>
              {(r) => r.recommendations.length === 0 ? <EmptyState emoji="🔎" title="No suggestions right now">Try adjusting {selected?.displayName}’s available time or materials in their profile.</EmptyState>
                : <div className="space-y-4">{r.recommendations.map((x) => <ActivityCard key={x.activity._id} compact activity={x.activity} reason={x.reason} action={<Button variant="secondary" className="w-full" onClick={() => setAssign({ activity: x.activity })}>Assign</Button>} />)}</div>}
            </AsyncBoundary>
          </Section>
          <Section title="Upcoming reminders">
            <div className="card p-4">
              <p className="mb-2 flex items-center gap-2 text-sm text-ink-soft"><Bell className="h-4 w-4" aria-hidden="true" />
                {user?.notificationPreferences?.dailyReminder ? `Daily reminder preference: ${user.notificationPreferences.reminderTime}` : 'Daily reminders are off'}</p>
              <p className="mb-3 text-xs text-ink-faint">Reminders are shown in the app; email or push delivery is not part of this version.</p>
              <AsyncBoundary state={upcoming} skeleton={<CardSkeleton lines={2} />}>
                {(r) => r.data.length === 0 ? <p className="text-sm text-ink-soft">No upcoming missions.</p> : <ul className="space-y-2 text-sm">{r.data.map((t) => <li key={t._id} className="flex justify-between gap-2"><span className="font-semibold">{t.activity?.title}</span><span className="text-ink-soft">{fmtDate(t.scheduledDate)}</span></li>)}</ul>}
              </AsyncBoundary>
            </div>
          </Section>
        </div>
      </div>

      <AssignTaskModal open={!!assign} activity={assign?.activity} onClose={() => setAssign(null)} onAssigned={refreshAll} />
      <TaskReviewModal task={review} onClose={() => setReview(null)} onDone={refreshAll} />
    </>
  );
}

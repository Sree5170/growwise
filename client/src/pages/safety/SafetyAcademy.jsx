import { Link } from 'react-router-dom';
import { CheckCircle2, Info } from 'lucide-react';
import { useChildren } from '../../context/ChildrenContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { safetyService } from '../../services/safetyService.js';
import { AsyncBoundary, CardSkeleton, EmptyState } from '../../components/feedback/Feedback.jsx';
import { PageHeader, Pill, ProgressBar } from '../../components/ui/Bits.jsx';

export default function SafetyAcademy() {
  useDocumentTitle('Safety Academy');
  const { selected } = useChildren(); const id = selected?._id;
  const state = useAsync(() => safetyService.list(id), [id], { enabled: !!id });
  if (!selected) return <EmptyState emoji="🛟" title="Add a child to start" >Lessons are matched to your child’s age group.</EmptyState>;
  return (
    <>
      <PageHeader title="Safety Academy" subtitle={`Be prepared, stay calm. Lessons for ${selected.displayName}.`} />
      <p className="mb-5 flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-700"><Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /><span>These are <strong>educational exercises</strong>. GrowWise does not send or receive live emergency alerts. In a real emergency, call your local emergency number and follow official guidance.</span></p>
      <AsyncBoundary state={state} skeleton={<div className="grid gap-4 sm:grid-cols-2"><CardSkeleton /><CardSkeleton /></div>}>
        {(lessons) => lessons.length === 0 ? <EmptyState emoji="📚" title="No lessons for this age group yet" /> : (
          <>
            <div className="card mb-5 p-4"><p className="mb-2 font-bold">{lessons.filter((l) => l.completed).length} of {lessons.length} lessons complete</p><ProgressBar value={lessons.filter((l) => l.completed).length} max={lessons.length} label="Lessons completed" /></div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {lessons.map((l) => (
                <li key={l._id}><Link to={`/safety-academy/${l._id}`} className="card flex h-full gap-4 p-5 transition-shadow hover:shadow-lift">
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-coral-50 text-4xl" aria-hidden="true">{l.emoji}</span>
                  <span className="min-w-0"><span className="flex items-center gap-2 text-lg font-extrabold">{l.title}{l.completed && <CheckCircle2 className="h-5 w-5 text-mint-700" aria-label="Completed" />}</span>
                    <span className="mt-1 line-clamp-2 block text-sm text-ink-soft">{l.learningObjectives?.[0]}</span>
                    <span className="mt-2 flex gap-2">{l.completed ? <Pill tone="mint">Completed · {l.quizScore}/{l.totalQuestions}</Pill> : <Pill tone="sun">{l.points} points</Pill>}</span></span>
                </Link></li>))}
            </ul>
          </>)}
      </AsyncBoundary>
    </>
  );
}

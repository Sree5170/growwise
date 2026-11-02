import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Printer, ShieldCheck, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';
import { useChildren } from '../../context/ChildrenContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { safetyService } from '../../services/safetyService.js';
import { AsyncBoundary, CardSkeleton } from '../../components/feedback/Feedback.jsx';
import { Pill } from '../../components/ui/Bits.jsx';
import Button from '../../components/ui/Button.jsx';

function Quiz({ lesson, childId, isChild, onDone }) {
  const [answers, setAnswers] = useState({}); const [result, setResult] = useState(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState(null);
  const total = lesson.quizQuestions.length; const all = Object.keys(answers).length === total;
  const submit = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await safetyService.complete(lesson._id, { ...(isChild ? {} : { childId }), answers: lesson.quizQuestions.map((_, qi) => ({ questionIndex: qi, selectedIndex: answers[qi] })) });
      setResult(r);
      if (r.passed) { toast.success(r.firstCompletion ? `Lesson complete! +${r.pointsAwarded} points` : 'Lesson already completed — nice review!', { icon: '🏅' }); r.newBadges.forEach((b) => toast(`New badge: ${b.name}`, { icon: b.emoji, duration: 5000 })); onDone(); }
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  return (
    <section aria-labelledby="quiz-h" className="card p-5 sm:p-6">
      <h2 id="quiz-h" className="text-xl font-extrabold">Check what you learned</h2>
      <p className="mt-1 text-sm text-ink-soft">Answer every question. You need at least {Math.ceil(total * 0.6)} of {total} correct to finish the lesson. You can try again.</p>
      <ol className="mt-5 space-y-6">
        {lesson.quizQuestions.map((q, qi) => (
          <li key={qi}><fieldset disabled={!!result}><legend className="mb-2 font-bold">{qi + 1}. {q.question}</legend>
            <div className="space-y-2">{q.options.map((o, oi) => {
              const show = !!result; const right = show && oi === q.correctIndex; const wrong = show && answers[qi] === oi && oi !== q.correctIndex;
              return <label key={oi} className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-2 ${right ? 'border-mint-600 bg-mint-50' : wrong ? 'border-coral-500 bg-coral-50' : answers[qi] === oi ? 'border-sky-500 bg-sky-50' : 'border-ink/15 bg-white'}`}>
                <input type="radio" className="h-5 w-5 accent-mint-700" name={`q${qi}`} checked={answers[qi] === oi} onChange={() => setAnswers((a) => ({ ...a, [qi]: oi }))} /><span className="flex-1">{o}</span>
                {right && <CheckCircle2 className="h-5 w-5 text-mint-700" aria-label="Correct" />}{wrong && <XCircle className="h-5 w-5 text-coral-600" aria-label="Not correct" />}</label>; })}</div>
            {result && <p className="mt-2 rounded-lg bg-paper p-3 text-sm">{q.explanation}</p>}</fieldset></li>))}
      </ol>
      {err && <p role="alert" className="mt-4 font-semibold text-coral-700">{err.message}</p>}
      {result ? (
        <div className={`mt-6 rounded-xl p-4 ${result.passed ? 'bg-mint-50' : 'bg-sun-50'}`} role="status">
          <p className="text-lg font-extrabold">{result.passed ? `Well done! ${result.score} of ${result.totalQuestions} correct.` : `You got ${result.score} of ${result.totalQuestions}. Read the explanations and try again.`}</p>
          {!result.passed && <Button className="mt-3" onClick={() => { setResult(null); setAnswers({}); }}>Try again</Button>}
        </div>
      ) : <Button className="mt-6" disabled={!all} loading={busy} onClick={submit}>Submit answers</Button>}
    </section>
  );
}

export default function LessonPage() {
  const { id } = useParams(); const { isChild } = useAuth(); const { selected } = useChildren(); const childId = selected?._id;
  const state = useAsync(() => safetyService.get(id, childId), [id, childId], { enabled: !!childId });
  useDocumentTitle(state.data?.title || 'Lesson');
  const [checked, setChecked] = useState({});
  return (
    <>
      <div className="no-print mb-4"><Link to="/safety-academy" className="btn-ghost -ml-3"><ArrowLeft className="h-5 w-5" aria-hidden="true" />All lessons</Link></div>
      <AsyncBoundary state={state} skeleton={<CardSkeleton lines={6} />}>
        {(l) => (
          <article className="space-y-6">
            <header className="rounded-3xl bg-coral-50 p-6 sm:p-8">
              <p className="text-6xl" aria-hidden="true">{l.emoji}</p>
              <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{l.title}</h1>
              <p className="mt-2 max-w-2xl text-ink-soft">{l.introduction}</p>
              {l.completed && <Pill tone="mint" className="mt-3"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Completed</Pill>}
            </header>
            <section className="card p-5"><h2 className="mb-2 text-lg font-extrabold">What you will learn</h2><ul className="ml-5 list-disc space-y-1">{l.learningObjectives.map((o) => <li key={o}>{o}</li>)}</ul></section>
            <div className="grid gap-4 md:grid-cols-2">{l.lessonContent.map((c) => <section key={c.heading} className="card p-5"><h2 className="text-lg font-extrabold">{c.heading}</h2><p className="mt-1.5 text-ink-soft">{c.body}</p></section>)}</div>
            <section className="card p-5" aria-labelledby="steps-h"><h2 id="steps-h" className="mb-3 flex items-center gap-2 text-lg font-extrabold"><ShieldCheck className="h-5 w-5 text-mint-700" aria-hidden="true" />Key safety steps</h2>
              <ol className="space-y-2">{l.safetySteps.map((s, i) => <li key={s} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-mint-700 text-sm font-bold text-white" aria-hidden="true">{i + 1}</span><span className="pt-0.5 font-semibold">{s}</span></li>)}</ol></section>
            {l.parentPractice?.length > 0 && <section className="card border-sun-200 bg-sun-50 p-5"><h2 className="mb-2 text-lg font-extrabold">Practise together (with a grown-up)</h2><ul className="ml-5 list-disc space-y-1">{l.parentPractice.map((p) => <li key={p}>{p}</li>)}</ul><p className="mt-3 text-sm text-ink-soft">This is a practice exercise, not a live alert.</p></section>}
            <section className="card p-5" aria-labelledby="chk-h">
              <div className="mb-3 flex items-center justify-between gap-3"><h2 id="chk-h" className="text-lg font-extrabold">Printable checklist</h2><Button variant="secondary" className="no-print" onClick={() => window.print()}><Printer className="h-4 w-4" aria-hidden="true" />Print</Button></div>
              <ul className="space-y-1">{l.checklist.map((c) => <li key={c}><label className="flex min-h-[44px] items-center gap-3"><input type="checkbox" className="h-5 w-5 accent-mint-700" checked={!!checked[c]} onChange={() => setChecked((x) => ({ ...x, [c]: !x[c] }))} /><span className={checked[c] ? 'text-ink-faint line-through' : ''}>{c}</span></label></li>)}</ul></section>
            <div className="no-print"><Quiz key={l._id} lesson={l} childId={childId} isChild={isChild} onDone={state.reload} /></div>
            {l.sourceReferences?.length > 0 && <footer className="text-sm text-ink-faint"><p className="font-semibold">Based on public guidance such as:</p><ul className="ml-5 list-disc">{l.sourceReferences.map((s) => <li key={s.name}>{s.name}</li>)}</ul>
              <p className="mt-1">Content is educational. Check advice and emergency numbers with your local authority.</p></footer>}
          </article>)}
      </AsyncBoundary>
    </>
  );
}

import { useRef, useState } from 'react';
import { CheckCircle2, Lightbulb, XCircle } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import { ProgressBar } from '../../components/ui/Bits.jsx';

// Shared by Pattern Quiz and Riddle Challenge. The server re-scores the submitted answers.
export default function QuizGame({ data, onFinish }) {
  const qs = data.questions;
  const [i, setI] = useState(0); const [picked, setPicked] = useState(null); const [hint, setHint] = useState(false);
  const answers = useRef([]); const hints = useRef(0); const startedAt = useRef(Date.now());
  const q = qs[i]; const answered = picked !== null; const correct = answered && picked === q.answer;
  const choose = (opt) => { if (answered) return; setPicked(opt); answers.current.push({ questionId: q.id, answer: opt }); };
  const showHint = () => { if (!hint) { hints.current += 1; setHint(true); } };
  const next = () => {
    if (i + 1 < qs.length) { setI(i + 1); setPicked(null); setHint(false); }
    else onFinish({ answers: answers.current, hintsUsed: hints.current, durationSeconds: Math.round((Date.now() - startedAt.current) / 1000) });
  };
  return (
    <div className="mx-auto max-w-xl">
      <p className="mb-2 flex justify-between text-sm font-bold"><span>Question {i + 1} of {qs.length}</span></p>
      <ProgressBar value={i + (answered ? 1 : 0)} max={qs.length} tone="sky" label="Quiz progress" className="mb-5" />
      <div className="card p-5 sm:p-6">
        <h2 className="text-xl font-extrabold leading-snug sm:text-2xl">{q.prompt}</h2>
        <ul className="mt-5 space-y-3" aria-label="Answer choices">
          {q.options.map((opt) => {
            const isRight = answered && opt === q.answer; const isWrong = answered && opt === picked && opt !== q.answer;
            return (
              <li key={opt}><button type="button" disabled={answered} onClick={() => choose(opt)} aria-pressed={picked === opt}
                className={`flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left text-lg font-semibold ${isRight ? 'border-mint-600 bg-mint-50' : isWrong ? 'border-coral-500 bg-coral-50' : 'border-ink/15 bg-white hover:bg-sky-50 disabled:opacity-70'}`}>
                <span>{opt}</span>{isRight && <CheckCircle2 className="h-6 w-6 text-mint-700" aria-label="Correct answer" />}{isWrong && <XCircle className="h-6 w-6 text-coral-600" aria-label="Your answer, not correct" />}
              </button></li>);
          })}
        </ul>
        {!answered && <div className="mt-4">{hint ? <p className="rounded-xl bg-sun-50 p-3" role="status"><Lightbulb className="mr-2 inline h-5 w-5 text-sun-700" aria-hidden="true" /><strong>Hint: </strong>{q.hint}</p> : <Button variant="ghost" onClick={showHint}><Lightbulb className="h-5 w-5" aria-hidden="true" />Need a hint?</Button>}</div>}
        {answered && (
          <div className={`mt-5 rounded-xl p-4 ${correct ? 'bg-mint-50' : 'bg-sky-50'}`} role="status">
            <p className="font-extrabold">{correct ? 'Nice thinking! 🎉' : 'Good try! Here’s how it works:'}</p><p className="mt-1">{q.explanation}</p>
            <Button className="mt-4" onClick={next}>{i + 1 < qs.length ? 'Next question' : 'See my results'}</Button>
          </div>)}
      </div>
    </div>
  );
}

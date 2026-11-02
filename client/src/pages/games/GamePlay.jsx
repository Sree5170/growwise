import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useChildren } from '../../context/ChildrenContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { gameService } from '../../services/gameService.js';
import { CardSkeleton, EmptyState, ErrorState } from '../../components/feedback/Feedback.jsx';
import Button from '../../components/ui/Button.jsx';
import MemoryMatch from './MemoryMatch.jsx';
import QuizGame from './QuizGame.jsx';
import { GAME_LABELS } from '../../utils/constants.js';

const TYPES = Object.keys(GAME_LABELS);

export default function GamePlay() {
  const { type } = useParams(); const { selected } = useChildren(); const { isChild } = useAuth();
  useDocumentTitle(GAME_LABELS[type] || 'Game');
  const [round, setRound] = useState(0); const [data, setData] = useState(null); const [error, setError] = useState(null);
  const [result, setResult] = useState(null); const [saving, setSaving] = useState(false);
  const childId = selected?._id; const submitting = useRef(false);

  const load = useCallback(async () => {
    setData(null); setResult(null); setError(null);
    try { setData(await gameService.questions(type, { childId, count: 6 })); } catch (e) { setError(e); }
  }, [type, childId]);
  useEffect(() => { if (TYPES.includes(type) && childId) load(); }, [load, type, childId, round]);

  if (!TYPES.includes(type)) return <EmptyState emoji="🎮" title="That game doesn’t exist" action={<Link to="/games" className="btn-primary">Back to games</Link>} />;
  if (!selected) return <EmptyState emoji="🧒" title="Choose a child first" />;
  if (error) return <ErrorState error={error} onRetry={load} />;
  if (!data) return <CardSkeleton lines={5} />;

  const finish = async (payload) => {
    if (submitting.current) return; // a double click must not record the round twice
    submitting.current = true; setSaving(true);
    try {
      const r = await gameService.submit(type, { ...(isChild ? {} : { childId }), ...payload });
      setResult({ attempt: r.attempt, payload }); r.newBadges.forEach((b) => toast(`New badge: ${b.name}`, { icon: b.emoji, duration: 5000 }));
    } catch (e) { toast.error(e.message); setResult({ failed: true }); } finally { setSaving(false); submitting.current = false; }
  };

  if (result) {
    const a = result.attempt;
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="card p-8">
          <p className="animate-pop text-6xl" aria-hidden="true">{result.failed ? '😕' : '🎉'}</p>
          <h1 className="mt-3 text-2xl font-extrabold">{result.failed ? 'We could not save that round' : 'Round complete!'}</h1>
          {a && (type === 'memory-match'
            ? <p className="mt-2 text-lg">You matched all {a.totalQuestions} pairs in <strong>{a.moves} moves</strong> ({a.durationSeconds}s).</p>
            : <p className="mt-2 text-lg">You got <strong>{a.score} of {a.totalQuestions}</strong> right{result.payload.hintsUsed ? ` and used ${result.payload.hintsUsed} ${result.payload.hintsUsed === 1 ? 'hint' : 'hints'}` : ''}.</p>)}
          <p className="mt-2 text-sm text-ink-faint">This is for practice — every round makes your brain stronger.</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center"><Button onClick={() => setRound((r) => r + 1)}><RotateCcw className="h-5 w-5" aria-hidden="true" />Play again</Button><Link to="/games" className="btn-secondary">All games</Link></div>
        </div>
      </div>);
  }
  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-3"><Link to="/games" className="btn-ghost -ml-3"><ArrowLeft className="h-5 w-5" aria-hidden="true" />Games</Link><h1 className="text-xl font-extrabold sm:text-2xl">{GAME_LABELS[type]}</h1><span className="w-20" /></div>
      {saving ? <CardSkeleton lines={2} /> : type === 'memory-match' ? <MemoryMatch key={round} data={data} onFinish={finish} /> : <QuizGame key={round} data={data} onFinish={finish} />}
    </>
  );
}

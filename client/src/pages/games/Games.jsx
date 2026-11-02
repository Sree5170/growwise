import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useChildren } from '../../context/ChildrenContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { gameService } from '../../services/gameService.js';
import { AsyncBoundary, CardSkeleton, EmptyState } from '../../components/feedback/Feedback.jsx';
import { PageHeader } from '../../components/ui/Bits.jsx';

export default function Games() {
  useDocumentTitle('Brain games');
  const { isChild } = useAuth(); const { selected } = useChildren();
  const id = selected?._id;
  const games = useAsync(() => gameService.list(), []);
  const progress = useAsync(() => gameService.progress(id), [id], { enabled: !!id });
  if (!selected) return <EmptyState emoji="🧩" title="Add a child to play">Games are matched to a child’s age group. Create a profile first.</EmptyState>;
  const stat = (type) => progress.data?.games.find((g) => g.type === type);
  return (
    <>
      <PageHeader title="Brain games" subtitle={isChild ? 'Pick a game and have fun!' : `Games for ${selected.displayName} (ages ${selected.ageGroup})`} />
      <AsyncBoundary state={games} skeleton={<div className="grid gap-4 md:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>}>
        {(list) => (
          <div className="grid gap-4 md:grid-cols-3">
            {list.map((g) => { const s = stat(g.type); return (
              <Link key={g.type} to={`/games/${g.type}`} className="card block p-6 transition-shadow hover:shadow-lift">
                <span className="text-5xl" aria-hidden="true">{g.emoji}</span>
                <h2 className="mt-3 text-xl font-extrabold">{g.name}</h2>
                <p className="mt-1 text-ink-soft">{g.description}</p>
                <p className="mt-3 text-sm font-semibold text-mint-800">{s ? (s.attempts ? `${s.attempts} ${s.attempts === 1 ? 'round' : 'rounds'} played · best ${g.type === 'memory-match' && s.bestMoves ? `${s.bestMoves} moves` : `${s.bestPercent}%`}` : 'Not played yet') : '\u00A0'}</p>
              </Link>); })}
          </div>)}
      </AsyncBoundary>
      <p className="mt-6 text-sm text-ink-faint">Games are for practice and fun. Scores do not measure intelligence.</p>
    </>
  );
}

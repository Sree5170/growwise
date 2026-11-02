import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { activityService } from '../../services/activityService.js';
import { AsyncBoundary, EmptyState, Skeleton } from '../../components/feedback/Feedback.jsx';
import { PageHeader } from '../../components/ui/Bits.jsx';
import Button from '../../components/ui/Button.jsx';
import ActivityCard from '../../components/cards/ActivityCard.jsx';
import ActivityDetailModal from '../../components/modals/ActivityDetailModal.jsx';
import AssignTaskModal from '../../components/modals/AssignTaskModal.jsx';
import { CATEGORIES } from '../../utils/constants.js';

const DURATIONS = [['', 'Any length'], ['10', 'Up to 10 min'], ['20', 'Up to 20 min'], ['30', 'Up to 30 min'], ['60', 'Up to 1 hour']];

export default function ActivityLibrary() {
  useDocumentTitle('Activity library');
  const { isParent } = useAuth();
  const [q, setQ] = useState(''); const [debounced, setDebounced] = useState('');
  const [category, setCategory] = useState(''); const [age, setAge] = useState(''); const [duration, setDuration] = useState(''); const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null); const [assign, setAssign] = useState(null);
  useEffect(() => { const t = setTimeout(() => setDebounced(q.trim()), 300); return () => clearTimeout(t); }, [q]);
  useEffect(() => { setPage(1); }, [debounced, category, age, duration]);
  const state = useAsync(() => activityService.list({ q: debounced || undefined, category: category || undefined, age: age || undefined, maxDuration: duration || undefined, page, limit: 12 }), [debounced, category, age, duration, page]);
  const clear = () => { setQ(''); setCategory(''); setAge(''); setDuration(''); };
  const filtered = q || category || age || duration;

  return (
    <>
      <PageHeader title={isParent ? 'Activity library' : 'Ideas to try'} subtitle="Browse activities for every age, with clear steps and safety notes." />
      <div className="card mb-5 space-y-4 p-4">
        <div className="relative">
          <label htmlFor="act-search" className="sr-only">Search activities</label>
          <Search className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-ink-faint" aria-hidden="true" />
          <input id="act-search" type="search" className="field-input pl-11" placeholder="Search by title, topic or interest" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div role="group" aria-label="Category" className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={!category} onClick={() => setCategory('')} className={`min-h-[44px] rounded-full border px-4 text-sm font-semibold ${!category ? 'border-mint-700 bg-mint-700 text-white' : 'border-ink/20 bg-white hover:bg-mint-50'}`}>All</button>
          {CATEGORIES.map((c) => <button key={c.value} type="button" aria-pressed={category === c.value} onClick={() => setCategory(c.value)} className={`min-h-[44px] rounded-full border px-4 text-sm font-semibold ${category === c.value ? 'border-mint-700 bg-mint-700 text-white' : 'border-ink/20 bg-white hover:bg-mint-50'}`}><span aria-hidden="true">{c.emoji} </span>{c.label}</button>)}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div><label htmlFor="age-filter" className="field-label">Age</label>
            <select id="age-filter" className="field-input" value={age} onChange={(e) => setAge(e.target.value)}><option value="">Any age</option>{Array.from({ length: 15 }, (_, i) => i + 3).map((a) => <option key={a} value={a}>{a} years</option>)}</select></div>
          <div><label htmlFor="dur-filter" className="field-label">Duration</label>
            <select id="dur-filter" className="field-input" value={duration} onChange={(e) => setDuration(e.target.value)}>{DURATIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <div className="flex items-end">{filtered && <Button variant="secondary" className="w-full" onClick={clear}>Clear filters</Button>}</div>
        </div>
      </div>

      <AsyncBoundary state={state} skeleton={<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52" />)}</div>}>
        {(r) => r.data.length === 0 ? (
          <EmptyState emoji="🔎" title="No activities match" action={filtered ? <Button onClick={clear}>Clear filters</Button> : null}>Try a different search, age or length.</EmptyState>
        ) : (
          <>
            <p className="mb-3 text-sm text-ink-soft" aria-live="polite">{r.meta.total} {r.meta.total === 1 ? 'activity' : 'activities'}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {r.data.map((a) => <ActivityCard key={a._id} activity={a} onOpen={setOpen} action={isParent ? <Button variant="secondary" className="w-full" onClick={() => setAssign(a)}>Assign</Button> : <Button variant="secondary" className="w-full" onClick={() => setOpen(a)}>See how</Button>} />)}
            </div>
            {r.meta.pages > 1 && (
              <nav className="mt-6 flex items-center justify-center gap-3" aria-label="Pagination">
                <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <span className="text-sm text-ink-soft">Page {page} of {r.meta.pages}</span>
                <Button variant="secondary" disabled={page >= r.meta.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </nav>)}
          </>)}
      </AsyncBoundary>
      <ActivityDetailModal activity={open} onClose={() => setOpen(null)} footer={isParent && open ? <div className="flex justify-end"><Button onClick={() => { setAssign(open); setOpen(null); }}>Assign to a child</Button></div> : null} />
      {isParent && <AssignTaskModal open={!!assign} activity={assign} onClose={() => setAssign(null)} />}
    </>
  );
}

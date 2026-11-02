import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from './Modal.jsx';
import Button from '../ui/Button.jsx';
import { Field, ErrorSummary } from '../forms/Field.jsx';
import { Spinner } from '../feedback/Feedback.jsx';
import { Pill } from '../ui/Bits.jsx';
import { activityService } from '../../services/activityService.js';
import { taskService } from '../../services/taskService.js';
import { useChildren } from '../../context/ChildrenContext.jsx';
import { categoryInfo } from '../../utils/constants.js';
import { dateInputToISO, toISODate } from '../../utils/format.js';

const AGE_FOR_GROUP = { '3-5': 4, '6-8': 7, '9-12': 10, '13-17': 15 };

// Assign an activity to a child. Pass `activity` to preselect; otherwise the parent searches the library.
export default function AssignTaskModal({ open, onClose, activity: preset, onAssigned }) {
  const { list: kids, selected } = useChildren();
  const [childId, setChildId] = useState(''); const [activity, setActivity] = useState(preset || null);
  const [q, setQ] = useState(''); const [results, setResults] = useState([]); const [searching, setSearching] = useState(false);
  const [scheduled, setScheduled] = useState(toISODate()); const [due, setDue] = useState(toISODate()); const [note, setNote] = useState('');
  const [error, setError] = useState(null); const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) { setActivity(preset || null); setChildId(selected?._id || kids[0]?._id || ''); setError(null); setNote(''); setQ(''); const t = toISODate(); setScheduled(t); setDue(t); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const child = kids.find((k) => k._id === childId);

  useEffect(() => {
    if (!open || activity) return undefined;
    let live = true; setSearching(true);
    const t = setTimeout(() => {
      activityService.list({ q: q || undefined, limit: 8, ...(child ? { age: AGE_FOR_GROUP[child.ageGroup] } : {}) })
        .then((r) => live && setResults(r.data)).catch((e) => live && setError(e)).finally(() => live && setSearching(false));
    }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [q, open, activity, child]);

  const submit = async (e) => {
    e.preventDefault(); setError(null);
    if (!child) return setError({ message: 'Add a child profile first.' });
    if (!activity) return setError({ message: 'Choose an activity to assign.' });
    if (due < scheduled) return setError({ message: 'Due date cannot be before the scheduled date.' });
    setBusy(true);
    try {
      const t = await taskService.create({ childId, activityId: activity._id, scheduledDate: dateInputToISO(scheduled), dueDate: dateInputToISO(due), parentNote: note });
      toast.success(`Assigned “${activity.title}” to ${child.displayName}`); onAssigned?.(t); onClose();
    } catch (x) { setError(x); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Assign a mission" wide>
      <form onSubmit={submit} noValidate className="space-y-4">
        <ErrorSummary error={error} />
        <Field as="select" label="Child" value={childId} onChange={(e) => setChildId(e.target.value)}>
          {kids.map((k) => <option key={k._id} value={k._id}>{k.displayName} ({k.ageGroup})</option>)}
        </Field>
        {activity ? (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-mint-200 bg-mint-50 p-4">
            <div><p className="font-bold">{activity.title}</p><p className="text-sm text-ink-soft">{categoryInfo(activity.category).label} · {activity.durationMinutes} min · {activity.points} points · ages {activity.minimumAge}–{activity.maximumAge}</p></div>
            {!preset && <button type="button" className="btn-ghost text-sm" onClick={() => setActivity(null)}>Change</button>}
          </div>
        ) : (
          <div>
            <Field label="Search activities" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. puzzle, nature, kitchen" hint={child ? `Showing activities that suit ${child.displayName}'s age group.` : undefined} />
            <ul className="mt-2 max-h-56 space-y-2 overflow-y-auto" aria-label="Matching activities">
              {searching && <li className="p-2"><Spinner label="Searching" /></li>}
              {!searching && results.length === 0 && <li className="p-2 text-sm text-ink-soft">No matching activities.</li>}
              {results.map((a) => (
                <li key={a._id}><button type="button" onClick={() => setActivity(a)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-ink/10 bg-white p-3 text-left hover:bg-mint-50">
                  <span><span className="block font-semibold">{a.title}</span><span className="text-sm text-ink-soft">{a.durationMinutes} min · ages {a.minimumAge}–{a.maximumAge}</span></span>
                  <Pill tone={categoryInfo(a.category).tone}>{categoryInfo(a.category).emoji}</Pill></button></li>
              ))}
            </ul>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Scheduled for" type="date" value={scheduled} onChange={(e) => { setScheduled(e.target.value); if (due < e.target.value) setDue(e.target.value); }} required />
          <Field label="Due by" type="date" min={scheduled} value={due} onChange={(e) => setDue(e.target.value)} required />
        </div>
        <Field as="textarea" label="Note for your child (optional)" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Let’s do this after snack time" />
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" loading={busy}>Assign mission</Button></div>
      </form>
    </Modal>
  );
}

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { useChildren } from '../../context/ChildrenContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { taskService } from '../../services/taskService.js';
import { AsyncBoundary, CardSkeleton, EmptyState } from '../../components/feedback/Feedback.jsx';
import { PageHeader } from '../../components/ui/Bits.jsx';
import Button from '../../components/ui/Button.jsx';
import TaskRow from '../../components/cards/TaskRow.jsx';
import AssignTaskModal from '../../components/modals/AssignTaskModal.jsx';
import TaskReviewModal from '../../components/modals/TaskReviewModal.jsx';
import Modal, { ConfirmDialog } from '../../components/modals/Modal.jsx';
import { Field, ErrorSummary } from '../../components/forms/Field.jsx';
import { STATUS_LABELS } from '../../utils/constants.js';
import { dateInputToISO, toISODate } from '../../utils/format.js';

const FILTERS = [['', 'All'], ['submitted', STATUS_LABELS.submitted], ['assigned', STATUS_LABELS.assigned], ['needs-revision', STATUS_LABELS['needs-revision']], ['approved', STATUS_LABELS.approved], ['cancelled', STATUS_LABELS.cancelled]];

function EditTaskModal({ task, onClose, onSaved }) {
  const [sched, setSched] = useState(''); const [due, setDue] = useState(''); const [note, setNote] = useState(''); const [error, setError] = useState(null); const [busy, setBusy] = useState(false);
  useEffect(() => { if (task) { setSched(toISODate(task.scheduledDate)); setDue(toISODate(task.dueDate)); setNote(task.parentNote || ''); setError(null); } }, [task]);
  if (!task) return null;
  const save = async (e) => {
    e.preventDefault(); if (due < sched) return setError({ message: 'Due date cannot be before the scheduled date.' });
    setBusy(true); setError(null);
    try { await taskService.update(task._id, { scheduledDate: dateInputToISO(sched), dueDate: dateInputToISO(due), parentNote: note }); toast.success('Task updated'); onSaved(); onClose(); } catch (x) { setError(x); } finally { setBusy(false); }
  };
  return (
    <Modal open={!!task} onClose={onClose} title={`Edit: ${task.activity?.title}`}>
      <form onSubmit={save} noValidate className="space-y-4"><ErrorSummary error={error} />
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Scheduled for" type="date" value={sched} onChange={(e) => setSched(e.target.value)} /><Field label="Due by" type="date" min={sched} value={due} onChange={(e) => setDue(e.target.value)} /></div>
        <Field as="textarea" label="Note" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" loading={busy}>Save</Button></div></form>
    </Modal>
  );
}

export default function Tasks() {
  useDocumentTitle('Tasks');
  const { list: kids, selected } = useChildren();
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState(''); const [page, setPage] = useState(1);
  const [assign, setAssign] = useState(false); const [review, setReview] = useState(null); const [edit, setEdit] = useState(null); const [cancel, setCancel] = useState(null); const [busy, setBusy] = useState(false);
  const id = selected?._id;
  const state = useAsync(() => taskService.list({ childId: id, status: status || undefined, page, limit: 10 }), [id, status, page], { enabled: !!id });
  useEffect(() => { setPage(1); }, [id, status]);
  useEffect(() => { if (params.get('assign')) { setAssign(true); setParams({}, { replace: true }); } }, [params, setParams]);
  const doCancel = async () => { setBusy(true); try { await taskService.update(cancel._id, { status: 'cancelled' }); toast('Task cancelled'); setCancel(null); state.reload(); } catch (e) { toast.error(e.message); } finally { setBusy(false); } };

  if (!kids.length) return <EmptyState emoji="🧒" title="Add a child first">Tasks are assigned to child profiles. Create one from the Children page.</EmptyState>;
  return (
    <>
      <PageHeader title="Tasks" subtitle={`Missions for ${selected?.displayName}`} actions={<Button onClick={() => setAssign(true)}><Plus className="h-5 w-5" aria-hidden="true" />Assign a task</Button>} />
      <div role="group" aria-label="Filter by status" className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map(([v, l]) => <button key={v} type="button" aria-pressed={status === v} onClick={() => setStatus(v)} className={`min-h-[44px] rounded-full border px-4 text-sm font-semibold ${status === v ? 'border-mint-700 bg-mint-700 text-white' : 'border-ink/20 bg-white hover:bg-mint-50'}`}>{l}</button>)}
      </div>
      <AsyncBoundary state={state} skeleton={<div className="space-y-3"><CardSkeleton lines={2} /><CardSkeleton lines={2} /></div>}>
        {(r) => r.data.length === 0 ? <EmptyState emoji="🗂️" title={status ? 'No tasks with this status' : 'No tasks yet'} action={<Button onClick={() => setAssign(true)}>Assign a task</Button>}>Assigned missions will show up here for you to track and review.</EmptyState> : (
          <>
            <ul className="space-y-3">
              {r.data.map((t) => (
                <TaskRow key={t._id} task={t} actions={<>
                  {t.status === 'submitted' && <Button onClick={() => setReview(t)}>Review</Button>}
                  {['assigned', 'needs-revision'].includes(t.status) && <><Button variant="secondary" onClick={() => setEdit(t)}>Edit</Button><Button variant="ghost" onClick={() => setCancel(t)}>Cancel</Button></>}
                </>} />))}
            </ul>
            {r.meta?.pages > 1 && (
              <nav className="mt-5 flex items-center justify-center gap-3" aria-label="Pagination">
                <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <span className="text-sm text-ink-soft">Page {page} of {r.meta.pages}</span>
                <Button variant="secondary" disabled={page >= r.meta.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </nav>)}
          </>)}
      </AsyncBoundary>
      <AssignTaskModal open={assign} onClose={() => setAssign(false)} onAssigned={state.reload} />
      <TaskReviewModal task={review} onClose={() => setReview(null)} onDone={state.reload} />
      <EditTaskModal task={edit} onClose={() => setEdit(null)} onSaved={state.reload} />
      <ConfirmDialog open={!!cancel} onClose={() => setCancel(null)} onConfirm={doCancel} loading={busy} danger confirmLabel="Cancel task" title="Cancel this task?" message="The mission will be removed from your child’s list. This cannot be undone." />
    </>
  );
}

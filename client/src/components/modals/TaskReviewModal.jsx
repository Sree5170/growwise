import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from './Modal.jsx';
import Button from '../ui/Button.jsx';
import { Field, ErrorSummary } from '../forms/Field.jsx';
import { taskService } from '../../services/taskService.js';

// Parent approves or asks for another try. Points are decided by the server from the Activity record.
export default function TaskReviewModal({ task, onClose, onDone }) {
  const [note, setNote] = useState(''); const [error, setError] = useState(null); const [busy, setBusy] = useState(null);
  useEffect(() => { setNote(''); setError(null); }, [task]);
  if (!task) return null;
  const act = task.activity;
  const decide = async (decision) => {
    setBusy(decision); setError(null);
    try {
      const r = await taskService.verify(task._id, { decision, parentNote: note });
      if (decision === 'approve') {
        toast.success(`Approved! +${r.task.pointsAwarded} points`, { icon: '🎉' });
        r.newBadges.forEach((b) => toast(`New badge: ${b.name}`, { icon: b.emoji, duration: 5000 }));
      } else toast('Sent back for another try', { icon: '🔁' });
      onDone?.(r); onClose();
    } catch (e) { setError(e); if (e.status === 409) onDone?.(); } finally { setBusy(null); }
  };
  return (
    <Modal open={!!task} onClose={onClose} title="Review mission">
      <div className="space-y-4">
        <div><p className="text-lg font-bold">{act?.title}</p><p className="text-sm text-ink-soft">Estimated {act?.durationMinutes} min · worth {act?.points} points</p></div>
        {task.childNote ? <blockquote className="rounded-xl bg-sky-50 p-3 text-sm"><span className="font-semibold">Note from child: </span>{task.childNote}</blockquote> : <p className="text-sm text-ink-faint">No note from your child.</p>}
        {task.minutesSpent != null && <p className="text-sm text-ink-soft">Child reported {task.minutesSpent} minutes (self-reported).</p>}
        {act?.completionMethod && <p className="text-sm text-ink-soft"><span className="font-semibold">How to verify: </span>{{ 'parent-verified': 'Check it yourself or ask your child to show you.', 'self-reported': 'A quick chat with your child is enough.', 'quiz-based': 'Ask your child a couple of questions about it.' }[act.completionMethod]}</p>}
        <ErrorSummary error={error} />
        <Field as="textarea" label="Message for your child (optional)" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Great effort! / Try adding the last step…" />
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" loading={busy === 'reject'} disabled={!!busy} onClick={() => decide('reject')}>Ask for another try</Button>
          <Button loading={busy === 'approve'} disabled={!!busy} onClick={() => decide('approve')}>Approve</Button>
        </div>
      </div>
    </Modal>
  );
}

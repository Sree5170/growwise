import { CalendarDays, MessageSquare } from 'lucide-react';
import { Pill } from '../ui/Bits.jsx';
import { categoryInfo, STATUS_LABELS } from '../../utils/constants.js';
import { fmtDate, isOverdue } from '../../utils/format.js';

const STATUS_TONE = { assigned: 'sky', submitted: 'sun', approved: 'mint', 'needs-revision': 'coral', cancelled: 'gray' };
export const StatusPill = ({ status }) => <Pill tone={STATUS_TONE[status]}>{STATUS_LABELS[status]}</Pill>;

export default function TaskRow({ task, childName, actions }) {
  const act = task.activity; const cat = categoryInfo(act?.category);
  return (
    <li className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mint-50 text-2xl" aria-hidden="true">{cat.emoji}</span>
        <div className="min-w-0">
          <p className="truncate font-bold">{act?.title || 'Activity removed'}</p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
            {childName && <span className="font-semibold">{childName}</span>}
            <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" aria-hidden="true" />{fmtDate(task.scheduledDate)}{task.dueDate !== task.scheduledDate && ` → due ${fmtDate(task.dueDate)}`}</span>
            {isOverdue(task) && <span className="font-semibold text-coral-700">Overdue</span>}
          </p>
          {(task.parentNote || task.childNote) && <p className="mt-1 flex items-start gap-1.5 text-sm text-ink-soft"><MessageSquare className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span className="line-clamp-2">{task.parentNote || task.childNote}</span></p>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end"><StatusPill status={task.status} />{task.status === 'approved' && <Pill tone="sun">+{task.pointsAwarded} pts</Pill>}{actions}</div>
    </li>
  );
}

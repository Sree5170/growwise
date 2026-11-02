import { AlertTriangle, CheckCircle2, Clock, ShieldCheck, Star, Users } from 'lucide-react';
import Modal from './Modal.jsx';
import { Pill } from '../ui/Bits.jsx';
import { categoryInfo, DIFFICULTY_LABELS } from '../../utils/constants.js';

const VERIFY = { 'parent-verified': 'A parent checks that it was done.', 'self-reported': 'The child reports it and a parent has a quick chat.', 'quiz-based': 'A parent asks a few questions about it.' };

export default function ActivityDetailModal({ activity, onClose, footer }) {
  if (!activity) return null;
  const cat = categoryInfo(activity.category);
  return (
    <Modal open={!!activity} onClose={onClose} title={activity.title} wide>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={cat.tone}>{cat.emoji} {cat.label}</Pill><Pill><Clock className="h-3.5 w-3.5" aria-hidden="true" />{activity.durationMinutes} min</Pill>
          <Pill><Users className="h-3.5 w-3.5" aria-hidden="true" />Ages {activity.minimumAge}–{activity.maximumAge}</Pill><Pill>{DIFFICULTY_LABELS[activity.difficulty]}</Pill>
          <Pill tone="sun"><Star className="h-3.5 w-3.5" aria-hidden="true" />{activity.points} points</Pill>
        </div>
        <p className="text-ink-soft">{activity.description}</p>
        {activity.requiresAdultSupervision && <p className="flex items-center gap-2 rounded-xl bg-coral-50 p-3 font-semibold text-coral-700"><ShieldCheck className="h-5 w-5 shrink-0" aria-hidden="true" />An adult should be nearby for this activity.</p>}
        {activity.materials?.length > 0 && <section><h3 className="mb-1.5 font-bold">You will need</h3><ul className="flex flex-wrap gap-2">{activity.materials.map((m) => <li key={m}><Pill tone="sky">{m}</Pill></li>)}</ul></section>}
        <section><h3 className="mb-1.5 font-bold">Steps</h3><ol className="space-y-2">{activity.instructions.map((s, i) => <li key={i} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-mint-700 text-sm font-bold text-white" aria-hidden="true">{i + 1}</span><span className="pt-0.5">{s}</span></li>)}</ol></section>
        {activity.safetyNotes?.length > 0 && <section className="rounded-xl bg-sun-50 p-4"><h3 className="mb-1.5 flex items-center gap-2 font-bold"><AlertTriangle className="h-5 w-5 text-sun-700" aria-hidden="true" />Safety</h3><ul className="ml-5 list-disc space-y-1">{activity.safetyNotes.map((n) => <li key={n}>{n}</li>)}</ul></section>}
        <p className="flex items-start gap-2 text-sm text-ink-soft"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span><strong>How it’s checked: </strong>{VERIFY[activity.completionMethod]}</span></p>
        {footer}
      </div>
    </Modal>
  );
}

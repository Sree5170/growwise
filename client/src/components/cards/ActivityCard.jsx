import { Clock, ShieldCheck, Star, Users } from 'lucide-react';
import { Pill } from '../ui/Bits.jsx';
import { categoryInfo, DIFFICULTY_LABELS } from '../../utils/constants.js';

export default function ActivityCard({ activity, onOpen, action, reason, compact = false }) {
  const cat = categoryInfo(activity.category);
  return (
    <article className="card flex h-full flex-col p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <Pill tone={cat.tone}><span aria-hidden="true">{cat.emoji}</span>{cat.label}</Pill>
        <span className="inline-flex items-center gap-1 text-sm font-bold text-sun-700" title="Points when approved"><Star className="h-4 w-4" aria-hidden="true" />{activity.points}<span className="sr-only"> points</span></span>
      </div>
      <h3 className="text-lg font-bold leading-snug">
        {onOpen ? <button type="button" onClick={() => onOpen(activity)} className="text-left hover:underline">{activity.title}</button> : activity.title}
      </h3>
      {!compact && <p className="mt-1.5 line-clamp-2 text-ink-soft">{activity.description}</p>}
      {reason && <p className="mt-2 rounded-lg bg-mint-50 px-3 py-2 text-sm text-mint-800"><span className="font-semibold">Why: </span>{reason}</p>}
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-ink-soft">
        <li className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" aria-hidden="true" />{activity.durationMinutes} min</li>
        <li className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" aria-hidden="true" />Ages {activity.minimumAge}–{activity.maximumAge}</li>
        <li>{DIFFICULTY_LABELS[activity.difficulty]}</li>
        {activity.requiresAdultSupervision && <li className="inline-flex items-center gap-1.5 font-semibold text-coral-700"><ShieldCheck className="h-4 w-4" aria-hidden="true" />Adult nearby</li>}
      </ul>
      {action && <div className="mt-auto pt-4">{action}</div>}
    </article>
  );
}

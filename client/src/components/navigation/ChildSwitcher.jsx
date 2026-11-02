import { Link } from 'react-router-dom';
import { useChildren } from '../../context/ChildrenContext.jsx';
import { avatarEmoji } from '../../utils/constants.js';

export default function ChildSwitcher() {
  const { list, selected, select, loading } = useChildren();
  if (loading && !list.length) return <div className="h-11 animate-pulse rounded-xl bg-ink/10" aria-hidden="true" />;
  if (!list.length) return <Link to="/parent/children?new=1" className="btn-secondary w-full text-center">Add your first child</Link>;
  return (
    <div>
      <label htmlFor="child-switcher" className="mb-1 block text-xs font-bold uppercase tracking-wide text-ink-faint">Viewing</label>
      <div className="flex items-center gap-2">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sun-100 text-xl" aria-hidden="true">{avatarEmoji(selected?.avatar)}</span>
        <select id="child-switcher" className="field-input" value={selected?._id || ''} onChange={(e) => select(e.target.value)}>
          {list.map((c) => <option key={c._id} value={c._id}>{c.displayName} · {c.ageGroup}</option>)}
        </select>
      </div>
    </div>
  );
}

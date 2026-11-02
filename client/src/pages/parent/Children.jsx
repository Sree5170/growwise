import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BarChart3, Pencil, Rocket, Trash2, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useChildren } from '../../context/ChildrenContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { childService } from '../../services/childService.js';
import { CardSkeleton, EmptyState, ErrorState } from '../../components/feedback/Feedback.jsx';
import { PageHeader, Pill, ProgressBar } from '../../components/ui/Bits.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal, { ConfirmDialog } from '../../components/modals/Modal.jsx';
import { ChipGroup, ErrorSummary, Field } from '../../components/forms/Field.jsx';
import { AGE_GROUPS, AVATARS, CATEGORIES, GOALS, INTERESTS, avatarEmoji } from '../../utils/constants.js';

const toForm = (c) => ({
  displayName: c?.displayName || '', ageGroup: c?.ageGroup || '', avatar: c?.avatar || 'sprout', interests: c?.interests || [], goals: c?.goals || [],
  availableMinutes: c?.preferences?.availableMinutes ?? 30, preferredCategories: c?.preferences?.preferredCategories || [],
  materials: (c?.preferences?.materialsAvailable || []).join(', '), hasOutdoorSpace: c?.preferences?.hasOutdoorSpace ?? true, adultAvailable: c?.preferences?.adultAvailable ?? true,
  weeklyGoalMinutes: c?.weeklyGoalMinutes ?? 150, weeklyGoalTasks: c?.weeklyGoalTasks ?? 5,
  largeText: c?.accessibilityPreferences?.largeText ?? false, reducedMotion: c?.accessibilityPreferences?.reducedMotion ?? false,
});
const toPayload = (v) => ({
  displayName: v.displayName.trim(), ageGroup: v.ageGroup, avatar: v.avatar, interests: v.interests, goals: v.goals,
  preferences: { availableMinutes: Number(v.availableMinutes), preferredCategories: v.preferredCategories, hasOutdoorSpace: v.hasOutdoorSpace, adultAvailable: v.adultAvailable,
    materialsAvailable: v.materials.split(',').map((m) => m.trim()).filter(Boolean).slice(0, 30) },
  weeklyGoalMinutes: Number(v.weeklyGoalMinutes), weeklyGoalTasks: Number(v.weeklyGoalTasks),
  accessibilityPreferences: { largeText: v.largeText, reducedMotion: v.reducedMotion },
});

function ChildFormModal({ open, child, onClose, onSaved }) {
  const { register, handleSubmit, control, reset, setError: setFieldError, formState: { errors, isSubmitting } } = useForm({ defaultValues: toForm(child) });
  const [error, setError] = useState(null);
  useEffect(() => { if (open) { reset(toForm(child)); setError(null); } }, [open, child, reset]);
  const onSubmit = async (v) => {
    setError(null);
    try {
      const saved = child ? await childService.update(child._id, toPayload(v)) : await childService.create(toPayload(v));
      toast.success(child ? 'Profile updated' : `${saved.displayName}’s profile is ready`); onSaved(saved); onClose();
    } catch (e) { (e.details || []).forEach((d) => d.field && setFieldError(d.field, { message: d.message })); setError(e); }
  };
  return (
    <Modal open={open} onClose={onClose} title={child ? `Edit ${child.displayName}` : 'Add a child'} wide>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <ErrorSummary error={error} />
        <p className="rounded-xl bg-mint-50 p-3 text-sm text-mint-800">We only ask for a nickname and age group. Please don’t use a full name.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nickname" maxLength={30} error={errors.displayName?.message} {...register('displayName', { required: 'Enter a nickname', maxLength: { value: 30, message: 'Keep it under 30 characters' }, validate: (v) => !!v.trim() || 'Enter a nickname' })} />
          <Field as="select" label="Age group" error={errors.ageGroup?.message} {...register('ageGroup', { required: 'Choose an age group' })}>
            <option value="">Select…</option>{AGE_GROUPS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </Field>
        </div>
        <Controller control={control} name="avatar" render={({ field }) => (
          <fieldset><legend className="field-label">Avatar</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Avatar">
              {AVATARS.map((a) => (
                <label key={a.key} className={`grid h-12 w-12 cursor-pointer place-items-center rounded-xl border-2 text-2xl has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sky-500 ${field.value === a.key ? 'border-mint-700 bg-mint-50' : 'border-transparent bg-white'}`}>
                  <input type="radio" className="sr-only" name="avatar" value={a.key} checked={field.value === a.key} onChange={() => field.onChange(a.key)} /><span aria-hidden="true">{a.emoji}</span><span className="sr-only">{a.key}</span>
                </label>))}
            </div></fieldset>)} />
        <Controller control={control} name="interests" render={({ field }) => <ChipGroup legend="Interests (up to 8)" options={INTERESTS.map((i) => ({ value: i, label: i }))} value={field.value} onChange={field.onChange} max={8} />} />
        <Controller control={control} name="goals" render={({ field }) => <ChipGroup legend="Goals" options={GOALS} value={field.value} onChange={field.onChange} />} />
        <details className="rounded-xl border border-ink/10 bg-white p-4" open={!!child}>
          <summary className="cursor-pointer font-bold">Recommendation settings</summary>
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field type="number" label="Available minutes" min={5} max={240} error={errors.availableMinutes?.message} {...register('availableMinutes', { required: 'Required', min: { value: 5, message: 'At least 5' }, max: { value: 240, message: 'At most 240' } })} />
              <Field type="number" label="Weekly movement goal (min)" min={0} max={2000} error={errors.weeklyGoalMinutes?.message} {...register('weeklyGoalMinutes', { min: { value: 0, message: 'Cannot be negative' }, max: { value: 2000, message: 'At most 2000' } })} />
              <Field type="number" label="Weekly mission goal" min={0} max={50} error={errors.weeklyGoalTasks?.message} {...register('weeklyGoalTasks', { min: { value: 0, message: 'Cannot be negative' }, max: { value: 50, message: 'At most 50' } })} />
            </div>
            <Controller control={control} name="preferredCategories" render={({ field }) => <ChipGroup legend="Preferred categories" options={CATEGORIES} value={field.value} onChange={field.onChange} />} />
            <Field label="Materials you have at home" hint="Comma separated, e.g. paper, crayons, balloon" {...register('materials')} />
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {[['hasOutdoorSpace', 'Outdoor space is available'], ['adultAvailable', 'An adult is usually available'], ['largeText', 'Larger text in child mode'], ['reducedMotion', 'Reduce animations']].map(([k, l]) => (
                <label key={k} className="flex min-h-[44px] items-center gap-2 font-medium"><input type="checkbox" className="h-5 w-5 accent-mint-700" {...register(k)} />{l}</label>))}
            </div>
          </div>
        </details>
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" loading={isSubmitting}>{child ? 'Save changes' : 'Create profile'}</Button></div>
      </form>
    </Modal>
  );
}

function ChildCard({ child, onEdit, onDelete }) {
  const { select } = useChildren(); const { startChildMode } = useAuth(); const navigate = useNavigate();
  const data = useAsync(() => childService.get(child._id), [child._id, child.updatedAt]);
  const s = data.data?.summary;
  return (
    <article className="card p-5">
      <div className="flex items-start gap-4">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-sun-100 text-4xl" aria-hidden="true">{avatarEmoji(child.avatar)}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold">{child.displayName}</h2>
          <p className="text-ink-soft">Ages {child.ageGroup.replace('-', '–')}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">{child.interests.map((i) => <Pill key={i} tone="sky">{i}</Pill>)}{child.goals.map((g) => <Pill key={g} tone="mint">{GOALS.find((x) => x.value === g)?.label}</Pill>)}</div>
        </div>
      </div>
      <div className="mt-4 rounded-xl bg-paper p-3 text-sm">
        {data.loading && !s ? <p className="text-ink-soft">Loading progress…</p> : s ? (
          <div className="space-y-2">
            <p className="flex justify-between"><span>Level {s.points.level} · {s.points.name}</span><strong>{s.points.total} points</strong></p>
            <ProgressBar value={s.points.pointsIntoLevel} max={s.points.pointsForNextLevel} tone="sun" label="Progress to next level" />
            <p className="text-ink-soft">{s.week.approvedTasks} missions approved this week · {s.badges.earned} badges · {s.week.physicalMinutes} min movement</p>
          </div>) : <p className="text-ink-soft">Progress is unavailable right now.</p>}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={async () => { try { await startChildMode(child._id); navigate('/child/dashboard'); } catch (e) { toast.error(e.message); } }}><Rocket className="h-4 w-4" aria-hidden="true" />Child mode</Button>
        <Button variant="secondary" onClick={() => { select(child._id); navigate('/parent/progress'); }}><BarChart3 className="h-4 w-4" aria-hidden="true" />Progress</Button>
        <Button variant="secondary" onClick={() => onEdit(child)}><Pencil className="h-4 w-4" aria-hidden="true" />Edit</Button>
        <Button variant="ghost" onClick={() => onDelete(child)} aria-label={`Delete ${child.displayName}`}><Trash2 className="h-4 w-4 text-coral-600" aria-hidden="true" /></Button>
      </div>
    </article>
  );
}

export default function Children() {
  useDocumentTitle('Children');
  const { list, loading, error, reload, select } = useChildren();
  const [params, setParams] = useSearchParams();
  const [form, setForm] = useState({ open: false, child: null }); const [del, setDel] = useState(null); const [busy, setBusy] = useState(false);
  useEffect(() => { if (params.get('new')) { setForm({ open: true, child: null }); setParams({}, { replace: true }); } }, [params, setParams]);
  const remove = async () => {
    setBusy(true);
    try { await childService.remove(del._id); toast.success(`${del.displayName}’s profile and records were deleted`); setDel(null); await reload(); } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <>
      <PageHeader title="Children" subtitle="Manage profiles, goals and preferences." actions={<Button onClick={() => setForm({ open: true, child: null })}><UserPlus className="h-5 w-5" aria-hidden="true" />Add a child</Button>} />
      {loading && !list.length ? <div className="grid gap-4 md:grid-cols-2"><CardSkeleton lines={4} /><CardSkeleton lines={4} /></div>
        : error ? <ErrorState error={error} onRetry={reload} />
        : list.length === 0 ? <EmptyState emoji="🧒" title="No child profiles yet" action={<Button onClick={() => setForm({ open: true, child: null })}>Add your first child</Button>}>Add a nickname and age group to unlock age-appropriate missions, games and lessons.</EmptyState>
        : <div className="grid gap-4 md:grid-cols-2">{list.map((c) => <ChildCard key={c._id} child={c} onEdit={(x) => setForm({ open: true, child: x })} onDelete={setDel} />)}</div>}
      <ChildFormModal open={form.open} child={form.child} onClose={() => setForm({ open: false, child: null })} onSaved={async (saved) => { await reload(); if (!form.child) select(saved._id); }} />
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={remove} loading={busy} danger confirmLabel="Delete profile" title={`Delete ${del?.displayName}?`}
        message="This permanently deletes the profile and all of its tasks, activity records, game results, lesson progress and badges. This cannot be undone." />
    </>
  );
}
export { Link };

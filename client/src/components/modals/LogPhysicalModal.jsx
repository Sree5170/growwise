import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Modal from './Modal.jsx';
import Button from '../ui/Button.jsx';
import { ErrorSummary, Field } from '../forms/Field.jsx';
import { progressService } from '../../services/progressService.js';
import { PHYSICAL_TYPES } from '../../utils/constants.js';
import { dateInputToISO, toISODate } from '../../utils/format.js';

// Manual tracking only: no GPS, camera or wearables. childId is omitted in child mode (server uses the session).
export default function LogPhysicalModal({ open, onClose, childId, isParent, onSaved }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ defaultValues: { activityType: 'walking', durationMinutes: 20, activityDate: toISODate(), note: '' } });
  const [error, setError] = useState(null);
  useEffect(() => { if (open) { reset({ activityType: 'walking', durationMinutes: 20, activityDate: toISODate(), note: '' }); setError(null); } }, [open, reset]);
  const onSubmit = async (v) => {
    setError(null);
    try {
      await progressService.logPhysical({ ...(childId ? { childId } : {}), activityType: v.activityType, durationMinutes: Number(v.durationMinutes), activityDate: dateInputToISO(v.activityDate), note: v.note.trim() });
      toast.success('Movement saved', { icon: '🏃' }); onSaved?.(); onClose();
    } catch (e) { setError(e); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Log movement">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <ErrorSummary error={error} />
        <p className="text-sm text-ink-soft">{isParent ? 'Entries you add are marked “parent-reported”.' : 'Your grown-up can confirm this later.'} Minutes are typed in by hand, not measured by a device.</p>
        <Field as="select" label="What did you do?" {...register('activityType')}>{PHYSICAL_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field type="number" label="Minutes" min={1} max={600} inputMode="numeric" error={errors.durationMinutes?.message} {...register('durationMinutes', { required: 'Enter the minutes', min: { value: 1, message: 'At least 1 minute' }, max: { value: 600, message: 'At most 600 minutes' }, validate: (v) => Number.isInteger(Number(v)) || 'Use whole minutes' })} />
          <Field type="date" label="Date" max={toISODate()} error={errors.activityDate?.message} {...register('activityDate', { required: 'Choose a date' })} />
        </div>
        <Field label="Note (optional)" maxLength={200} {...register('note')} placeholder="e.g. Played tag with friends" />
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" loading={isSubmitting}>Save</Button></div>
      </form>
    </Modal>
  );
}

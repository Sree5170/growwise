import { forwardRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { authService } from '../../services/authService.js';
import { PageHeader, Section } from '../../components/ui/Bits.jsx';
import Button from '../../components/ui/Button.jsx';
import { ErrorSummary, Field } from '../../components/forms/Field.jsx';
import Modal from '../../components/modals/Modal.jsx';

const Toggle = forwardRef(function Toggle({ label, hint, ...rest }, ref) {
  return (
    <label className="flex min-h-[44px] items-start gap-3 py-1.5"><input ref={ref} type="checkbox" className="mt-1 h-5 w-5 accent-mint-700" {...rest} /><span><span className="block font-semibold">{label}</span>{hint && <span className="block text-sm text-ink-soft">{hint}</span>}</span></label>
  );
});

function ProfileForm() {
  const { user, refreshUser } = useAuth(); const [error, setError] = useState(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ defaultValues: { name: user.name, dailyReminder: user.notificationPreferences?.dailyReminder, reminderTime: user.notificationPreferences?.reminderTime, weeklyReport: user.notificationPreferences?.weeklyReport, verificationAlerts: user.notificationPreferences?.verificationAlerts, hideChildNotesInReports: user.privacySettings?.hideChildNotesInReports } });
  const onSubmit = async (v) => {
    setError(null);
    try {
      refreshUser(await authService.updateProfile({ name: v.name.trim(), notificationPreferences: { dailyReminder: v.dailyReminder, reminderTime: v.reminderTime, weeklyReport: v.weeklyReport, verificationAlerts: v.verificationAlerts }, privacySettings: { hideChildNotesInReports: !!v.hideChildNotesInReports } }));
      toast.success('Settings saved');
    } catch (e) { setError(e); }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
      <ErrorSummary error={error} />
      <Section title="Your profile"><div className="card grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Name" error={errors.name?.message} {...register('name', { required: 'Enter your name', minLength: { value: 2, message: 'At least 2 characters' }, maxLength: { value: 80, message: 'Too long' } })} />
        <Field label="Email" value={user.email} readOnly hint="Email cannot be changed in this version." />
      </div></Section>
      <Section title="Reminder preferences"><div className="card p-5">
        <Toggle label="Daily mission reminder" hint="Shown in the app dashboard. Email and push delivery are not part of this version." {...register('dailyReminder')} />
        <div className="my-2 max-w-[10rem]"><Field type="time" label="Reminder time" error={errors.reminderTime?.message} {...register('reminderTime', { required: 'Choose a time' })} /></div>
        <Toggle label="Weekly report" {...register('weeklyReport')} /><Toggle label="Tell me when a mission is waiting for review" {...register('verificationAlerts')} />
      </div></Section>
      <Section title="Privacy"><div className="card p-5">
        <Toggle label="Hide my child’s notes in weekly reports" hint="Reports then show only numbers, not notes your child typed." {...register('hideChildNotesInReports')} />
        <p className="mt-3 text-sm text-ink-soft">GrowWise stores a nickname and age group for each child. No child email, photo or location is collected. See the <Link to="/privacy" className="underline">privacy policy</Link>. To delete one child’s data, use <Link to="/parent/children" className="underline">Children</Link>.</p>
      </div></Section>
      <Button type="submit" loading={isSubmitting}>Save settings</Button>
    </form>
  );
}

function PasswordForm() {
  const [error, setError] = useState(null);
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm({ defaultValues: { currentPassword: '', newPassword: '', confirm: '' } });
  const onSubmit = async (v) => {
    setError(null);
    try { await authService.changePassword({ currentPassword: v.currentPassword, newPassword: v.newPassword }); toast.success('Password updated'); reset(); } catch (e) { setError(e); }
  };
  return (
    <Section title="Change password">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="card space-y-4 p-5"><ErrorSummary error={error} />
        <Field type="password" label="Current password" autoComplete="current-password" error={errors.currentPassword?.message} {...register('currentPassword', { required: 'Enter your current password' })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field type="password" label="New password" autoComplete="new-password" hint="At least 8 characters, with a letter and a number." error={errors.newPassword?.message} {...register('newPassword', { required: 'Choose a new password', minLength: { value: 8, message: 'At least 8 characters' }, maxLength: { value: 72, message: 'At most 72 characters' }, validate: (v) => (/[A-Za-z]/.test(v) && /\d/.test(v)) || 'Include a letter and a number' })} />
          <Field type="password" label="Confirm new password" autoComplete="new-password" error={errors.confirm?.message} {...register('confirm', { required: 'Re-enter the new password', validate: (v) => v === watch('newPassword') || 'Passwords do not match' })} />
        </div>
        <Button type="submit" loading={isSubmitting}>Update password</Button></form>
    </Section>
  );
}

export default function Settings() {
  useDocumentTitle('Settings');
  const { user, logout } = useAuth(); const navigate = useNavigate();
  const [open, setOpen] = useState(false); const [pw, setPw] = useState(''); const [err, setErr] = useState(null); const [busy, setBusy] = useState(false);
  const del = async (e) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try { await authService.deleteAccount(pw); toast.success('Your account and all child data were deleted'); await logout(); navigate('/'); } catch (x) { setErr(x); } finally { setBusy(false); }
  };
  return (
    <>
      <PageHeader title="Settings" subtitle={user.email} />
      <div className="max-w-3xl space-y-8">
        <ProfileForm /><PasswordForm />
        <Section title="Account">
          <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
            <Button variant="secondary" onClick={logout}><LogOut className="h-5 w-5" aria-hidden="true" />Log out</Button>
            <Button variant="danger" onClick={() => { setOpen(true); setPw(''); setErr(null); }}>Delete account</Button>
          </div>
        </Section>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Delete your account?">
        <form onSubmit={del} noValidate className="space-y-4">
          <p className="text-ink-soft">This permanently deletes your account, every child profile and all tasks, records, game results and badges. It cannot be undone.</p>
          <ErrorSummary error={err} />
          <Field type="password" label="Enter your password to confirm" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" variant="danger" loading={busy} disabled={!pw}>Delete everything</Button></div>
        </form>
      </Modal>
    </>
  );
}

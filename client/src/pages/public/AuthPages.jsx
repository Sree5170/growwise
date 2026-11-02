import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';
import { Field, ErrorSummary } from '../../components/forms/Field.jsx';
import Button from '../../components/ui/Button.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { Splash } from '../../components/layout/ProtectedRoute.jsx';

function Shell({ title, subtitle, children, footer }) {
  return (
    <div className="mx-auto grid max-w-md px-4 py-12">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold">{title}</h1><p className="mt-1 text-ink-soft">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
      <p className="mt-5 text-center text-ink-soft">{footer}</p>
    </div>
  );
}

const emailRule = { required: 'Enter your email address', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' } };

function useRedirectIfAuthed() {
  const { user, isChild, loading } = useAuth();
  return { loading, to: user ? (isChild ? '/child/dashboard' : '/parent/dashboard') : null };
}

export function Login() {
  useDocumentTitle('Log in');
  const { login } = useAuth(); const navigate = useNavigate(); const loc = useLocation();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ defaultValues: { email: '', password: '' } });
  const [error, setError] = useState(null);
  const redirect = useRedirectIfAuthed();
  if (redirect.loading) return <Splash />;
  if (redirect.to) return <Navigate to={redirect.to} replace />;
  const onSubmit = async (values) => {
    setError(null);
    try { await login(values); toast.success('Welcome back!'); navigate(loc.state?.from?.startsWith('/parent') ? loc.state.from : '/parent/dashboard', { replace: true }); }
    catch (e) { setError(e); }
  };
  return (
    <Shell title="Welcome back" subtitle="Log in to your parent account." footer={<>New to GrowWise? <Link to="/register" className="font-bold text-mint-700 underline">Create an account</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <ErrorSummary error={error} />
        <Field label="Email" type="email" autoComplete="email" inputMode="email" error={errors.email?.message} {...register('email', emailRule)} />
        <Field label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password', { required: 'Enter your password' })} />
        <Button type="submit" loading={isSubmitting} className="w-full">Log in</Button>
      </form>
    </Shell>
  );
}

export function Register() {
  useDocumentTitle('Create account');
  const { register: signUp } = useAuth(); const navigate = useNavigate();
  const { register, handleSubmit, watch, setError: setFieldError, formState: { errors, isSubmitting } } = useForm({ defaultValues: { name: '', email: '', password: '', confirm: '' } });
  const [error, setError] = useState(null);
  const redirect = useRedirectIfAuthed();
  if (redirect.loading) return <Splash />;
  if (redirect.to) return <Navigate to={redirect.to} replace />;
  const onSubmit = async ({ name, email, password }) => {
    setError(null);
    try { await signUp({ name, email, password }); toast.success('Account created. Let’s add your first child!'); navigate('/parent/children', { replace: true }); }
    catch (e) {
      (e.details || []).forEach((d) => d.field && setFieldError(d.field, { message: d.message }));
      setError(e);
    }
  };
  return (
    <Shell title="Create your parent account" subtitle="Free for families. Takes about a minute." footer={<>Already have an account? <Link to="/login" className="font-bold text-mint-700 underline">Log in</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <ErrorSummary error={error} />
        <Field label="Your name" autoComplete="name" error={errors.name?.message} {...register('name', { required: 'Enter your name', minLength: { value: 2, message: 'Name must be at least 2 characters' }, maxLength: { value: 80, message: 'Name is too long' } })} />
        <Field label="Email" type="email" autoComplete="email" inputMode="email" error={errors.email?.message} {...register('email', emailRule)} />
        <Field label="Password" type="password" autoComplete="new-password" hint="At least 8 characters, with a letter and a number." error={errors.password?.message}
          {...register('password', { required: 'Choose a password', minLength: { value: 8, message: 'Password must be at least 8 characters' }, maxLength: { value: 72, message: 'Password must be at most 72 characters' },
            validate: (v) => (/[A-Za-z]/.test(v) && /\d/.test(v)) || 'Password must include a letter and a number' })} />
        <Field label="Confirm password" type="password" autoComplete="new-password" error={errors.confirm?.message}
          {...register('confirm', { required: 'Re-enter your password', validate: (v) => v === watch('password') || 'Passwords do not match' })} />
        <Button type="submit" loading={isSubmitting} className="w-full">Create account</Button>
        <p className="text-center text-sm text-ink-faint">By continuing you agree to our <Link to="/privacy" className="underline">privacy policy</Link>.</p>
      </form>
    </Shell>
  );
}

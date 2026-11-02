import { AlertTriangle, Loader2 } from 'lucide-react';

export function Spinner({ label = 'Loading' }) {
  return <span role="status" className="inline-flex items-center gap-2 text-ink-soft"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /><span className="sr-only">{label}</span></span>;
}

export function Skeleton({ className = '' }) {
  return <div aria-hidden="true" className={`relative overflow-hidden rounded-xl bg-ink/[0.07] ${className}`}><div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" /></div>;
}

export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="card p-5" role="status" aria-label="Loading">
      <Skeleton className="mb-4 h-5 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => <Skeleton key={i} className={`mb-2 h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />)}
    </div>
  );
}

export function EmptyState({ emoji = '🌱', title, children, action }) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-3 text-4xl" aria-hidden="true">{emoji}</div>
      <h3 className="text-lg font-bold">{title}</h3>
      {children && <p className="mt-1.5 max-w-md text-ink-soft">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'We could not load this' }) {
  return (
    <div role="alert" className="card flex flex-col items-center border-coral-200 bg-coral-50 px-6 py-8 text-center">
      <AlertTriangle className="mb-2 h-8 w-8 text-coral-600" aria-hidden="true" />
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-1 max-w-md text-ink-soft">{error?.message || 'Please try again.'}</p>
      {onRetry && <button type="button" onClick={onRetry} className="btn-secondary mt-4">Try again</button>}
    </div>
  );
}

// Standard loading / error / empty / content switch used by pages.
export function AsyncBoundary({ state, skeleton, children }) {
  // Skeleton only while there is nothing to show. "No data and no error yet" also counts as loading, which
  // covers the first render before an effect starts the request. During a reload the previous data stays
  // on screen so open dialogs and form state are not thrown away.
  if (state.data == null) {
    if (state.error && !state.loading) return <ErrorState error={state.error} onRetry={state.reload} />;
    return skeleton || <CardSkeleton />;
  }
  return children(state.data);
}

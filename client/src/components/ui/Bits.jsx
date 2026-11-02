// Small presentational pieces shared across pages.
const TONES = { mint: 'bg-mint-100 text-mint-800', sky: 'bg-sky-100 text-sky-700', coral: 'bg-coral-100 text-coral-700', sun: 'bg-sun-100 text-sun-700', gray: 'bg-ink/[0.07] text-ink-soft' };

export function Pill({ tone = 'gray', children, className = '' }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[tone]} ${className}`}>{children}</span>;
}

export function ProgressBar({ value, max = 100, label, tone = 'mint', className = '' }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const bar = { mint: 'bg-mint-600', sky: 'bg-sky-500', coral: 'bg-coral-500', sun: 'bg-sun-400' }[tone];
  return (
    <div className={className}>
      <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label} className="h-3 w-full overflow-hidden rounded-full bg-ink/10">
        <div className={`h-full rounded-full transition-[width] duration-500 ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, hint, tone = 'mint', children }) {
  const iconTone = { mint: 'bg-mint-100 text-mint-700', sky: 'bg-sky-100 text-sky-600', coral: 'bg-coral-100 text-coral-600', sun: 'bg-sun-100 text-sun-700' }[tone];
  return (
    <div className="card p-5">
      <div className="flex items-start gap-3">
        {Icon && <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${iconTone}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>}
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-soft">{label}</p>
          <p className="font-display text-2xl font-bold leading-tight">{value}</p>
          {hint && <p className="mt-0.5 text-sm text-ink-faint">{hint}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>{subtitle && <p className="mt-1 text-ink-soft">{subtitle}</p>}</div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Section({ title, action, children, className = '' }) {
  return (
    <section className={className} aria-label={title}>
      <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-lg font-bold">{title}</h2>{action}</div>
      {children}
    </section>
  );
}

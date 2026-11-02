import { forwardRef, useId } from 'react';

// Accessible field: label bound to input, error linked with aria-describedby and announced.
export const Field = forwardRef(function Field({ label, error, hint, as = 'input', children, className = '', ...rest }, ref) {
  const id = useId(); const errId = `${id}-err`; const hintId = `${id}-hint`;
  const Tag = as;
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">{label}</label>
      <Tag id={id} ref={ref} aria-invalid={error ? 'true' : undefined} aria-describedby={[error && errId, hint && hintId].filter(Boolean).join(' ') || undefined}
        className={`field-input ${error ? 'border-coral-500' : ''} ${as === 'textarea' ? 'min-h-[96px]' : ''}`} {...rest}>{children}</Tag>
      {hint && !error && <p id={hintId} className="mt-1.5 text-sm text-ink-faint">{hint}</p>}
      {error && <p id={errId} role="alert" className="field-error">{error}</p>}
    </div>
  );
});

// Toggle chips for multi-select (interests, goals). Uses real checkboxes for keyboard and screen readers.
export function ChipGroup({ legend, options, value = [], onChange, max }) {
  const toggle = (v) => {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else if (!max || value.length < max) onChange([...value, v]);
  };
  return (
    <fieldset>
      <legend className="field-label">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const v = o.value ?? o; const label = o.label ?? o; const on = value.includes(v);
          return (
            <label key={v} className={`cursor-pointer select-none rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sky-500 ${on ? 'border-mint-700 bg-mint-700 text-white' : 'border-ink/20 bg-white text-ink hover:bg-mint-50'}`}>
              <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(v)} />{label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ErrorSummary({ error }) {
  if (!error) return null;
  return <div role="alert" className="mb-4 rounded-xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700">{error.message}</div>;
}

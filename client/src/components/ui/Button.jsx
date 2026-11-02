import { Loader2 } from 'lucide-react';

export default function Button({ variant = 'primary', loading = false, children, className = '', disabled, type = 'button', ...rest }) {
  return (
    <button type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={`btn-${variant} ${className}`} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

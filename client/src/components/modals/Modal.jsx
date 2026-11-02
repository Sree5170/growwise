import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import Button from '../ui/Button.jsx';

// Accessible dialog: role=dialog, aria-modal, Esc to close, focus moves in and is restored, Tab is trapped.
export default function Modal({ open, onClose, title, children, wide = false }) {
  const ref = useRef(null); const prev = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    prev.current = document.activeElement;
    const el = ref.current;
    const focusables = () => el.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
    (focusables()[1] || focusables()[0])?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const f = [...focusables()].filter((n) => !n.disabled); if (!f.length) return;
        const first = f[0]; const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey); document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; prev.current?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-paper p-5 shadow-lift sm:rounded-3xl sm:p-6 ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-xl font-extrabold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg p-2 text-ink-soft hover:bg-ink/5"><X className="h-5 w-5" aria-hidden="true" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-ink-soft">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

export const toISODate = (d = new Date()) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
// A date input value (yyyy-mm-dd) -> ISO at local noon so timezone shifts never change the calendar day.
export const dateInputToISO = (v) => new Date(`${v}T12:00:00`).toISOString();
export const fmtDate = (d, opts = { day: 'numeric', month: 'short' }) => new Date(d).toLocaleDateString(undefined, opts);
export const fmtShortDay = (key) => new Date(`${key}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' });
export const pct = (n, d) => (d ? Math.min(100, Math.round((n / d) * 100)) : 0);
export const greeting = (h = new Date().getHours()) => (h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
export const isOverdue = (task) => ['assigned', 'needs-revision'].includes(task.status) && new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));

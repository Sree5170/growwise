import axios from 'axios';

// Centralised Axios client. Cookies carry the session; the custom header is the CSRF defence the API requires.
export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || ''}/api`,
  withCredentials: true,
  headers: { 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' },
  timeout: 15000,
});

let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export class ApiError extends Error {
  constructor(message, status, details) { super(message); this.status = status; this.details = details || []; }
  fieldMessage(field) { return this.details.find((d) => d.field === field)?.message; }
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const message = err.response?.data?.error?.message
      || (err.code === 'ECONNABORTED' ? 'The request timed out. Please try again.' : !err.response ? 'Cannot reach the server. Check your connection and try again.' : 'Something went wrong.');
    if (status === 401 && onUnauthorized && !err.config?.url?.startsWith('/auth/')) onUnauthorized();
    return Promise.reject(new ApiError(message, status, err.response?.data?.error?.details));
  },
);

// All endpoints return { success, data, meta? }. Helpers unwrap the envelope.
export const unwrap = (p) => p.then((r) => r.data.data);
export const unwrapWithMeta = (p) => p.then((r) => ({ data: r.data.data, meta: r.data.meta }));

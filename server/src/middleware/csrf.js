import { env } from '../config/env.js';
import { forbidden } from '../utils/AppError.js';

// Cookie auth => defend state-changing requests against CSRF with three layers:
//  1. SameSite cookie attribute (set in authenticate.js)
//  2. If the browser sends an Origin header it must be the configured client origin
//  3. A custom header is required. Browsers cannot add custom headers cross-site without a CORS
//     preflight, and our CORS policy only allows CLIENT_ORIGIN, so forged cross-site requests fail.
const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);
export function csrfProtection(req, _res, next) {
  if (SAFE.has(req.method)) return next();
  const origin = req.get('origin');
  if (origin && origin !== env.clientOrigin) return next(forbidden('Request origin not allowed'));
  if (req.get('x-requested-with') !== 'XMLHttpRequest') return next(forbidden('Missing required request header'));
  next();
}

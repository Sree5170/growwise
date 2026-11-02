import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../modules/auth/user.model.js';
import { unauthorized } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const COOKIE_NAME = 'gw_token';

export function signToken(user, childId) {
  // 'child' sessions are issued only by a logged-in parent and are locked to one child.
  const payload = { sub: String(user._id), mode: childId ? 'child' : 'parent', ...(childId ? { childId: String(childId) } : {}) };
  return jwt.sign(payload, env.jwtSecret, { expiresIn: childId ? '12h' : env.jwtExpiresIn });
}

export function cookieOptions(maxAgeMs) {
  return {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.crossSite ? 'none' : 'lax',
    path: '/',
    ...(maxAgeMs ? { maxAge: maxAgeMs } : {}),
  };
}

export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) throw unauthorized();
  let payload;
  try { payload = jwt.verify(token, env.jwtSecret); } catch { throw unauthorized('Your session has expired. Please log in again.'); }
  const user = await User.findById(payload.sub);
  if (!user) throw unauthorized();
  req.user = user; // role always comes from the database, never from the client
  req.auth = payload.mode === 'child'
    ? { role: 'child', childId: payload.childId }
    : { role: user.role }; // 'parent' | 'admin'
  next();
});

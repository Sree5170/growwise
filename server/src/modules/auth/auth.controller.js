import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/response.js';
import { COOKIE_NAME, cookieOptions, signToken } from '../../middleware/authenticate.js';
import { registerParent, verifyCredentials, checkPassword } from './auth.service.js';
import { Child } from '../children/child.model.js';
import { unauthorized } from '../../utils/AppError.js';

const WEEK = 7 * 24 * 3600 * 1000;

export const register = asyncHandler(async (req, res) => {
  const user = await registerParent(req.body);
  res.cookie(COOKIE_NAME, signToken(user), cookieOptions(WEEK));
  ok(res, { user, mode: 'parent' }, 201);
});

export const login = asyncHandler(async (req, res) => {
  const user = await verifyCredentials(req.body.email, req.body.password);
  res.cookie(COOKIE_NAME, signToken(user), cookieOptions(WEEK));
  ok(res, { user, mode: 'parent' });
});

export const logout = (_req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions());
  ok(res, { message: 'Logged out' });
};

export const me = asyncHandler(async (req, res) => {
  const mode = req.auth.role === 'child' ? 'child' : 'parent';
  const child = mode === 'child' ? await Child.findById(req.auth.childId) : null;
  ok(res, { user: req.user, mode, child });
});

// Leaving child mode requires the parent's password (a simple parental gate).
export const exitChildMode = asyncHandler(async (req, res) => {
  if (req.auth.role !== 'child') throw unauthorized('Not in child mode');
  if (!(await checkPassword(req.user._id, req.body.password))) throw unauthorized('Incorrect parent password');
  res.cookie(COOKIE_NAME, signToken(req.user), cookieOptions(WEEK));
  ok(res, { user: req.user, mode: 'parent' });
});

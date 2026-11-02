import { Router } from 'express';
import { authenticate, COOKIE_NAME, cookieOptions } from '../../middleware/authenticate.js';
import { authorizeRole } from '../../middleware/authorizeRole.js';
import { validate } from '../../middleware/validateRequest.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/response.js';
import { User } from '../auth/user.model.js';
import { Child } from '../children/child.model.js';
import { hashPassword, checkPassword } from '../auth/auth.service.js';
import { deleteChildCascade } from '../children/children.service.js';
import { badRequest, unauthorized } from '../../utils/AppError.js';
import { updateProfileSchema, changePasswordSchema, deleteAccountSchema } from './parents.validation.js';

const r = Router();
r.use(authenticate, authorizeRole('parent', 'admin')); // child sessions can never reach account settings

r.get('/me', (req, res) => ok(res, req.user));
r.patch('/me', validate(updateProfileSchema), asyncHandler(async (req, res) => {
  const { name, notificationPreferences, privacySettings } = req.body;
  if (name) req.user.name = name;
  if (notificationPreferences) Object.assign(req.user.notificationPreferences, notificationPreferences);
  if (privacySettings) Object.assign(req.user.privacySettings, privacySettings);
  await req.user.save();
  ok(res, req.user);
}));
r.post('/me/password', validate(changePasswordSchema), asyncHandler(async (req, res) => {
  if (!(await checkPassword(req.user._id, req.body.currentPassword))) throw badRequest('Current password is incorrect');
  await User.updateOne({ _id: req.user._id }, { $set: { passwordHash: await hashPassword(req.body.newPassword) } });
  ok(res, { message: 'Password updated' });
}));
r.delete('/me', validate(deleteAccountSchema), asyncHandler(async (req, res) => {
  if (!(await checkPassword(req.user._id, req.body.password))) throw unauthorized('Incorrect password');
  const kids = await Child.find({ parentId: req.user._id }).select('_id');
  for (const k of kids) await deleteChildCascade(k._id);
  await User.deleteOne({ _id: req.user._id });
  res.clearCookie(COOKIE_NAME, cookieOptions());
  ok(res, { message: 'Account and all child data deleted' });
}));
export default r;

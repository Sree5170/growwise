import mongoose from 'mongoose';
import { Child } from '../modules/children/child.model.js';
import { forbidden, notFound } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Resolves a child id from params.id / params.childId / body.childId and verifies:
//  1. the child belongs to the logged-in parent (ownership)
//  2. a child-mode session may only touch its own child
// Returns 404 (not 403) for other parents' children to avoid leaking existence.
export const authorizeChildAccess = (source = 'params') => asyncHandler(async (req, _res, next) => {
  const raw = source === 'body' ? req.body?.childId : (req.params.childId || req.params.id);
  if (!raw || !mongoose.isValidObjectId(raw)) throw notFound('Child not found');
  const child = await Child.findOne({ _id: raw, parentId: req.user._id });
  if (!child) throw notFound('Child not found');
  if (req.auth.role === 'child' && String(child._id) !== req.auth.childId) throw forbidden('This profile cannot access that child');
  req.child = child;
  next();
});

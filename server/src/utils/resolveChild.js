import mongoose from 'mongoose';
import { Child } from '../modules/children/child.model.js';
import { forbidden, notFound, badRequest } from './AppError.js';

// For endpoints where childId is optional input: child sessions use their own child automatically;
// parents must name one of THEIR children.
export async function resolveChild(req, childId) {
  const id = req.auth.role === 'child' ? req.auth.childId : childId;
  if (!id) throw badRequest('childId is required');
  if (!mongoose.isValidObjectId(id)) throw notFound('Child not found');
  if (req.auth.role === 'child' && childId && String(childId) !== req.auth.childId) throw forbidden('This profile cannot access that child');
  const child = await Child.findOne({ _id: id, parentId: req.user._id });
  if (!child) throw notFound('Child not found');
  return child;
}

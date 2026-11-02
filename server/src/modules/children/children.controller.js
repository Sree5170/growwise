import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/response.js';
import { Child } from './child.model.js';
import * as service from './children.service.js';
import { COOKIE_NAME, cookieOptions, signToken } from '../../middleware/authenticate.js';
import { getChildSummary } from '../progress/progress.service.js';

export const create = asyncHandler(async (req, res) => ok(res, await service.createChild(req.user._id, req.body), 201));

export const list = asyncHandler(async (req, res) => {
  const children = await Child.find({ parentId: req.user._id }).sort({ createdAt: 1 });
  ok(res, children);
});

export const getOne = asyncHandler(async (req, res) => ok(res, { child: req.child, summary: await getChildSummary(req.child) }));

export const update = asyncHandler(async (req, res) => ok(res, await service.updateChild(req.child, req.body)));

export const remove = asyncHandler(async (req, res) => {
  await service.deleteChildCascade(req.child._id);
  ok(res, { message: 'Child profile and all related records deleted' });
});

// Parent opens "child mode": a session token locked to this one child.
export const startChildSession = asyncHandler(async (req, res) => {
  res.cookie(COOKIE_NAME, signToken(req.user, req.child._id), cookieOptions(12 * 3600 * 1000));
  ok(res, { user: req.user, mode: 'child', child: req.child });
});

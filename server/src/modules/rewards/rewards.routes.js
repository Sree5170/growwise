import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/response.js';
import { getPoints, listBadges } from './rewards.service.js';

export const badgesForChild = asyncHandler(async (req, res) =>
  ok(res, { badges: await listBadges(req.child._id), points: await getPoints(req.child._id) }));

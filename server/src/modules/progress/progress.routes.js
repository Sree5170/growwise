import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/response.js';
import { buildProgress } from './progress.service.js';
import { buildWeeklyReport } from '../reports/reports.service.js';

const RANGES = ['day', 'week', 'month'];
export const progressForChild = {
  progress: asyncHandler(async (req, res) => {
    const range = RANGES.includes(req.query.range) ? req.query.range : 'week';
    ok(res, await buildProgress(req.child, range));
  }),
  weekly: asyncHandler(async (req, res) => ok(res, await buildWeeklyReport(req.child, req.user))),
};

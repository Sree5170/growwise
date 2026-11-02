import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/response.js';
import { Activity } from '../activities/activity.model.js';
import { AssignedTask } from '../tasks/task.model.js';
import { recommend } from './recommendation.engine.js';
import { addDays } from '../../utils/dates.js';

export const recommendationsForChild = asyncHandler(async (req, res) => {
  const minutes = parseInt(req.query.minutes);
  const limit = Math.min(10, Math.max(1, parseInt(req.query.limit) || 5));
  const availableMinutes = Number.isFinite(minutes) && minutes >= 5 && minutes <= 240 ? minutes : undefined;
  const now = new Date();
  const [activities, recentTasks] = await Promise.all([
    Activity.find({ isPublished: true }),
    AssignedTask.find({ childId: req.child._id, scheduledDate: { $gte: addDays(now, -21), $lte: addDays(now, 14) } }),
  ]);
  ok(res, { recommendations: recommend({ child: req.child, activities, recentTasks, now, limit, availableMinutes }),
    note: 'Suggestions come from simple, transparent rules (age, time, materials, supervision, interests and weekly balance).' });
});

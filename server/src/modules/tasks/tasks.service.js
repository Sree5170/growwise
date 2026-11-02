import { AssignedTask } from './task.model.js';
import { Activity } from '../activities/activity.model.js';
import { AGE_GROUP_RANGES } from '../../utils/constants.js';
import { badRequest, conflict, forbidden, notFound } from '../../utils/AppError.js';
import { startOfDay, endOfDay } from '../../utils/dates.js';
import { evaluateBadges, getPoints } from '../rewards/rewards.service.js';

export function ageFits(activity, ageGroup) {
  const [lo, hi] = AGE_GROUP_RANGES[ageGroup];
  return activity.minimumAge <= hi && activity.maximumAge >= lo; // ranges overlap
}

export async function createTask(parent, child, { activityId, scheduledDate, dueDate, parentNote }) {
  const activity = await Activity.findOne({ _id: activityId, isPublished: true });
  if (!activity) throw notFound('Activity not found');
  if (!ageFits(activity, child.ageGroup)) throw badRequest(`"${activity.title}" is not suitable for the ${child.ageGroup} age group`);
  if (dueDate < scheduledDate) throw badRequest('Due date cannot be before the scheduled date');
  const dup = await AssignedTask.exists({
    childId: child._id, activityId, status: { $in: ['assigned', 'submitted', 'needs-revision'] },
    scheduledDate: { $gte: startOfDay(scheduledDate), $lte: endOfDay(scheduledDate) },
  });
  if (dup) throw conflict('This activity is already assigned to this child for that day');
  return AssignedTask.create({ childId: child._id, parentId: parent._id, activityId, scheduledDate, dueDate, parentNote });
}

// Scope helper: parents see their own tasks; child sessions see only their own child's.
export function scopeFor(req) {
  const f = { parentId: req.user._id };
  if (req.auth.role === 'child') f.childId = req.auth.childId;
  return f;
}

export async function loadScoped(req, id) {
  const task = await AssignedTask.findOne({ _id: id, ...scopeFor(req) });
  if (!task) throw notFound('Task not found');
  return task;
}

export async function listTasks(filter, { skip, limit }) {
  const [items, total] = await Promise.all([
    AssignedTask.find(filter).sort({ scheduledDate: -1, createdAt: -1 }).skip(skip).limit(limit).populate('activityId').lean(),
    AssignedTask.countDocuments(filter),
  ]);
  return { items: items.map(({ activityId, ...t }) => ({ ...t, activity: activityId })), total };
}

export async function updateTask(task, patch) {
  if (!['assigned', 'needs-revision'].includes(task.status)) throw conflict('Only pending tasks can be edited or cancelled');
  if (patch.scheduledDate) task.scheduledDate = patch.scheduledDate;
  if (patch.dueDate) task.dueDate = patch.dueDate;
  if (task.dueDate < task.scheduledDate) throw badRequest('Due date cannot be before the scheduled date');
  if (patch.parentNote !== undefined) task.parentNote = patch.parentNote;
  if (patch.status === 'cancelled') task.status = 'cancelled';
  await task.save();
  return task;
}

export async function submitTask(req, task, { childNote, minutesSpent }) {
  if (req.auth.role === 'child' && String(task.childId) !== req.auth.childId) throw forbidden();
  const updated = await AssignedTask.findOneAndUpdate(
    { _id: task._id, status: { $in: ['assigned', 'needs-revision'] } }, // atomic transition: repeated submits are rejected
    { $set: { status: 'submitted', submittedAt: new Date(), childNote, ...(minutesSpent !== undefined ? { minutesSpent } : {}) } },
    { new: true });
  if (!updated) throw conflict('This task was already submitted or is no longer open');
  return updated;
}

// Backend-controlled reward: points come from the Activity record in the database, never from the request.
export async function verifyTask(req, task, { decision, parentNote }) {
  const now = new Date();
  if (decision === 'reject') {
    const t = await AssignedTask.findOneAndUpdate(
      { _id: task._id, parentId: req.user._id, status: 'submitted' },
      { $set: { status: 'needs-revision', parentNote, verifiedAt: now, verifiedBy: req.user._id } }, { new: true });
    if (!t) throw conflict('This task is not waiting for verification');
    return { task: t, newBadges: [], points: await getPoints(t.childId) };
  }
  const activity = await Activity.findById(task.activityId);
  const points = activity?.points ?? 0;
  const t = await AssignedTask.findOneAndUpdate(
    { _id: task._id, parentId: req.user._id, status: 'submitted' }, // only ONE request can win this transition
    { $set: { status: 'approved', parentNote, verifiedAt: now, verifiedBy: req.user._id, pointsAwarded: points } }, { new: true });
  if (!t) throw conflict('This task was already verified or is not waiting for verification');
  const newBadges = await evaluateBadges(t.childId);
  return { task: t, newBadges, points: await getPoints(t.childId) };
}

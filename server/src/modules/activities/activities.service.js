import { Activity } from './activity.model.js';
import { notFound, badRequest } from '../../utils/AppError.js';

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function listActivities(q, { skip, limit }, includeUnpublished = false) {
  const f = {};
  if (!includeUnpublished) f.isPublished = true;
  if (q.category) f.category = q.category;
  if (q.difficulty) f.difficulty = q.difficulty;
  if (q.age) { f.minimumAge = { $lte: q.age }; f.maximumAge = { $gte: q.age }; }
  if (q.minDuration || q.maxDuration) f.durationMinutes = { ...(q.minDuration ? { $gte: q.minDuration } : {}), ...(q.maxDuration ? { $lte: q.maxDuration } : {}) };
  if (q.indoor) f.isIndoor = q.indoor === 'true';
  if (q.q) { const re = new RegExp(esc(q.q), 'i'); f.$or = [{ title: re }, { description: re }, { tags: re }]; }
  const [items, total] = await Promise.all([
    Activity.find(f).sort({ category: 1, minimumAge: 1, title: 1 }).skip(skip).limit(limit), Activity.countDocuments(f)]);
  return { items, total };
}

export async function getActivity(id, includeUnpublished = false) {
  const a = await Activity.findOne({ _id: id, ...(includeUnpublished ? {} : { isPublished: true }) });
  if (!a) throw notFound('Activity not found');
  return a;
}

export const createActivity = (data) => Activity.create(data);

export async function updateActivity(id, patch) {
  const a = await Activity.findById(id);
  if (!a) throw notFound('Activity not found');
  Object.assign(a, patch);
  if (a.minimumAge > a.maximumAge) throw badRequest('Minimum age cannot exceed maximum age');
  await a.save();
  return a;
}

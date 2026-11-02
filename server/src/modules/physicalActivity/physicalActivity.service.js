import { PhysicalActivityRecord } from './physicalActivity.model.js';
import { badRequest, notFound } from '../../utils/AppError.js';
import { startOfDay, addDays } from '../../utils/dates.js';

export async function createRecord(req, child, data) {
  const now = new Date();
  if (data.activityDate > addDays(startOfDay(now), 1)) throw badRequest('Activity date cannot be in the future');
  if (data.activityDate < addDays(now, -365)) throw badRequest('Activity date is too far in the past');
  const byChild = req.auth.role === 'child';
  return PhysicalActivityRecord.create({
    childId: child._id, parentId: req.user._id, activityType: data.activityType, durationMinutes: data.durationMinutes,
    activityDate: data.activityDate, note: data.note,
    recordedBy: byChild ? 'child' : 'parent',
    verificationStatus: byChild ? 'self-reported' : 'parent-verified', // never device-measured
  });
}

export async function verifyRecord(parentId, id) {
  const rec = await PhysicalActivityRecord.findOneAndUpdate({ _id: id, parentId }, { $set: { verificationStatus: 'parent-verified' } }, { new: true });
  if (!rec) throw notFound('Record not found');
  return rec;
}
export async function deleteRecord(parentId, id) {
  const rec = await PhysicalActivityRecord.findOneAndDelete({ _id: id, parentId });
  if (!rec) throw notFound('Record not found');
}

export function summarize(records) {
  const byType = {}; let self = 0; let verified = 0;
  for (const r of records) {
    byType[r.activityType] = (byType[r.activityType] || 0) + r.durationMinutes;
    if (r.verificationStatus === 'parent-verified') verified += r.durationMinutes; else self += r.durationMinutes;
  }
  return { totalMinutes: self + verified, selfReportedMinutes: self, parentVerifiedMinutes: verified,
    byType: Object.entries(byType).map(([type, minutes]) => ({ type, minutes })).sort((a, b) => b.minutes - a.minutes) };
}

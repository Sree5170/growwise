import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorizeRole } from '../../middleware/authorizeRole.js';
import { validate } from '../../middleware/validateRequest.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, parsePaging } from '../../utils/response.js';
import { resolveChild } from '../../utils/resolveChild.js';
import { PhysicalActivityRecord } from './physicalActivity.model.js';
import * as s from './physicalActivity.service.js';
import { createRecordSchema, idParam } from './physicalActivity.validation.js';

export const physicalForChild = asyncHandler(async (req, res) => {
  const filter = { childId: req.child._id };
  const from = req.query.from ? new Date(String(req.query.from)) : null;
  const to = req.query.to ? new Date(String(req.query.to)) : null;
  if ((from && isNaN(from)) || (to && isNaN(to))) return ok(res, [], 200);
  if (from || to) filter.activityDate = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
  const paging = parsePaging(req.query, 100);
  const [items, total, all] = await Promise.all([
    PhysicalActivityRecord.find(filter).sort({ activityDate: -1, createdAt: -1 }).skip(paging.skip).limit(paging.limit),
    PhysicalActivityRecord.countDocuments(filter), PhysicalActivityRecord.find(filter)]);
  ok(res, { records: items, summary: s.summarize(all), disclaimer: 'Durations are reported by a parent or child. They are not measured by a device and are not a medical health measure.' },
    200, { page: paging.page, limit: paging.limit, total, pages: Math.ceil(total / paging.limit) });
});

const r = Router();
r.use(authenticate);
r.post('/', authorizeRole('parent', 'child'), validate(createRecordSchema), asyncHandler(async (req, res) => {
  const child = await resolveChild(req, req.body.childId);
  ok(res, await s.createRecord(req, child, req.body), 201);
}));
r.post('/:id/verify', authorizeRole('parent'), validate(idParam), asyncHandler(async (req, res) => ok(res, await s.verifyRecord(req.user._id, req.params.id))));
r.delete('/:id', authorizeRole('parent'), validate(idParam), asyncHandler(async (req, res) => { await s.deleteRecord(req.user._id, req.params.id); ok(res, { message: 'Record deleted' }); }));
export default r;

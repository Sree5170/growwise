import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorizeRole } from '../../middleware/authorizeRole.js';
import { validate } from '../../middleware/validateRequest.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, parsePaging } from '../../utils/response.js';
import * as s from './activities.service.js';
import { listActivitiesSchema, idParam, createActivitySchema, updateActivitySchema } from './activities.validation.js';

const r = Router();
r.use(authenticate);
r.get('/', validate(listActivitiesSchema), asyncHandler(async (req, res) => {
  const paging = parsePaging(req.validQuery, 100);
  const { items, total } = await s.listActivities(req.validQuery, paging, req.auth.role === 'admin');
  ok(res, items, 200, { page: paging.page, limit: paging.limit, total, pages: Math.ceil(total / paging.limit) });
}));
r.get('/:id', validate(idParam), asyncHandler(async (req, res) => ok(res, await s.getActivity(req.params.id, req.auth.role === 'admin'))));
r.post('/', authorizeRole('admin'), validate(createActivitySchema), asyncHandler(async (req, res) => ok(res, await s.createActivity(req.body), 201)));
r.patch('/:id', authorizeRole('admin'), validate(updateActivitySchema), asyncHandler(async (req, res) => ok(res, await s.updateActivity(req.params.id, req.body))));
export default r;

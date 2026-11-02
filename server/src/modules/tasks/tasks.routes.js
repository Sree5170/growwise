import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorizeRole } from '../../middleware/authorizeRole.js';
import { authorizeChildAccess } from '../../middleware/authorizeChildAccess.js';
import { validate } from '../../middleware/validateRequest.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, parsePaging } from '../../utils/response.js';
import * as c from './tasks.controller.js';
import * as s from './tasks.service.js';
import { createTaskSchema, updateTaskSchema, submitTaskSchema, verifyTaskSchema, listTasksSchema } from './tasks.validation.js';

// Used by GET /api/children/:id/tasks (ownership already checked by authorizeChildAccess)
export const tasksForChild = asyncHandler(async (req, res) => {
  const paging = parsePaging(req.query, 100);
  const filter = { childId: req.child._id, parentId: req.user._id };
  if (req.query.status) filter.status = String(req.query.status);
  const { items, total } = await s.listTasks(filter, paging);
  ok(res, items, 200, { page: paging.page, limit: paging.limit, total, pages: Math.ceil(total / paging.limit) });
});

const r = Router();
r.use(authenticate);
r.get('/', validate(listTasksSchema), c.list);
r.post('/', authorizeRole('parent'), validate(createTaskSchema), authorizeChildAccess('body'), c.create);
r.patch('/:id', authorizeRole('parent'), validate(updateTaskSchema), c.update);
r.post('/:id/submit', authorizeRole('parent', 'child'), validate(submitTaskSchema), c.submit);
r.post('/:id/verify', authorizeRole('parent'), validate(verifyTaskSchema), c.verify); // child sessions get 403 here
export default r;

import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorizeRole } from '../../middleware/authorizeRole.js';
import { validate } from '../../middleware/validateRequest.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/response.js';
import { resolveChild } from '../../utils/resolveChild.js';
import * as s from './safety.service.js';
import { idParam, listSchema, completeSchema } from './safety.validation.js';

const optionalChild = async (req, id) => (req.auth.role === 'child' || id ? resolveChild(req, id) : null);

const r = Router();
r.use(authenticate);
r.get('/', validate(listSchema), asyncHandler(async (req, res) => ok(res, await s.listLessons(await optionalChild(req, req.validQuery.childId)))));
r.get('/:id', validate({ ...idParam, ...listSchema }), asyncHandler(async (req, res) => ok(res, await s.getLesson(req.params.id, await optionalChild(req, req.validQuery.childId)))));
r.post('/:id/complete', authorizeRole('parent', 'child'), validate(completeSchema), asyncHandler(async (req, res) =>
  ok(res, await s.completeLesson(await resolveChild(req, req.body.childId), req.params.id, req.body.answers))));
export default r;

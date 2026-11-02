import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorizeRole } from '../../middleware/authorizeRole.js';
import { validate } from '../../middleware/validateRequest.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/response.js';
import { GAMES } from './questionBanks.js';
import * as s from './games.service.js';
import { questionsSchema, attemptSchema } from './games.validation.js';
import { resolveChild } from '../../utils/resolveChild.js';
import { badRequest } from '../../utils/AppError.js';

export const gamesForChild = asyncHandler(async (req, res) => ok(res, await s.gameProgress(req.child._id)));

const r = Router();
r.use(authenticate);
r.get('/', (_req, res) => ok(res, GAMES));
r.get('/:type/questions', validate(questionsSchema), asyncHandler(async (req, res) => {
  const child = await resolveChild(req, req.validQuery.childId);
  ok(res, s.getQuestions(req.params.type, child.ageGroup, req.validQuery.count));
}));
r.post('/:type/attempts', authorizeRole('parent', 'child'), validate(attemptSchema), asyncHandler(async (req, res) => {
  const child = await resolveChild(req, req.body.childId);
  const t = req.params.type;
  if (t === 'memory-match' && (req.body.pairs === undefined || req.body.moves === undefined)) throw badRequest('Memory match needs pairs and moves');
  if (t !== 'memory-match' && !req.body.answers) throw badRequest('This game needs answers');
  ok(res, await s.recordAttempt(child, t, req.body), 201);
}));
export default r;

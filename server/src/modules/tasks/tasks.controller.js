import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, parsePaging } from '../../utils/response.js';
import * as s from './tasks.service.js';

export const create = asyncHandler(async (req, res) => ok(res, await s.createTask(req.user, req.child, req.body), 201));

export const list = asyncHandler(async (req, res) => {
  const q = req.validQuery || {};
  const filter = s.scopeFor(req);
  if (q.childId && req.auth.role !== 'child') filter.childId = q.childId;
  if (q.status) filter.status = q.status;
  if (q.from || q.to) filter.scheduledDate = { ...(q.from ? { $gte: q.from } : {}), ...(q.to ? { $lte: q.to } : {}) };
  const paging = parsePaging(q, 100);
  const { items, total } = await s.listTasks(filter, paging);
  ok(res, items, 200, { page: paging.page, limit: paging.limit, total, pages: Math.ceil(total / paging.limit) });
});

export const update = asyncHandler(async (req, res) => ok(res, await s.updateTask(await s.loadScoped(req, req.params.id), req.body)));
export const submit = asyncHandler(async (req, res) => ok(res, await s.submitTask(req, await s.loadScoped(req, req.params.id), req.body)));
export const verify = asyncHandler(async (req, res) => ok(res, await s.verifyTask(req, await s.loadScoped(req, req.params.id), req.body)));

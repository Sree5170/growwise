import { z } from 'zod';
import { TASK_STATUSES } from '../../utils/constants.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const dateStr = z.coerce.date({ error: 'Enter a valid date' });

export const idParam = { params: z.object({ id: objectId }) };

export const createTaskSchema = { body: z.object({
  childId: objectId, activityId: objectId, scheduledDate: dateStr, dueDate: dateStr,
  parentNote: z.string().trim().max(300).optional().default(''),
}).strict() };

export const updateTaskSchema = { ...idParam, body: z.object({
  scheduledDate: dateStr, dueDate: dateStr, parentNote: z.string().trim().max(300),
  status: z.literal('cancelled'),
}).partial().strict().refine((o) => Object.keys(o).length > 0, 'Nothing to update') };

export const submitTaskSchema = { ...idParam, body: z.object({
  childNote: z.string().trim().max(300).optional().default(''),
  minutesSpent: z.number().int().min(0).max(480).optional(),
}).strict() };

export const verifyTaskSchema = { ...idParam, body: z.object({
  decision: z.enum(['approve', 'reject'], { error: 'Choose approve or reject' }),
  parentNote: z.string().trim().max(300).optional().default(''),
}).strict() };

export const listTasksSchema = { query: z.object({
  childId: objectId.optional(), status: z.enum(TASK_STATUSES).optional(),
  from: dateStr.optional(), to: dateStr.optional(),
  page: z.coerce.number().int().min(1).optional(), limit: z.coerce.number().int().min(1).max(100).optional(),
}) };

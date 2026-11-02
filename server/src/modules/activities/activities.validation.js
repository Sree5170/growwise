import { z } from 'zod';
import { CATEGORIES, DIFFICULTIES, COMPLETION_METHODS } from '../../utils/constants.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
export const idParam = { params: z.object({ id: objectId }) };

export const listActivitiesSchema = { query: z.object({
  q: z.string().trim().max(60).optional(),
  category: z.enum(CATEGORIES).optional(),
  age: z.coerce.number().int().min(3).max(17).optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  minDuration: z.coerce.number().int().min(0).optional(),
  maxDuration: z.coerce.number().int().min(1).optional(),
  indoor: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
}) };

const fields = {
  title: z.string().trim().min(3).max(120), description: z.string().trim().min(10).max(600),
  category: z.enum(CATEGORIES), minimumAge: z.number().int().min(3).max(17), maximumAge: z.number().int().min(3).max(17),
  durationMinutes: z.number().int().min(1).max(480), difficulty: z.enum(DIFFICULTIES),
  materials: z.array(z.string().trim().min(1).max(60)).max(20), instructions: z.array(z.string().trim().min(1).max(300)).min(1).max(15),
  safetyNotes: z.array(z.string().trim().min(1).max(300)).max(10), requiresAdultSupervision: z.boolean(),
  completionMethod: z.enum(COMPLETION_METHODS), points: z.number().int().min(1).max(100),
  tags: z.array(z.string().trim().min(1).max(30)).max(10), isIndoor: z.boolean(), needsOutdoorSpace: z.boolean(), isPublished: z.boolean(),
};
const full = z.object(fields);
export const createActivitySchema = { body: full.partial({ difficulty: true, materials: true, safetyNotes: true, requiresAdultSupervision: true, completionMethod: true, tags: true, isIndoor: true, needsOutdoorSpace: true, isPublished: true }).strict()
  .refine((o) => o.minimumAge <= o.maximumAge, { message: 'Minimum age cannot exceed maximum age', path: ['minimumAge'] }) };
export const updateActivitySchema = { ...idParam, body: full.partial().strict().refine((o) => Object.keys(o).length > 0, 'Nothing to update') };

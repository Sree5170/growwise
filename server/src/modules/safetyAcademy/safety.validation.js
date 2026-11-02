import { z } from 'zod';
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
export const idParam = { params: z.object({ id: objectId }) };
export const listSchema = { query: z.object({ childId: objectId.optional() }) };
export const completeSchema = { params: z.object({ id: objectId }), body: z.object({
  childId: objectId.optional(),
  answers: z.array(z.object({ questionIndex: z.number().int().min(0).max(20), selectedIndex: z.number().int().min(0).max(5) })).max(20),
}).strict() };

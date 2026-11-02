import { z } from 'zod';
import { GAME_TYPES } from '../../utils/constants.js';

const type = z.enum(GAME_TYPES, { error: 'Unknown game' });
export const typeParam = { params: z.object({ type }) };
export const questionsSchema = { params: z.object({ type }), query: z.object({ childId: z.string().regex(/^[a-f\d]{24}$/i).optional(), count: z.coerce.number().int().min(3).max(10).optional() }) };
export const attemptSchema = { params: z.object({ type }), body: z.object({
  childId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  durationSeconds: z.number().int().min(0).max(7200).optional(),
  hintsUsed: z.number().int().min(0).max(50).optional(),
  pairs: z.number().int().min(2).max(12).optional(), moves: z.number().int().min(0).max(500).optional(),
  answers: z.array(z.object({ questionId: z.string().max(20), answer: z.string().max(80) })).min(1).max(10).optional(),
}).strict().superRefine((b, ctx) => {
  // body shape depends on game; checked again in the service
  if (!b.answers && (b.pairs === undefined || b.moves === undefined)) ctx.addIssue({ code: 'custom', message: 'Submit answers (quiz games) or pairs and moves (memory match)' });
}) };

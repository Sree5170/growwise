import { z } from 'zod';
import { PHYSICAL_TYPES } from '../../utils/constants.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
export const idParam = { params: z.object({ id: objectId }) };
export const createRecordSchema = { body: z.object({
  childId: objectId.optional(),
  activityType: z.enum(PHYSICAL_TYPES, { error: 'Choose an activity type' }),
  durationMinutes: z.number({ error: 'Enter minutes' }).int('Use whole minutes').min(1, 'At least 1 minute').max(600, 'Maximum 600 minutes'),
  activityDate: z.coerce.date({ error: 'Enter a valid date' }),
  note: z.string().trim().max(200).optional().default(''),
}).strict() };

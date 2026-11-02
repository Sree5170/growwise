import { z } from 'zod';
import { AGE_GROUPS, CATEGORIES, GOALS, INTERESTS } from '../../utils/constants.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
export const idParam = { params: z.object({ id: objectId }) };

const base = {
  displayName: z.string().trim().min(1, 'Enter a nickname').max(30, 'Keep the nickname under 30 characters'),
  ageGroup: z.enum(AGE_GROUPS, { error: 'Choose an age group' }),
  interests: z.array(z.enum(INTERESTS)).max(8).default([]),
  goals: z.array(z.enum(GOALS)).max(6).default([]),
  avatar: z.string().trim().max(20).regex(/^[a-z0-9-]+$/).default('sprout'),
  preferences: z.object({
    availableMinutes: z.number().int().min(5).max(240),
    preferredCategories: z.array(z.enum(CATEGORIES)).max(7),
    materialsAvailable: z.array(z.string().trim().min(1).max(40)).max(30),
    hasOutdoorSpace: z.boolean(),
    adultAvailable: z.boolean(),
  }).partial(),
  weeklyGoalMinutes: z.number().int().min(0).max(2000),
  weeklyGoalTasks: z.number().int().min(0).max(50),
  accessibilityPreferences: z.object({ largeText: z.boolean(), reducedMotion: z.boolean() }).partial(),
};

export const createChildSchema = { body: z.object({
  ...base,
  preferences: base.preferences.optional(),
  weeklyGoalMinutes: base.weeklyGoalMinutes.optional(),
  weeklyGoalTasks: base.weeklyGoalTasks.optional(),
  accessibilityPreferences: base.accessibilityPreferences.optional(),
}).strict() };

export const updateChildSchema = { ...idParam, body: z.object(base).partial().strict()
  .refine((o) => Object.keys(o).length > 0, 'Nothing to update') };

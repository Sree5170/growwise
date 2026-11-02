import { z } from 'zod';
import { passwordRule } from '../auth/auth.validation.js';

export const updateProfileSchema = { body: z.object({
  name: z.string().trim().min(2).max(80),
  notificationPreferences: z.object({
    dailyReminder: z.boolean(), reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM'),
    weeklyReport: z.boolean(), verificationAlerts: z.boolean(),
  }).partial(),
  privacySettings: z.object({ hideChildNotesInReports: z.boolean() }).partial(),
}).partial().strict().refine((o) => Object.keys(o).length > 0, 'Nothing to update') };
export const changePasswordSchema = { body: z.object({ currentPassword: z.string().min(1, 'Enter your current password').max(72), newPassword: passwordRule }).strict()
  .refine((o) => o.currentPassword !== o.newPassword, { message: 'New password must be different', path: ['newPassword'] }) };
export const deleteAccountSchema = { body: z.object({ password: z.string().min(1, 'Enter your password to confirm').max(72) }).strict() };

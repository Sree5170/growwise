import { z } from 'zod';

export const passwordRule = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .refine((v) => /[A-Za-z]/.test(v), 'Password must include a letter')
  .refine((v) => /\d/.test(v), 'Password must include a number');

export const registerSchema = { body: z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.email('Enter a valid email address').max(254).transform((v) => v.toLowerCase().trim()),
  password: passwordRule,
}).strict() };

export const loginSchema = { body: z.object({
  email: z.email('Enter a valid email address').transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, 'Password is required').max(72),
}).strict() };

export const exitChildSchema = { body: z.object({ password: z.string().min(1, 'Enter your parent password').max(72) }).strict() };

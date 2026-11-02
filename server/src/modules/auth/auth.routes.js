import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middleware/validateRequest.js';
import { authenticate } from '../../middleware/authenticate.js';
import { env } from '../../config/env.js';
import { registerSchema, loginSchema, exitChildSchema } from './auth.validation.js';
import * as c from './auth.controller.js';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: env.isTest ? 1000 : 20, standardHeaders: true, legacyHeaders: false,
  message: { success: false, error: { message: 'Too many attempts. Please wait a few minutes and try again.' } },
});

const r = Router();
r.post('/register', authLimiter, validate(registerSchema), c.register);
r.post('/login', authLimiter, validate(loginSchema), c.login);
r.post('/logout', c.logout);
r.get('/me', authenticate, c.me);
r.post('/exit-child-mode', authLimiter, authenticate, validate(exitChildSchema), c.exitChildMode);
export default r;

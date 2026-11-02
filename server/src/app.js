import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { csrfProtection } from './middleware/csrf.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import parentRoutes from './modules/parents/parents.routes.js';
import childrenRoutes from './modules/children/children.routes.js';
import activityRoutes from './modules/activities/activities.routes.js';
import taskRoutes from './modules/tasks/tasks.routes.js';
import gameRoutes from './modules/games/games.routes.js';
import safetyRoutes from './modules/safetyAcademy/safety.routes.js';
import physicalRoutes from './modules/physicalActivity/physicalActivity.routes.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  if (!env.isTest) app.use(morgan(env.isProd ? 'combined' : 'dev'));
  app.use(rateLimit({ windowMs: 60 * 1000, limit: env.isTest ? 100000 : 300, standardHeaders: true, legacyHeaders: false,
    message: { success: false, error: { message: 'Too many requests. Please slow down.' } } }));
  app.use(express.json({ limit: '50kb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => res.json({ success: true, data: { status: 'ok', time: new Date().toISOString() } }));
  app.use('/api', csrfProtection);
  app.use('/api/auth', authRoutes);
  app.use('/api/parents', parentRoutes);
  app.use('/api/children', childrenRoutes);
  app.use('/api/activities', activityRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/games', gameRoutes);
  app.use('/api/safety-lessons', safetyRoutes);
  app.use('/api/physical-activity', physicalRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

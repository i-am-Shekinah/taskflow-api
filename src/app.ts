import express, { type NextFunction, type Request, type Response } from 'express';
import authRouter from './modules/auth/routes';
import tasksRouter from './modules/tasks/routes';
import { requireAuth } from './middleware/auth';
import { errorHandler } from './middleware/error-handler';
import { HttpError } from './errors';

export function createApp(): express.Express {
  const app = express();

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/tasks', requireAuth, tasksRouter);

  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new HttpError(404, 'not_found', 'Route not found'));
  });

  app.use(errorHandler);

  return app;
}

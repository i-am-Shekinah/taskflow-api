import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../modules/auth/jwt';
import { HttpError } from '../errors';

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new HttpError(401, 'unauthorized', 'Missing Bearer token'));
    return;
  }
  try {
    req.userId = verifyToken(header.slice('Bearer '.length));
    next();
  } catch (err) {
    next(err);
  }
}

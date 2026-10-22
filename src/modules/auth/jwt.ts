import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { HttpError } from '../../errors';

const TOKEN_TTL = '7d';

export function signToken(userId: string): string {
  return jwt.sign({}, env.JWT_SECRET, { subject: userId, expiresIn: TOKEN_TTL });
}

export function verifyToken(token: string): string {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (typeof payload === 'string' || typeof payload.sub !== 'string') {
      throw new Error('missing subject');
    }
    return payload.sub;
  } catch {
    throw new HttpError(401, 'invalid_token', 'Invalid or expired token');
  }
}

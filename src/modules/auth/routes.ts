import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, register } from './controller';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'test' ? 100_000 : 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

export default router;

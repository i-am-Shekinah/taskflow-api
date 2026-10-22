import type { Request, Response } from 'express';
import { User, checkPassword, hashPassword } from '../../models/user';
import { HttpError } from '../../errors';
import { signToken } from './jwt';
import { loginSchema, registerSchema } from './schemas';

function publicUser(user: { _id: unknown; email: string; name?: string }) {
  return { id: String(user._id), email: user.email, name: user.name };
}

export async function register(req: Request, res: Response): Promise<void> {
  const input = registerSchema.parse(req.body);

  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw new HttpError(409, 'email_taken', 'An account with this email already exists');
  }

  const user = await User.create({
    email: input.email,
    name: input.name,
    password: await hashPassword(input.password),
  });

  res.status(201).json({ token: signToken(String(user._id)), user: publicUser(user) });
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body);

  const user = await User.findOne({ email: input.email }).select('+password');
  if (!user || !(await checkPassword(user.password, input.password))) {
    throw new HttpError(401, 'invalid_credentials', 'Invalid email or password');
  }

  res.json({ token: signToken(String(user._id)), user: publicUser(user) });
}

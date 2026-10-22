import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  MONGO_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/taskflow'),
  JWT_SECRET: z.string().min(16),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

import 'dotenv/config';
import { z } from 'zod';

// Supports either MONGO_URI directly, or Atlas-style MONGODB_URI with
// <user>/<password> placeholders filled from MONGODB_USERNAME/PASSWORD.
function resolveMongoUri(): string {
  if (process.env.MONGO_URI) return process.env.MONGO_URI;

  let uri = process.env.MONGODB_URI ?? '';
  const user = process.env.MONGODB_USERNAME ? encodeURIComponent(process.env.MONGODB_USERNAME) : '';
  const pass = process.env.MONGODB_PASSWORD ? encodeURIComponent(process.env.MONGODB_PASSWORD) : '';
  if (user) {
    uri = uri.replaceAll(/<(db_)?user(name)?>/g, user);
  }
  if (pass) {
    uri = uri.replaceAll(/<(db_)?pass(word)?>/g, pass);
  }
  if (uri.includes('<')) {
    throw new Error(
      'MONGODB_URI still contains unresolved placeholders; set MONGODB_USERNAME/MONGODB_PASSWORD or put credentials in MONGO_URI'
    );
  }
  return uri;
}

const envSchema = z.object({
  MONGO_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/taskflow'),
  JWT_SECRET: z.string().min(16),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const parsed = envSchema.safeParse({
  ...process.env,
  ...(resolveMongoUri() ? { MONGO_URI: resolveMongoUri() } : {}),
});

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

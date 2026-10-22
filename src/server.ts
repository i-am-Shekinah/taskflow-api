import { env } from './config/env';
import { connectDb } from './db/connection';
import { createApp } from './app';

async function main(): Promise<void> {
  await connectDb(env.MONGO_URI);
  console.log('Connected to MongoDB');

  createApp().listen(env.PORT, () => {
    console.log(`Server is running on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

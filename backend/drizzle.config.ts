import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

config({ path: '../.env' });

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://events:events_dev_password@localhost:5432/events_platform',
  },
  verbose: true,
  strict: true,
});

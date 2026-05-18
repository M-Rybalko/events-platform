import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { env } from '@/config/env';

async function runMigrations() {
  console.log('▶  Running migrations…');

  const pool = new pg.Pool({
    connectionString: env.DATABASE_URL,
    max: 1,
  });

  const db = drizzle(pool);

  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✓  Migrations completed');
  } catch (err) {
    console.error('✗  Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();

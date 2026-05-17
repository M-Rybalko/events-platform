import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { env } from '@/config/env';

const app = new Hono();

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: env.FRONTEND_ORIGIN,
    credentials: true,
  }),
);

app.get('/health', (c) =>
  c.json({
    status: 'ok',
    service: 'events-platform-backend',
    timestamp: new Date().toISOString(),
  }),
);

app.get('/', (c) => c.text('events-platform API'));

app.notFound((c) => c.json({ error: 'Not found' }, 404));

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    console.log(`✓ events-platform API listening on http://localhost:${info.port}`);
  },
);

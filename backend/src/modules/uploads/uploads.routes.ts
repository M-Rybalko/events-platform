import { Hono } from 'hono';
import { randomUUID } from 'node:crypto';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { env } from '@/config/env';
import { requireAuth, type AuthVariables } from '@/middleware/auth.middleware';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'image/gif':  'gif',
};

// Гарантуємо що тека існує при старті
await mkdir(UPLOADS_DIR, { recursive: true });

export const uploadsRoutes = new Hono<{ Variables: AuthVariables }>();

uploadsRoutes.post('/image', requireAuth, async (c) => {
  let body;
  try {
    body = await c.req.parseBody();
  } catch {
    return c.json({ error: 'Invalid multipart payload' }, 400);
  }

  const file = body['file'];

  if (!file || !(file instanceof File)) {
    return c.json({ error: 'File field is required' }, 400);
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return c.json(
      { error: 'Unsupported file type. Allowed: JPEG, PNG, WebP, GIF' },
      400,
    );
  }

  if (file.size > env.UPLOAD_MAX_BYTES) {
    return c.json(
      {
        error: `File too large. Max ${Math.round(env.UPLOAD_MAX_BYTES / 1024 / 1024)} MB`,
      },
      400,
    );
  }

  const filename = `${randomUUID()}.${ext}`;
  const filePath = path.join(UPLOADS_DIR, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const base = env.PUBLIC_URL ?? `http://localhost:${env.PORT}`;
  const url = `${base}/uploads/${filename}`;

  return c.json({ url, filename, size: file.size }, 201);
});

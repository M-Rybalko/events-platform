import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { listTagsQuerySchema } from './tags.schemas';
import { listTags } from './tags.service';

export const tagsRoutes = new Hono();

tagsRoutes.get('/', zValidator('query', listTagsQuerySchema), async (c) => {
  const query = c.req.valid('query');
  const items = await listTags(query);
  return c.json({ items });
});

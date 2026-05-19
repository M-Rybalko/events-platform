import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth, type AuthVariables } from '@/middleware/auth.middleware';
import { myRegistrationsQuerySchema } from '@/modules/registrations/registrations.schemas';
import { listMyRegistrations } from '@/modules/registrations/registrations.service';

export const meRoutes = new Hono<{ Variables: AuthVariables }>();

meRoutes.use('*', requireAuth);

meRoutes.get(
  '/registrations',
  zValidator('query', myRegistrationsQuerySchema),
  async (c) => {
    const user = c.get('user');
    const query = c.req.valid('query');
    const result = await listMyRegistrations(user.sub, query);
    return c.json(result);
  },
);

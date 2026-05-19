import { createMiddleware } from 'hono/factory';
import { verifyAccessToken, type AccessTokenPayload } from '@/lib/tokens';

export interface AuthVariables {
  user: AccessTokenPayload;
}

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }

  const token = header.slice(7).trim();
  if (!token) {
    return c.json({ error: 'Empty access token' }, 401);
  }

  let payload: AccessTokenPayload;
  try {
    payload = await verifyAccessToken(token);
  } catch (err) {
    console.error('[auth] verify failed:', err);
    return c.json({ error: 'Invalid or expired token' }, 401);
  }

  c.set('user', payload);
  await next();
});

export const requireRole = (...roles: AccessTokenPayload['role'][]) =>
  createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    if (!roles.includes(user.role)) {
      return c.json({ error: 'Forbidden: insufficient permissions' }, 403);
    }
    await next();
  });

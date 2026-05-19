import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requireAuth, type AuthVariables } from '@/middleware/auth.middleware';
import { CommentError, deleteComment } from './comments.service';

const idParamSchema = z.object({ id: z.string().uuid() });

function commentErrorStatus(err: CommentError): 403 | 404 {
  switch (err.code) {
    case 'EVENT_NOT_FOUND':
    case 'COMMENT_NOT_FOUND':
      return 404;
    case 'FORBIDDEN':
      return 403;
  }
}

export const commentsRoutes = new Hono<{ Variables: AuthVariables }>();

commentsRoutes.delete(
  '/:id',
  requireAuth,
  zValidator('param', idParamSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const user = c.get('user');
    try {
      await deleteComment(id, user.sub, user.role);
      return c.body(null, 204);
    } catch (err) {
      if (err instanceof CommentError) {
        return c.json({ error: err.message, code: err.code }, commentErrorStatus(err));
      }
      throw err;
    }
  },
);

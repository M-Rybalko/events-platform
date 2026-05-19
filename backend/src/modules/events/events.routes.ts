import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requireAuth, requireRole, type AuthVariables } from '@/middleware/auth.middleware';
import {
  createEventSchema,
  updateEventSchema,
  listEventsQuerySchema,
  mapEventsQuerySchema,
} from './events.schemas';
import {
  EventError,
  cancelEvent,
  createEvent,
  deleteEvent,
  getEventById,
  getMapEvents,
  listEvents,
  publishEvent,
  updateEvent,
} from './events.service';
import {
  RegistrationError,
  cancelRegistration,
  listEventRegistrations,
  registerForEvent,
} from '@/modules/registrations/registrations.service';
import {
  CommentError,
  createComment,
  getEventRating,
  listEventComments,
} from '@/modules/comments/comments.service';
import {
  createCommentSchema,
  listCommentsQuerySchema,
} from '@/modules/comments/comments.schemas';
import {
  TagError,
  getEventTags,
  removeEventTag,
  setEventTags,
} from '@/modules/tags/tags.service';
import { setEventTagsSchema } from '@/modules/tags/tags.schemas';

const idParamSchema = z.object({ id: z.string().uuid() });

function eventErrorStatus(err: EventError): 400 | 403 | 404 {
  switch (err.code) {
    case 'NOT_FOUND':
      return 404;
    case 'FORBIDDEN':
      return 403;
    case 'INVALID_STATE':
      return 400;
  }
}

function registrationErrorStatus(err: RegistrationError): 400 | 403 | 404 | 409 {
  switch (err.code) {
    case 'EVENT_NOT_FOUND':
      return 404;
    case 'FORBIDDEN':
      return 403;
    case 'EVENT_NOT_OPEN':
    case 'NOT_REGISTERED':
      return 400;
    case 'ALREADY_REGISTERED':
    case 'CAPACITY_REACHED':
      return 409;
  }
}

function commentErrorStatus(err: CommentError): 403 | 404 {
  switch (err.code) {
    case 'EVENT_NOT_FOUND':
    case 'COMMENT_NOT_FOUND':
      return 404;
    case 'FORBIDDEN':
      return 403;
  }
}

function tagErrorStatus(err: TagError): 403 | 404 {
  switch (err.code) {
    case 'EVENT_NOT_FOUND':
      return 404;
    case 'FORBIDDEN':
      return 403;
  }
}

export const eventsRoutes = new Hono<{ Variables: AuthVariables }>();

eventsRoutes.get('/', zValidator('query', listEventsQuerySchema), async (c) => {
  const query = c.req.valid('query');
  const { items, total } = await listEvents(query);
  return c.json({
    items,
    pagination: {
      total,
      limit: query.limit,
      offset: query.offset,
    },
  });
});

eventsRoutes.get('/map', zValidator('query', mapEventsQuerySchema), async (c) => {
  const query = c.req.valid('query');
  const items = await getMapEvents(query);
  return c.json({ items });
});

eventsRoutes.get('/:id', zValidator('param', idParamSchema), async (c) => {
  const { id } = c.req.valid('param');
  const event = await getEventById(id);
  if (!event) {
    return c.json({ error: 'Event not found' }, 404);
  }
  return c.json({ event });
});

eventsRoutes.post(
  '/',
  requireAuth,
  requireRole('organizer', 'admin'),
  zValidator('json', createEventSchema),
  async (c) => {
    const user = c.get('user');
    const input = c.req.valid('json');
    const event = await createEvent(user.sub, input);
    return c.json({ event }, 201);
  },
);

eventsRoutes.patch(
  '/:id',
  requireAuth,
  requireRole('organizer', 'admin'),
  zValidator('param', idParamSchema),
  zValidator('json', updateEventSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const input = c.req.valid('json');
    const user = c.get('user');
    try {
      const event = await updateEvent(id, user.sub, user.role, input);
      return c.json({ event });
    } catch (err) {
      if (err instanceof EventError) {
        return c.json({ error: err.message, code: err.code }, eventErrorStatus(err));
      }
      throw err;
    }
  },
);

eventsRoutes.delete(
  '/:id',
  requireAuth,
  requireRole('organizer', 'admin'),
  zValidator('param', idParamSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const user = c.get('user');
    try {
      await deleteEvent(id, user.sub, user.role);
      return c.body(null, 204);
    } catch (err) {
      if (err instanceof EventError) {
        return c.json({ error: err.message, code: err.code }, eventErrorStatus(err));
      }
      throw err;
    }
  },
);

eventsRoutes.post(
  '/:id/publish',
  requireAuth,
  requireRole('organizer', 'admin'),
  zValidator('param', idParamSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const user = c.get('user');
    try {
      const event = await publishEvent(id, user.sub, user.role);
      return c.json({ event });
    } catch (err) {
      if (err instanceof EventError) {
        return c.json({ error: err.message, code: err.code }, eventErrorStatus(err));
      }
      throw err;
    }
  },
);

eventsRoutes.post(
  '/:id/cancel',
  requireAuth,
  requireRole('organizer', 'admin'),
  zValidator('param', idParamSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const user = c.get('user');
    try {
      const event = await cancelEvent(id, user.sub, user.role);
      return c.json({ event });
    } catch (err) {
      if (err instanceof EventError) {
        return c.json({ error: err.message, code: err.code }, eventErrorStatus(err));
      }
      throw err;
    }
  },
);

// ─── Registrations (event-scoped) ────────────────────────────────────────

eventsRoutes.post(
  '/:id/register',
  requireAuth,
  zValidator('param', idParamSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const user = c.get('user');
    try {
      const registration = await registerForEvent(id, user.sub);
      return c.json({ registration }, 201);
    } catch (err) {
      if (err instanceof RegistrationError) {
        return c.json({ error: err.message, code: err.code }, registrationErrorStatus(err));
      }
      throw err;
    }
  },
);

eventsRoutes.delete(
  '/:id/register',
  requireAuth,
  zValidator('param', idParamSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const user = c.get('user');
    try {
      const registration = await cancelRegistration(id, user.sub);
      return c.json({ registration });
    } catch (err) {
      if (err instanceof RegistrationError) {
        return c.json({ error: err.message, code: err.code }, registrationErrorStatus(err));
      }
      throw err;
    }
  },
);

eventsRoutes.get(
  '/:id/registrations',
  requireAuth,
  requireRole('organizer', 'admin'),
  zValidator('param', idParamSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const user = c.get('user');
    try {
      const result = await listEventRegistrations(id, user.sub, user.role);
      return c.json(result);
    } catch (err) {
      if (err instanceof RegistrationError) {
        return c.json({ error: err.message, code: err.code }, registrationErrorStatus(err));
      }
      throw err;
    }
  },
);

// ─── Comments + rating (event-scoped) ────────────────────────────────────

eventsRoutes.get(
  '/:id/comments',
  zValidator('param', idParamSchema),
  zValidator('query', listCommentsQuerySchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const query = c.req.valid('query');
    try {
      const result = await listEventComments(id, query);
      return c.json(result);
    } catch (err) {
      if (err instanceof CommentError) {
        return c.json({ error: err.message, code: err.code }, commentErrorStatus(err));
      }
      throw err;
    }
  },
);

eventsRoutes.post(
  '/:id/comments',
  requireAuth,
  zValidator('param', idParamSchema),
  zValidator('json', createCommentSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const input = c.req.valid('json');
    const user = c.get('user');
    try {
      const comment = await createComment(id, user.sub, input);
      return c.json({ comment }, 201);
    } catch (err) {
      if (err instanceof CommentError) {
        return c.json({ error: err.message, code: err.code }, commentErrorStatus(err));
      }
      throw err;
    }
  },
);

eventsRoutes.get(
  '/:id/rating',
  zValidator('param', idParamSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    try {
      const rating = await getEventRating(id);
      return c.json(rating);
    } catch (err) {
      if (err instanceof CommentError) {
        return c.json({ error: err.message, code: err.code }, commentErrorStatus(err));
      }
      throw err;
    }
  },
);

// ─── Tags (event-scoped) ─────────────────────────────────────────────────

eventsRoutes.get('/:id/tags', zValidator('param', idParamSchema), async (c) => {
  const { id } = c.req.valid('param');
  const items = await getEventTags(id);
  return c.json({ items });
});

eventsRoutes.put(
  '/:id/tags',
  requireAuth,
  requireRole('organizer', 'admin'),
  zValidator('param', idParamSchema),
  zValidator('json', setEventTagsSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const input = c.req.valid('json');
    const user = c.get('user');
    try {
      const items = await setEventTags(id, user.sub, user.role, input);
      return c.json({ items });
    } catch (err) {
      if (err instanceof TagError) {
        return c.json({ error: err.message, code: err.code }, tagErrorStatus(err));
      }
      throw err;
    }
  },
);

eventsRoutes.delete(
  '/:id/tags/:tagId',
  requireAuth,
  requireRole('organizer', 'admin'),
  zValidator('param', z.object({ id: z.string().uuid(), tagId: z.string().uuid() })),
  async (c) => {
    const { id, tagId } = c.req.valid('param');
    const user = c.get('user');
    try {
      await removeEventTag(id, tagId, user.sub, user.role);
      return c.body(null, 204);
    } catch (err) {
      if (err instanceof TagError) {
        return c.json({ error: err.message, code: err.code }, tagErrorStatus(err));
      }
      throw err;
    }
  },
);

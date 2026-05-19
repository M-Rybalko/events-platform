import { Hono } from 'hono';
import { eventCategoryValues } from '@/modules/events/events.schemas';

const CATEGORY_LABELS: Record<(typeof eventCategoryValues)[number], { uk: string; en: string }> = {
  concert: { uk: 'Концерт', en: 'Concert' },
  volunteering: { uk: 'Волонтерство', en: 'Volunteering' },
  rally: { uk: 'Мітинг', en: 'Rally' },
  festival: { uk: 'Фестиваль', en: 'Festival' },
  workshop: { uk: 'Воркшоп', en: 'Workshop' },
};

export const categoriesRoutes = new Hono();

categoriesRoutes.get('/', (c) => {
  const items = eventCategoryValues.map((value) => ({
    value,
    labels: CATEGORY_LABELS[value],
  }));
  return c.json({ items });
});

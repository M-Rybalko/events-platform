import type { EventCategory, EventStatus } from './types';

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  concert:      'Концерт',
  volunteering: 'Волонтерство',
  rally:        'Мітинг',
  festival:     'Фестиваль',
  workshop:     'Воркшоп',
};

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  concert:      'bg-pink-50 text-pink-700 ring-1 ring-inset ring-pink-200/60',
  volunteering: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/60',
  rally:        'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/60',
  festival:     'bg-fuchsia-50 text-fuchsia-700 ring-1 ring-inset ring-fuchsia-200/60',
  workshop:     'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200/60',
};

export const STATUS_LABELS: Record<EventStatus, string> = {
  draft:     'Чернетка',
  published: 'Опубліковано',
  cancelled: 'Скасовано',
  completed: 'Завершено',
};

export const CATEGORIES: EventCategory[] = [
  'concert',
  'volunteering',
  'rally',
  'festival',
  'workshop',
];

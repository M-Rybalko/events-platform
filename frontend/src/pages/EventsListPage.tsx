import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEvents } from '@/features/events/hooks';
import { EventCard } from '@/features/events/EventCard';
import { CATEGORIES, CATEGORY_LABELS } from '@/lib/constants';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import type { EventCategory } from '@/lib/types';

const PAGE_SIZE = 12;

export function EventsListPage() {
  const [params, setParams] = useSearchParams();

  const search = params.get('search') ?? '';
  const category = (params.get('category') as EventCategory | null) ?? null;
  const page = Math.max(1, Number(params.get('page')) || 1);

  const queryParams = useMemo(
    () => ({
      status: 'published' as const,
      search: search || undefined,
      category: category ?? undefined,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      orderBy: 'startsAt' as const,
      orderDir: 'asc' as const,
    }),
    [search, category, page],
  );

  const { data, isLoading, isError } = useEvents(queryParams);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value === null || value === '') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    next.delete('page');
    setParams(next);
  };

  const goToPage = (next: number) => {
    const np = new URLSearchParams(params);
    if (next <= 1) np.delete('page');
    else np.set('page', String(next));
    setParams(np);
  };

  const total = data?.pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="container py-8">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Каталог заходів</h1>
        <p className="text-sm text-slate-500 mt-2">
          Опубліковано {total} {total === 1 ? 'захід' : total > 1 && total < 5 ? 'заходи' : 'заходів'}
        </p>
      </header>

      <div className="mb-8 space-y-4">
        <div className="max-w-xl">
          <Input
            type="search"
            placeholder="Пошук за назвою…"
            value={search}
            onChange={(e) => setParam('search', e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setParam('category', null)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-all',
              !category
                ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-600/30'
                : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-slate-300 hover:text-slate-900',
            )}
          >
            Усі
          </button>
          {CATEGORIES.map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => setParam('category', cat)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-all',
                category === cat
                  ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-600/30'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-slate-300 hover:text-slate-900',
              )}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center text-red-700">
          Не вдалося завантажити заходи
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}

      {!isLoading && data && data.items.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-16 text-center text-slate-500">
          За цим запитом нічого не знайдено
        </div>
      )}

      {!isLoading && data && data.items.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
              >
                ← Назад
              </Button>
              <span className="text-sm text-slate-600">
                Сторінка {page} з {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
              >
                Далі →
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents, useEventParticipants } from '@/features/events/hooks';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CategoryBadge } from '@/features/events/CategoryBadge';
import { formatEventDate } from '@/lib/format';
import { STATUS_LABELS } from '@/lib/constants';
import { cn } from '@/lib/cn';
import type { EventStatus } from '@/lib/types';

const STATUS_TONES: Record<EventStatus, 'green' | 'red' | 'neutral' | 'blue'> = {
  draft:     'neutral',
  published: 'green',
  cancelled: 'red',
  completed: 'blue',
};

const STATUS_FILTERS: Array<{ value: EventStatus | 'all'; label: string }> = [
  { value: 'all',       label: 'Усі' },
  { value: 'published', label: 'Опубліковані' },
  { value: 'draft',     label: 'Чернетки' },
  { value: 'cancelled', label: 'Скасовані' },
  { value: 'completed', label: 'Завершені' },
];

function ParticipantsList({ eventId }: { eventId: string }) {
  const { data, isLoading } = useEventParticipants(eventId);

  if (isLoading) {
    return <div className="h-16 animate-pulse rounded bg-slate-100" />;
  }

  if (!data) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-sm">
        <span className="text-slate-600">
          <strong className="text-slate-900">{data.counts.registered}</strong>{' '}
          {data.capacity ? `з ${data.capacity}` : ''} зареєстровано
        </span>
        {data.counts.cancelled > 0 && (
          <span className="text-slate-400">
            {data.counts.cancelled} скасували
          </span>
        )}
      </div>

      {data.items.length === 0 && (
        <p className="text-sm text-slate-500 italic">Поки що немає учасників</p>
      )}

      <ul className="space-y-1.5">
        {data.items
          .filter((p) => p.status === 'registered')
          .map((p) => (
            <li
              key={p.registrationId}
              className="flex items-center gap-2 text-sm py-1.5 px-2 rounded hover:bg-slate-50"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                {p.user.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900 truncate">{p.user.name}</p>
                <p className="text-xs text-slate-500 truncate">{p.user.email}</p>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const myEvents = useEvents({
    organizerId: user?.id,
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 100,
    orderBy: 'createdAt',
    orderDir: 'desc',
  });

  const items = myEvents.data?.items ?? [];
  const total = myEvents.data?.pagination.total ?? 0;
  const counts = items.reduce(
    (acc, e) => {
      acc[e.status] = (acc[e.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<EventStatus, number>,
  );

  return (
    <section className="container py-8 max-w-5xl">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Кабінет організатора</h1>
          <p className="text-sm text-slate-500 mt-1">Управління вашими заходами</p>
        </div>
        <Link to="/create">
          <Button>+ Створити захід</Button>
        </Link>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {(
          [
            { key: 'all',       label: 'Усього',       value: total },
            { key: 'published', label: 'Опубліковано', value: counts.published ?? 0 },
            { key: 'draft',     label: 'Чернеток',     value: counts.draft ?? 0 },
            { key: 'cancelled', label: 'Скасовано',    value: counts.cancelled ?? 0 },
          ] as const
        ).map((stat) => (
          <Card key={stat.key}>
            <CardBody>
              <p className="text-xs uppercase tracking-wide text-slate-400">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-all',
              statusFilter === f.value
                ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-600/30'
                : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-slate-300 hover:text-slate-900',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Events list */}
      <div className="space-y-3">
        {myEvents.isLoading && (
          <>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </>
        )}

        {!myEvents.isLoading && items.length === 0 && (
          <Card>
            <CardBody className="text-center py-12">
              <p className="text-slate-500">У вас ще немає заходів</p>
              <Link to="/create" className="mt-3 inline-block text-brand-600 hover:underline">
                Створити перший
              </Link>
            </CardBody>
          </Card>
        )}

        {items.map((event) => {
          const isExpanded = expandedId === event.id;
          return (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CategoryBadge category={event.category} />
                      <Badge tone={STATUS_TONES[event.status]}>
                        {STATUS_LABELS[event.status]}
                      </Badge>
                    </div>
                    <Link
                      to={`/events/${event.id}`}
                      className="text-base font-semibold text-slate-900 hover:text-brand-600"
                    >
                      {event.title}
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatEventDate(event.startsAt)}
                      {event.locationName && ` · ${event.locationName}`}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : event.id)}
                      className="text-xs text-slate-500 hover:text-slate-900 underline"
                    >
                      {isExpanded ? 'Сховати учасників' : 'Учасники'}
                    </button>
                    <Link
                      to={`/events/${event.id}/edit`}
                      className="text-xs text-brand-600 hover:text-brand-800 underline"
                    >
                      Редагувати
                    </Link>
                  </div>
                </div>
              </CardHeader>
              {isExpanded && (
                <CardBody>
                  <ParticipantsList eventId={event.id} />
                </CardBody>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}

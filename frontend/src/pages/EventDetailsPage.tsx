import { useParams, Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { CategoryBadge } from '@/features/events/CategoryBadge';
import { CommentsSection } from '@/features/comments/CommentsSection';
import { RegisterButton } from '@/features/events/RegisterButton';
import { useEvent, useEventTags } from '@/features/events/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { formatEventDate } from '@/lib/format';
import { STATUS_LABELS } from '@/lib/constants';

export function EventDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();
  const { data, isLoading, isError } = useEvent(id);
  const tags = useEventTags(id);

  if (isLoading) {
    return (
      <div className="container py-12 space-y-4">
        <div className="h-72 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-32 animate-pulse rounded-lg bg-slate-100" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold">Захід не знайдено</h1>
        <p className="mt-2 text-slate-500">Можливо, його було видалено або URL некоректний.</p>
        <Link to="/events" className="mt-4 inline-block text-brand-600 hover:underline">
          Повернутись до каталогу
        </Link>
      </div>
    );
  }

  const event = data.event;
  const isOwner = user && event.organizer.id === user.id;
  const canEdit = isOwner || hasRole('admin');

  return (
    <article className="container py-8 max-w-5xl">
      {/* Hero */}
      <div className="overflow-hidden rounded-3xl bg-slate-100 mb-8 relative shadow-lg shadow-slate-200/60">
        <div className="aspect-[21/9] relative">
          {event.coverImageUrl ? (
            <img
              src={event.coverImageUrl}
              alt={event.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-200 via-brand-300 to-fuchsia-300" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <header>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <CategoryBadge category={event.category} />
              {event.status !== 'published' && (
                <Badge tone={event.status === 'cancelled' ? 'red' : 'neutral'}>
                  {STATUS_LABELS[event.status]}
                </Badge>
              )}
              {tags.data?.items.map((tag) => (
                <Badge key={tag.id} tone="neutral">
                  #{tag.name}
                </Badge>
              ))}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{event.title}</h1>
          </header>

          {event.description && (
            <div className="prose prose-slate max-w-none">
              <p className="whitespace-pre-wrap text-slate-700">{event.description}</p>
            </div>
          )}

          <CommentsSection eventId={event.id} />
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <Card>
            <CardBody className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Коли</p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {formatEventDate(event.startsAt)}
                </p>
                {event.endsAt && (
                  <p className="mt-1 text-xs text-slate-500">
                    до {formatEventDate(event.endsAt)}
                  </p>
                )}
              </div>

              {event.locationName && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Де</p>
                  <p className="mt-1 text-sm text-slate-900">{event.locationName}</p>
                </div>
              )}

              {event.capacity !== null && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Місць</p>
                  <p className="mt-1 text-sm text-slate-900">{event.capacity}</p>
                </div>
              )}

              <div className="pt-2">
                <RegisterButton event={event} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Організатор</p>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-700">
                  {event.organizer.name.slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-900">{event.organizer.name}</p>
                  {event.organizer.email && (
                    <a
                      href={`mailto:${event.organizer.email}`}
                      className="text-xs text-slate-500 hover:text-brand-600"
                    >
                      {event.organizer.email}
                    </a>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          {canEdit && (
            <Card>
              <CardBody className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-slate-400">Управління</p>
                <Link
                  to={`/events/${event.id}/edit`}
                  className="block text-sm text-brand-600 hover:underline"
                >
                  Редагувати захід
                </Link>
              </CardBody>
            </Card>
          )}
        </aside>
      </div>
    </article>
  );
}

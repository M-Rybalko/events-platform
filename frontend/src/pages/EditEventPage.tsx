import { useMemo } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  EventForm,
  toApiPayload,
  type EventFormValues,
} from '@/features/events/EventForm';
import {
  useEvent,
  useEventTags,
  useUpdateEvent,
  useDeleteEvent,
  usePublishEvent,
  useCancelEvent,
  useSetEventTags,
} from '@/features/events/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { STATUS_LABELS } from '@/lib/constants';
import { formatApiError } from '@/lib/error-messages';

// ISO → "YYYY-MM-DDTHH:mm" для datetime-local
function isoToLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, hasRole } = useAuth();

  const eventQuery = useEvent(id);
  const tagsQuery = useEventTags(id);

  const updateEvent = useUpdateEvent(id ?? '');
  const setTags = useSetEventTags(id ?? '');
  const deleteEvent = useDeleteEvent(id ?? '');
  const publishEvent = usePublishEvent(id ?? '');
  const cancelEvent = useCancelEvent(id ?? '');

  const defaults = useMemo<Partial<EventFormValues> | null>(() => {
    if (!eventQuery.data) return null;
    const e = eventQuery.data.event;
    return {
      title: e.title,
      description: e.description ?? '',
      startsAt: isoToLocalInput(e.startsAt),
      endsAt: isoToLocalInput(e.endsAt),
      locationName: e.locationName ?? '',
      latitude: e.latitude ? Number(e.latitude) : null,
      longitude: e.longitude ? Number(e.longitude) : null,
      category: e.category,
      capacity: e.capacity ?? '',
      coverImageUrl: e.coverImageUrl ?? '',
      tags: tagsQuery.data?.items.map((t) => t.name) ?? [],
    };
  }, [eventQuery.data, tagsQuery.data]);

  if (!id) return <Navigate to="/events" replace />;

  if (eventQuery.isLoading || tagsQuery.isLoading) {
    return (
      <section className="container py-12">
        <div className="h-72 animate-pulse rounded-xl bg-slate-100" />
      </section>
    );
  }

  if (eventQuery.isError || !eventQuery.data || !defaults) {
    return (
      <section className="container py-16 text-center">
        <h1 className="text-2xl font-bold">Захід не знайдено</h1>
        <Link to="/dashboard" className="mt-4 inline-block text-brand-600 hover:underline">
          Повернутись до кабінету
        </Link>
      </section>
    );
  }

  const event = eventQuery.data.event;
  const isOwner = user?.id === event.organizer.id;
  const canEdit = isOwner || hasRole('admin');

  if (!canEdit) {
    return (
      <section className="container py-16 text-center">
        <h1 className="text-2xl font-bold">Немає прав</h1>
        <p className="mt-2 text-slate-500">Лише організатор може редагувати цей захід.</p>
      </section>
    );
  }

  const handleSubmit = async (values: EventFormValues) => {
    try {
      await updateEvent.mutateAsync(toApiPayload(values));
      // Теги завжди — порівнювати з поточними дорого, просто заміна
      try {
        await setTags.mutateAsync(values.tags);
      } catch {
        toast.warning('Захід оновлено, але теги не зберегтись');
      }
      void qc.invalidateQueries({ queryKey: ['events', 'detail', id] });
      toast.success('Зміни збережено');
      navigate(`/events/${id}`);
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const handlePublish = async () => {
    try {
      await publishEvent.mutateAsync();
      toast.success('Захід опубліковано');
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Скасувати цей захід? Учасники втратять реєстрацію.')) return;
    try {
      await cancelEvent.mutateAsync();
      toast.success('Захід скасовано');
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Видалити захід назавжди? Цю дію не можна скасувати.')) return;
    try {
      await deleteEvent.mutateAsync();
      toast.success('Захід видалено');
      navigate('/dashboard');
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  return (
    <section className="container py-8 max-w-3xl">
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Редагування заходу</h1>
          <Badge tone={event.status === 'published' ? 'green' : event.status === 'cancelled' ? 'red' : 'neutral'}>
            {STATUS_LABELS[event.status]}
          </Badge>
        </div>
        <Link to={`/events/${id}`} className="text-sm text-brand-600 hover:underline mt-1 inline-block">
          ← До перегляду заходу
        </Link>
      </header>

      <EventForm
        defaultValues={defaults}
        submitLabel="Зберегти зміни"
        isSubmitting={updateEvent.isPending}
        onSubmit={handleSubmit}
      />

      <Card className="mt-8">
        <CardBody className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Управління статусом
          </h3>
          <div className="flex flex-wrap gap-2">
            {event.status === 'draft' && (
              <Button
                variant="primary"
                onClick={() => void handlePublish()}
                isLoading={publishEvent.isPending}
              >
                Опублікувати
              </Button>
            )}
            {(event.status === 'draft' || event.status === 'published') && (
              <Button
                variant="secondary"
                onClick={() => void handleCancel()}
                isLoading={cancelEvent.isPending}
              >
                Скасувати захід
              </Button>
            )}
            <Button
              variant="danger"
              onClick={() => void handleDelete()}
              isLoading={deleteEvent.isPending}
            >
              Видалити назавжди
            </Button>
          </div>
        </CardBody>
      </Card>
    </section>
  );
}

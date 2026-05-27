import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { EventForm, toApiPayload, type EventFormValues } from '@/features/events/EventForm';
import { useCreateEvent } from '@/features/events/hooks';
import { api } from '@/lib/api';
import { formatApiError } from '@/lib/error-messages';

export function CreateEventPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const createEvent = useCreateEvent();
  const [isPublishing, setIsPublishing] = useState(false);

  const handleSubmit = async (values: EventFormValues, andPublish = false) => {
    if (andPublish) setIsPublishing(true);
    try {
      const { event } = await createEvent.mutateAsync(toApiPayload(values));

      // Теги — окремий PUT після створення заходу
      if (values.tags.length > 0) {
        try {
          await api.put(`/api/events/${event.id}/tags`, { tags: values.tags });
        } catch {
          toast.warning('Захід створено, але теги не вдалося зберегти');
        }
      }

      // Публікація — окремий POST
      if (andPublish) {
        try {
          await api.post(`/api/events/${event.id}/publish`);
        } catch {
          toast.warning('Захід створено, але публікація не вдалася');
        }
      }

      void qc.invalidateQueries({ queryKey: ['events'] });
      toast.success(andPublish ? 'Захід опубліковано' : 'Захід збережено як чернетку');
      navigate(`/events/${event.id}`);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <section className="container py-8 max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Створення заходу</h1>
        <p className="text-sm text-slate-500 mt-1">
          Заповніть інформацію та збережіть як чернетку або опублікуйте одразу.
        </p>
      </header>

      <EventForm
        submitLabel="Зберегти як чернетку"
        isSubmitting={createEvent.isPending && !isPublishing}
        onSubmit={(values) => handleSubmit(values, false)}
        extraAction={{
          label: 'Опублікувати',
          variant: 'primary',
          onClick: (values) => handleSubmit(values, true),
          isLoading: isPublishing,
        }}
      />
    </section>
  );
}

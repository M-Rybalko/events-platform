import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { CATEGORIES, CATEGORY_LABELS } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { LocationPicker } from './LocationPicker';
import { TagsInput } from './TagsInput';
import type { EventCategory } from '@/lib/types';
import type { CreateEventInput } from './hooks';

// HTML datetime-local дає string на кшталт "2026-07-15T18:00"
const dtLocal = z.string().min(1, 'Вкажіть дату й час');

const schema = z
  .object({
    title: z.string().trim().min(3, 'Мінімум 3 символи').max(255),
    description: z.string().trim().max(10_000).optional().or(z.literal('')),
    startsAt: dtLocal,
    endsAt: z.string().optional().or(z.literal('')),
    locationName: z.string().trim().max(500).optional().or(z.literal('')),
    latitude: z.number().gte(-90).lte(90).nullable(),
    longitude: z.number().gte(-180).lte(180).nullable(),
    category: z.enum(['concert', 'volunteering', 'rally', 'festival', 'workshop']),
    capacity: z
      .union([z.coerce.number().int().positive().max(1_000_000), z.literal('')])
      .optional(),
    coverImageUrl: z.string().url('Не валідний URL').optional().or(z.literal('')),
    tags: z.array(z.string()),
  })
  .refine(
    (data) => !data.endsAt || new Date(data.endsAt) > new Date(data.startsAt),
    { message: 'Дата завершення має бути після дати початку', path: ['endsAt'] },
  )
  .refine(
    (data) => (data.latitude === null) === (data.longitude === null),
    { message: 'Координати треба задати разом', path: ['latitude'] },
  );

export type EventFormValues = z.infer<typeof schema>;

interface Props {
  defaultValues?: Partial<EventFormValues>;
  submitLabel: string;
  extraAction?: {
    label: string;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    onClick: (values: EventFormValues) => Promise<void> | void;
    isLoading?: boolean;
  };
  isSubmitting?: boolean;
  onSubmit: (values: EventFormValues) => Promise<void> | void;
}

const emptyDefaults: EventFormValues = {
  title: '',
  description: '',
  startsAt: '',
  endsAt: '',
  locationName: '',
  latitude: null,
  longitude: null,
  category: 'concert',
  capacity: '',
  coverImageUrl: '',
  tags: [],
};

export function EventForm({
  defaultValues,
  onSubmit,
  submitLabel,
  extraAction,
  isSubmitting,
}: Props) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ...emptyDefaults, ...defaultValues },
  });

  const category = watch('category');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Основне
        </h2>
        <Input
          label="Назва"
          placeholder="Наприклад: Концерт української музики"
          error={errors.title?.message}
          {...register('title')}
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Опис</label>
          <textarea
            {...register('description')}
            rows={5}
            placeholder="Розкажіть про захід…"
            className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
          />
          {errors.description?.message && (
            <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Категорія</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setValue('category', cat, { shouldValidate: true })}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-colors',
                  category === cat
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                )}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Коли
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Початок"
            type="datetime-local"
            error={errors.startsAt?.message}
            {...register('startsAt')}
          />
          <Input
            label="Завершення (опційно)"
            type="datetime-local"
            error={errors.endsAt?.message}
            {...register('endsAt')}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Де
        </h2>
        <Input
          label="Назва місця"
          placeholder="Парк Шевченка, Київ"
          error={errors.locationName?.message}
          {...register('locationName')}
        />
        <Controller
          control={control}
          name="latitude"
          render={() => (
            <LocationPicker
              latitude={watch('latitude')}
              longitude={watch('longitude')}
              onChange={({ latitude, longitude, addressLabel }) => {
                setValue('latitude', latitude, { shouldValidate: true });
                setValue('longitude', longitude, { shouldValidate: true });
                // Якщо адресу обрали з пошуку і поле "Назва місця" пусте — заповнимо
                if (addressLabel && !watch('locationName')) {
                  const shortLabel = addressLabel.split(',').slice(0, 3).join(',').trim();
                  setValue('locationName', shortLabel);
                }
              }}
            />
          )}
        />
        {errors.latitude?.message && (
          <p className="text-xs text-red-600">{errors.latitude.message}</p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Додатково
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Місць (опційно)"
            type="number"
            min={1}
            placeholder="100"
            error={errors.capacity?.message}
            {...register('capacity')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Обкладинка (опційно)
          </label>
          <Controller
            control={control}
            name="coverImageUrl"
            render={({ field }) => (
              <ImageUploader
                value={field.value || null}
                onChange={(url) => field.onChange(url ?? '')}
              />
            )}
          />
          {errors.coverImageUrl?.message && (
            <p className="mt-1 text-xs text-red-600">{errors.coverImageUrl.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Теги</label>
          <Controller
            control={control}
            name="tags"
            render={({ field }) => (
              <TagsInput value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
      </section>

      <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-end gap-2 pt-4 border-t border-slate-200">
        {extraAction && (
          <Button
            type="button"
            variant={extraAction.variant ?? 'secondary'}
            isLoading={extraAction.isLoading}
            onClick={() => void extraAction.onClick(getValues())}
          >
            {extraAction.label}
          </Button>
        )}
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

/**
 * Конвертує form values у формат для бекенду:
 * - порожні рядки → undefined
 * - datetime-local → ISO
 */
export function toApiPayload(values: EventFormValues): CreateEventInput {
  const out: CreateEventInput = {
    title: values.title.trim(),
    category: values.category as EventCategory,
    startsAt: new Date(values.startsAt).toISOString(),
  };
  if (values.description) out.description = values.description.trim();
  if (values.endsAt) out.endsAt = new Date(values.endsAt).toISOString();
  if (values.locationName) out.locationName = values.locationName.trim();
  if (values.latitude !== null && values.longitude !== null) {
    out.latitude = values.latitude;
    out.longitude = values.longitude;
  }
  if (values.capacity !== '' && values.capacity !== undefined) {
    out.capacity = Number(values.capacity);
  }
  if (values.coverImageUrl) out.coverImageUrl = values.coverImageUrl;
  return out;
}

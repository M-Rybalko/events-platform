import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/lib/env';
import { formatApiError } from '@/lib/error-messages';
import { cn } from '@/lib/cn';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Мінімум 2 символи').max(255),
  email: z.string().email('Введіть коректний email'),
  password: z.string().min(8, 'Мінімум 8 символів').max(72),
  role: z.enum(['participant', 'organizer']),
});

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { register: registerUser, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'participant' },
  });

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const role = watch('role');

  const onSubmit = handleSubmit(async (values) => {
    try {
      await registerUser(values);
      toast.success('Акаунт створено');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(formatApiError(err));
    }
  });

  return (
    <section className="container py-12 max-w-md">
      <Card>
        <CardHeader>
          <h1 className="text-xl font-semibold">Створити акаунт</h1>
          <p className="text-sm text-slate-500 mt-1">
            Вже маєте акаунт?{' '}
            <Link to="/login" className="text-brand-600 hover:underline">
              Увійти
            </Link>
          </p>
        </CardHeader>
        <CardBody>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Input
              label="Ім'я"
              autoComplete="name"
              placeholder="Іван Іванко"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Пароль"
              type="password"
              autoComplete="new-password"
              placeholder="Мінімум 8 символів"
              error={errors.password?.message}
              {...register('password')}
            />

            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Тип акаунту</p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: 'participant', title: 'Учасник', desc: 'Я хочу відвідувати заходи' },
                    { value: 'organizer',  title: 'Організатор', desc: 'Я хочу створювати заходи' },
                  ] as const
                ).map((opt) => {
                  const active = role === opt.value;
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setValue('role', opt.value, { shouldValidate: true })}
                      className={cn(
                        'rounded-lg border px-3 py-2.5 text-left transition-colors',
                        active
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white',
                      )}
                    >
                      <div className="text-sm font-medium text-slate-900">{opt.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Створити акаунт
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs uppercase tracking-wide text-slate-400">
                або
              </span>
            </div>
          </div>

          <a href={`${API_URL}/api/auth/google`} className="block">
            <Button type="button" variant="secondary" className="w-full">
              Продовжити через Google
            </Button>
          </a>
        </CardBody>
      </Card>
    </section>
  );
}

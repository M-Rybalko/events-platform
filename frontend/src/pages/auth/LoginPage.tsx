import { useEffect } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/lib/env';
import { formatApiError, formatOAuthError } from '@/lib/error-messages';

const loginSchema = z.object({
  email: z.string().email('Введіть коректний email'),
  password: z.string().min(1, 'Введіть пароль'),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';

  const oauthError = formatOAuthError(searchParams.get('error'));

  useEffect(() => {
    if (oauthError) toast.error(oauthError);
  }, [oauthError]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  if (!isLoading && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values.email, values.password);
      toast.success('Вітаємо!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(formatApiError(err));
    }
  });

  return (
    <section className="container py-12 max-w-md">
      <Card>
        <CardHeader>
          <h1 className="text-xl font-semibold">Увійти у Zbir.ua</h1>
          <p className="text-sm text-slate-500 mt-1">
            Немає акаунту?{' '}
            <Link to="/register" className="text-brand-600 hover:underline">
              Зареєструватись
            </Link>
          </p>
        </CardHeader>
        <CardBody>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Увійти
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
              Увійти через Google
            </Button>
          </a>
        </CardBody>
      </Card>
    </section>
  );
}

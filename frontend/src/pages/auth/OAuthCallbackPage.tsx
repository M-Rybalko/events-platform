import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { formatApiError, formatOAuthError } from '@/lib/error-messages';

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { applyAccessToken } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const error = searchParams.get('error');
    if (error) {
      toast.error(formatOAuthError(error) ?? 'Помилка входу');
      navigate('/login', { replace: true });
      return;
    }

    const token = searchParams.get('token');
    if (!token) {
      toast.error('Токен авторизації не отримано');
      navigate('/login', { replace: true });
      return;
    }

    void (async () => {
      try {
        await applyAccessToken(token);
        toast.success('Вхід виконано');
        navigate('/', { replace: true });
      } catch (err) {
        toast.error(formatApiError(err, 'Не вдалося завершити вхід'));
        navigate('/login', { replace: true });
      }
    })();
  }, [applyAccessToken, navigate, searchParams]);

  return (
    <section className="container py-24 text-center">
      <p className="text-sm text-slate-500">Завершуємо вхід через Google…</p>
    </section>
  );
}

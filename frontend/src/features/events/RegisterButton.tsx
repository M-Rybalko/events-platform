import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { formatApiError } from '@/lib/error-messages';
import { isEventPast } from '@/lib/format';
import {
  useCancelRegistration,
  useMyRegistrations,
  useRegisterForEvent,
} from './hooks';
import type { EventWithOrganizer } from '@/lib/types';

interface Props {
  event: EventWithOrganizer;
}

export function RegisterButton({ event }: Props) {
  const { isAuthenticated, hasRole } = useAuth();
  const myRegs = useMyRegistrations(isAuthenticated);
  const register = useRegisterForEvent(event.id);
  const cancel = useCancelRegistration(event.id);

  if (!isAuthenticated) {
    return (
      <Link to="/login" state={{ from: { pathname: `/events/${event.id}` } }}>
        <Button size="lg">Увійти, щоб зареєструватись</Button>
      </Link>
    );
  }

  if (hasRole('organizer', 'admin') && event.organizer.id) {
    // не блокуємо організаторів, але показуємо повідомлення для власника
  }

  if (event.status !== 'published') {
    return (
      <Button size="lg" disabled>
        Реєстрація недоступна
      </Button>
    );
  }

  if (isEventPast(event.startsAt)) {
    return (
      <Button size="lg" disabled>
        Захід уже відбувся
      </Button>
    );
  }

  const myActive = myRegs.data?.items.find(
    (r) => r.event.id === event.id && r.status === 'registered',
  );

  if (myActive) {
    return (
      <Button
        size="lg"
        variant="secondary"
        isLoading={cancel.isPending}
        onClick={async () => {
          try {
            await cancel.mutateAsync();
            toast.success('Реєстрацію скасовано');
          } catch (err) {
            toast.error(formatApiError(err));
          }
        }}
      >
        Скасувати реєстрацію
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      isLoading={register.isPending}
      onClick={async () => {
        try {
          await register.mutateAsync();
          toast.success('Ви зареєстровані');
        } catch (err) {
          toast.error(formatApiError(err));
        }
      }}
    >
      Зареєструватись
    </Button>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { useMyRegistrations } from '@/features/events/hooks';
import { CategoryBadge } from '@/features/events/CategoryBadge';
import { formatEventDate, isEventPast } from '@/lib/format';
import { cn } from '@/lib/cn';

type Tab = 'upcoming' | 'past' | 'cancelled';

export function ProfilePage() {
  const { user } = useAuth();
  const myRegs = useMyRegistrations();
  const [tab, setTab] = useState<Tab>('upcoming');

  const items = myRegs.data?.items ?? [];
  const filtered = items.filter((r) => {
    if (tab === 'cancelled') return r.status === 'cancelled';
    if (tab === 'upcoming') return r.status === 'registered' && !isEventPast(r.event.startsAt);
    return r.status === 'registered' && isEventPast(r.event.startsAt);
  });

  if (!user) return null;

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'upcoming',  label: 'Майбутні' },
    { key: 'past',      label: 'Відвідані' },
    { key: 'cancelled', label: 'Скасовані' },
  ];

  return (
    <section className="container py-8 max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Особистий кабінет</h1>
      </header>

      <Card className="mb-6">
        <CardBody>
          <div className="flex items-center gap-4">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-700">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
            <div className="flex-1">
              <p className="text-lg font-semibold">{user.name}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
            <Badge tone="brand">
              {user.role === 'organizer' ? 'Організатор' : user.role === 'admin' ? 'Адміністратор' : 'Учасник'}
            </Badge>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Мої реєстрації</h2>
            <p className="text-sm text-slate-500">{items.length}</p>
          </div>
          <div className="mt-3 flex gap-1 border-b border-slate-100 -mb-4">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  'px-3 py-2 -mb-px border-b-2 text-sm font-medium transition-colors',
                  tab === t.key
                    ? 'border-brand-500 text-brand-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardBody>
          {myRegs.isLoading && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          )}

          {!myRegs.isLoading && filtered.length === 0 && (
            <p className="text-center text-sm text-slate-500 py-8">
              {tab === 'upcoming' && 'Немає майбутніх реєстрацій'}
              {tab === 'past'     && 'Ви ще не відвідували жодного заходу'}
              {tab === 'cancelled' && 'Немає скасованих реєстрацій'}
            </p>
          )}

          <ul className="space-y-2">
            {filtered.map((r) => (
              <li key={r.registrationId}>
                <Link
                  to={`/events/${r.event.id}`}
                  className="block rounded-lg border border-slate-100 p-3 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CategoryBadge category={r.event.category} />
                        {r.status === 'cancelled' && <Badge tone="red">Скасовано</Badge>}
                      </div>
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {r.event.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatEventDate(r.event.startsAt)}
                        {r.event.locationName && ` · ${r.event.locationName}`}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </section>
  );
}

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { EventCard } from '@/features/events/EventCard';
import { NearbyEvents } from '@/features/events/NearbyEvents';
import { useEvents } from '@/features/events/hooks';

export function HomePage() {
  // useMemo щоб ISO не перераховувався на кожному рендері — інакше queryKey
  // змінюється і React Query йде у нескінченний цикл fetch'ів.
  const nowIso = useMemo(() => new Date().toISOString(), []);
  const upcoming = useEvents({
    status: 'published',
    startsAfter: nowIso,
    limit: 6,
    orderBy: 'startsAt',
    orderDir: 'asc',
  });

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Декоративні блоби */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50/60 via-white to-white" />
        <div className="absolute -top-32 -right-24 -z-10 h-96 w-96 rounded-full bg-brand-300/30 blur-3xl" />
        <div className="absolute top-20 -left-32 -z-10 h-80 w-80 rounded-full bg-fuchsia-300/30 blur-3xl" />

        <div className="container py-20 md:py-28 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-200/60 mb-6">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
            Платформа для громад
          </span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 max-w-3xl mx-auto">
            Знайди подію, яка{' '}
            <span className="bg-gradient-to-r from-brand-600 to-fuchsia-600 bg-clip-text text-transparent">
              важлива для тебе
            </span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Простір де громади об'єднуються довкола концертів, фестивалів,
            волонтерських акцій та освітніх воркшопів.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/events">
              <Button size="lg">Переглянути заходи</Button>
            </Link>
            <Link to="/map">
              <Button size="lg" variant="secondary">
                Відкрити карту
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Поблизу */}
      <section className="container pt-16 pb-4">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Поблизу вас</h2>
          <p className="text-sm text-slate-500 mt-2">
            Заходи у радіусі 100 км
          </p>
        </div>
        <NearbyEvents nowIso={nowIso} />
      </section>

      {/* Найближчі заходи */}
      <section className="container py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Найближчі за датою</h2>
            <p className="text-sm text-slate-500 mt-2">
              Запланують у наступні дні та тижні
            </p>
          </div>
          <Link
            to="/events"
            className="text-sm font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
          >
            Усі заходи
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        {upcoming.isLoading && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        )}

        {upcoming.data && upcoming.data.items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 px-4 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-500 mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-slate-700 font-medium">Поки що немає опублікованих заходів</p>
            <p className="text-sm text-slate-500 mt-1">Будьте першими — створіть подію!</p>
          </div>
        )}

        {upcoming.data && upcoming.data.items.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.data.items.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* Features */}
      <section className="container py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'Карта подій',
              desc: 'Знайдіть заходи поблизу на інтерактивній карті України',
              icon: (
                <path
                  d="M12 22s-7-7.5-7-13a7 7 0 0114 0c0 5.5-7 13-7 13z M12 9a2.5 2.5 0 100 0"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              ),
            },
            {
              title: 'Спільнота',
              desc: 'Відгуки, рейтинги та контакти організаторів — все в одному місці',
              icon: (
                <>
                  <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="17" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M3 20a6 6 0 0112 0M14 20a4 4 0 018 0" stroke="currentColor" strokeWidth="1.5" />
                </>
              ),
            },
            {
              title: 'Безкоштовно',
              desc: 'Без комісій та платних підписок — для громад і людей',
              icon: (
                <path
                  d="M12 2l3 6 6 1-4.5 4.5L18 20l-6-3-6 3 1.5-6.5L3 9l6-1z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              ),
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  {f.icon}
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

import { Link } from 'react-router-dom';
import { CategoryBadge } from './CategoryBadge';
import { formatEventDateShort } from '@/lib/format';
import type { EventWithOrganizer } from '@/lib/types';

interface Props {
  event: EventWithOrganizer;
}

export function EventCard({ event }: Props) {
  return (
    <Link
      to={`/events/${event.id}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/10 hover:border-brand-200"
    >
      <div className="aspect-[16/9] bg-gradient-to-br from-brand-100 via-brand-50 to-fuchsia-100 relative overflow-hidden">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-brand-300">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 7a4 4 0 014-4h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <circle cx="9" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M3 17l4.5-4.5a2 2 0 012.83 0L17 19"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        )}
        <div className="absolute left-3 top-3">
          <CategoryBadge category={event.category} />
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-base font-semibold text-slate-900 line-clamp-2 group-hover:text-brand-700 transition-colors">
          {event.title}
        </h3>

        <div className="mt-3 flex flex-col gap-1.5 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <svg className="text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {formatEventDateShort(event.startsAt)}
          </span>
          {event.locationName && (
            <span className="inline-flex items-center gap-1.5 line-clamp-1">
              <svg className="text-slate-400 flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 22s-7-7.5-7-13a7 7 0 0114 0c0 5.5-7 13-7 13z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <span className="truncate">{event.locationName}</span>
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-200 text-[10px] font-semibold text-brand-700">
            {event.organizer.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="truncate">{event.organizer.name}</span>
        </div>
      </div>
    </Link>
  );
}

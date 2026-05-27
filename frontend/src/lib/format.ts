import { format, formatDistanceToNow, isPast } from 'date-fns';
import { uk } from 'date-fns/locale';

export function formatEventDate(iso: string): string {
  return format(new Date(iso), "d MMMM yyyy 'о' HH:mm", { locale: uk });
}

export function formatEventDateShort(iso: string): string {
  return format(new Date(iso), 'd MMM, HH:mm', { locale: uk });
}

export function formatRelative(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: uk });
}

export function isEventPast(iso: string): boolean {
  return isPast(new Date(iso));
}

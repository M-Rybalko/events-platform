import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/constants';
import { cn } from '@/lib/cn';
import type { EventCategory } from '@/lib/types';

interface Props {
  category: EventCategory;
  className?: string;
}

export function CategoryBadge({ category, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        CATEGORY_COLORS[category],
        className,
      )}
    >
      {CATEGORY_LABELS[category]}
    </span>
  );
}

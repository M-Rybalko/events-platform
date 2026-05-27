import { cn } from '@/lib/cn';

interface Props {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

const sizeClass = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-7 w-7' };

export function RatingStars({ value, onChange, size = 'md', interactive }: Props) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        const Element = interactive ? 'button' : 'span';
        return (
          <Element
            key={n}
            type={interactive ? 'button' : undefined}
            onClick={interactive ? () => onChange?.(n) : undefined}
            className={cn(
              interactive && 'cursor-pointer transition-transform hover:scale-110',
              !interactive && 'pointer-events-none',
            )}
            aria-label={interactive ? `Оцінка ${n}` : undefined}
          >
            <svg
              viewBox="0 0 24 24"
              className={cn(sizeClass[size], filled ? 'fill-amber-400' : 'fill-slate-200')}
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </Element>
        );
      })}
    </div>
  );
}

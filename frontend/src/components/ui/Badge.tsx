import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'brand' | 'green' | 'red' | 'blue';

const toneStyles: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200/60',
  brand:   'bg-brand-50  text-brand-700  ring-brand-200/60',
  green:   'bg-emerald-50 text-emerald-700 ring-emerald-200/60',
  red:     'bg-red-50    text-red-700    ring-red-200/60',
  blue:    'bg-sky-50    text-sky-700    ring-sky-200/60',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        toneStyles[tone],
        className,
      )}
      {...props}
    />
  );
}

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-600/20 ' +
    'hover:shadow-md hover:shadow-brand-600/30 hover:from-brand-500 hover:to-brand-600 ' +
    'active:from-brand-600 active:to-brand-700 ' +
    'focus-visible:ring-brand-400',
  secondary:
    'bg-white text-slate-800 border border-slate-200 shadow-sm ' +
    'hover:bg-slate-50 hover:border-slate-300 ' +
    'active:bg-slate-100 ' +
    'focus-visible:ring-slate-300',
  ghost:
    'bg-transparent text-slate-700 ' +
    'hover:bg-slate-100 hover:text-slate-900 ' +
    'focus-visible:ring-slate-300',
  danger:
    'bg-red-600 text-white shadow-sm shadow-red-600/20 ' +
    'hover:bg-red-700 hover:shadow-md hover:shadow-red-600/30 ' +
    'active:bg-red-800 ' +
    'focus-visible:ring-red-400',
};

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm rounded-lg',
  md: 'h-10 px-4 text-sm rounded-xl',
  lg: 'h-12 px-6 text-base rounded-xl',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', isLoading, className, children, disabled, ...props },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
            <path d="M22 12a10 10 0 01-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span>Завантаження…</span>
        </span>
      ) : (
        children
      )}
    </button>
  ),
);

Button.displayName = 'Button';

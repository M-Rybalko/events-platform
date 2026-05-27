import { cn } from '@/lib/cn';

interface Props {
  className?: string;
  size?: number;
}

/**
 * Логотип Zbir.ua — три точки що утворюють трикутник.
 * Метафора: люди збираються в одному місці.
 */
export function LogoMark({ className, size = 28 }: Props) {
  return (
    <svg
      className={cn(className)}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="url(#zbir-logo-grad)" />
      <circle cx="11" cy="12" r="3" fill="white" />
      <circle cx="21" cy="12" r="3" fill="white" />
      <circle cx="16" cy="21" r="3" fill="white" />
      {/* Тонкі лінії що з'єднують точки — підкреслюють "збір" */}
      <path
        d="M11 12 L21 12 L16 21 Z"
        stroke="white"
        strokeOpacity="0.35"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="zbir-logo-grad" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark />
      <span className="font-semibold text-lg tracking-tight text-slate-900">
        Zbir<span className="text-brand-500">.ua</span>
      </span>
    </div>
  );
}

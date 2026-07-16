import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  isLoading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  className,
  isLoading = false,
  disabled,
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-hover shadow-sm shadow-primary/20',
    secondary: 'border border-border bg-white text-text-primary hover:bg-slate-50',
    ghost: 'border border-border bg-transparent text-text-primary hover:bg-slate-50',
  }[variant];

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={twMerge(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses,
        className,
      )}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

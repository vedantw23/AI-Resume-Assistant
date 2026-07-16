import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  children: ReactNode;
  className?: string;
}

export function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span
      className={twMerge(
        'inline-flex items-center rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-text-secondary',
        className,
      )}
    >
      {children}
    </span>
  );
}

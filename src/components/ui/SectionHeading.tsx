import type { ReactNode } from 'react';

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function SectionHeading({ eyebrow, title, description, action }: SectionHeadingProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">{title}</h2>
          {description ? <p className="max-w-2xl text-sm leading-6 text-text-secondary">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

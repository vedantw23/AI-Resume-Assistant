import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-slate-50 px-6 py-10 text-center">
      {icon ? <div className="mb-3 rounded-full bg-white p-3 text-primary shadow-sm">{icon}</div> : null}
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">{description}</p>
    </div>
  );
}

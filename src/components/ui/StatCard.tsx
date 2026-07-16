interface StatCardProps {
  label: string;
  value: string;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-text-secondary">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-text-primary">{value}</p>
    </div>
  );
}

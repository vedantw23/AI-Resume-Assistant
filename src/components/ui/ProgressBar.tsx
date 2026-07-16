interface ProgressBarProps {
  value: number;
}

export function ProgressBar({ value }: ProgressBarProps) {
  return (
    <div
      className="h-3 overflow-hidden rounded-full bg-slate-100"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progress ${value}%`}
    >
      <div className="h-full rounded-full bg-gradient-to-r from-primary to-sky-500 transition-all duration-500" style={{ width: `${value}%` }} />
    </div>
  );
}

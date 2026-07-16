import { Sparkles } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary">Smart Resume Assistant</p>
            <p className="text-xs text-text-secondary">Resume check and tips</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <span className="rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs font-medium text-success">
            PDF + DOCX
          </span>
          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Simple results
          </span>
        </div>
      </div>
    </header>
  );
}

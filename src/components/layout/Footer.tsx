export function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>Smart Resume Assistant. Simple resume checks and clear tips.</p>
        <div className="flex flex-wrap gap-4">
          <a className="transition hover:text-text-primary" href="/" onClick={(event) => event.preventDefault()}>
            Privacy
          </a>
          <a className="transition hover:text-text-primary" href="/" onClick={(event) => event.preventDefault()}>
            Terms
          </a>
          <a className="transition hover:text-text-primary" href="https://github.com/vedantw23/AI-Resume-Assistant" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <span>Made for easy resume help</span>
        </div>
      </div>
    </footer>
  );
}

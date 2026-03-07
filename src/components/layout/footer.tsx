export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] mt-16">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Photographer name & tagline */}
          <div>
            <p className="text-base font-light tracking-tight text-[var(--text-primary)]">
              Chris Harding Photography
            </p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Capturing moments that matter
            </p>
          </div>

          {/* Copyright & admin */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-[var(--text-secondary)] tracking-wide">
              &copy; {year} Chris Harding Photography
            </p>
            <a
              href="/login"
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Admin
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

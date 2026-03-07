interface FooterProps {
  siteTitle: string;
}

export function Footer({ siteTitle }: FooterProps) {
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

          {/* Social links */}
          <div className="flex items-center gap-6">
            <a
              href="https://instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Instagram"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a
              href="mailto:chris@example.com"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Email"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </a>
          </div>

          {/* Copyright */}
          <p className="text-xs text-[var(--text-secondary)] tracking-wide">
            &copy; {year} {siteTitle}
          </p>
        </div>
      </div>
    </footer>
  );
}

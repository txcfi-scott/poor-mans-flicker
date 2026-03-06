'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface HeaderProps {
  siteTitle: string;
  transparent?: boolean;
}

export function Header({ siteTitle, transparent = false }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const bgClass = transparent
    ? 'bg-transparent absolute top-0 left-0 right-0 z-50'
    : 'bg-[#141416] border-b border-[#2A2A30] sticky top-0 z-50';

  return (
    <>
      <header className={`h-16 ${bgClass}`}>
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Site title */}
          <Link
            href="/"
            className="text-lg font-bold text-[#F0F0F2] hover:text-[#6B8AFF] transition-colors truncate"
          >
            {siteTitle}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 lg:flex">
            <Link
              href="/albums"
              className="text-sm font-medium text-[#9E9EA8] hover:text-[#F0F0F2] transition-colors"
            >
              Albums
            </Link>
          </nav>

          {/* Mobile hamburger — 44px touch target */}
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-[#9E9EA8] hover:bg-[#1E1E22] hover:text-[#F0F0F2] transition-colors lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile overlay menu — always rendered, animated with CSS transitions */}
      <div
        className={`fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#0A0A0B] transition-opacity duration-300 lg:hidden ${
          menuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!menuOpen}
      >
        {/* Close button — 44px touch target */}
        <button
          type="button"
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-lg text-[#9E9EA8] hover:bg-[#1E1E22] hover:text-[#F0F0F2] transition-colors"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
          tabIndex={menuOpen ? 0 : -1}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <nav className="flex flex-col items-center gap-4">
          <Link
            href="/"
            className="py-3 px-6 text-2xl font-semibold text-[#F0F0F2] hover:text-[#6B8AFF] transition-colors"
            onClick={() => setMenuOpen(false)}
            tabIndex={menuOpen ? 0 : -1}
          >
            Home
          </Link>
          <Link
            href="/albums"
            className="py-3 px-6 text-2xl font-semibold text-[#F0F0F2] hover:text-[#6B8AFF] transition-colors"
            onClick={() => setMenuOpen(false)}
            tabIndex={menuOpen ? 0 : -1}
          >
            Albums
          </Link>
        </nav>
      </div>
    </>
  );
}

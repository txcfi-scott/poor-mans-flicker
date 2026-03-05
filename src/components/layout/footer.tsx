import Link from 'next/link';

interface FooterProps {
  siteTitle: string;
}

export function Footer({ siteTitle }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="h-20 border-t border-[#2A2A30] bg-[#141416]">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 max-lg:flex-col max-lg:justify-center max-lg:gap-2">
        <span className="text-sm text-[#636370]">{siteTitle}</span>
        <span className="text-sm text-[#636370]">&copy; {year}</span>
        <Link
          href="/admin"
          className="text-sm text-[#636370] hover:text-[#9E9EA8] transition-colors"
        >
          Admin
        </Link>
      </div>
    </footer>
  );
}

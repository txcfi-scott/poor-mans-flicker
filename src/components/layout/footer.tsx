interface FooterProps {
  siteTitle: string;
}

export function Footer({ siteTitle }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="py-12 text-center">
      <p className="text-xs text-muted-foreground tracking-wide">
        &copy; {year} {siteTitle}
      </p>
    </footer>
  );
}

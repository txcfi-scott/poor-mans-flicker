import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getSiteConfig } from '@/lib/db/queries/config';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const config = await getSiteConfig();
  const siteTitle = config?.siteTitle ?? 'My Photography';

  return (
    <div className="flex min-h-screen flex-col">
      <Header siteTitle={siteTitle} />
      <main className="flex-1">{children}</main>
      <Footer siteTitle={siteTitle} />
    </div>
  );
}

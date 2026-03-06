import { getSiteConfig } from '@/lib/db/queries/config';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const config = await getSiteConfig();
  const siteTitle = config?.siteTitle ?? 'My Photography';

  return (
    <div className="flex min-h-screen bg-[#0A0A0B]">
      <AdminSidebar siteTitle={siteTitle} />
      <main className="flex-1 min-w-0 lg:pl-0 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

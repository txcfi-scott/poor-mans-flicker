import { getSiteConfig } from '@/lib/db/queries/config';
import SettingsForm from '@/components/admin/SettingsForm';

export default async function SettingsPage() {
  const config = await getSiteConfig();

  const initialConfig = {
    siteTitle: config?.siteTitle ?? 'My Photography',
    siteDescription: config?.siteDescription ?? 'A photography portfolio',
    heroIntervalMs: config?.heroIntervalMs ?? 5000,
    slideshowDefaultIntervalMs: config?.slideshowDefaultIntervalMs ?? 4000,
    trashRetentionDays: config?.trashRetentionDays ?? 30,
  };

  return (
    <>
      <h1 className="text-2xl font-semibold text-[#F0F0F2] mb-6">Settings</h1>
      <div className="bg-[#141416] border border-[#2A2A30] rounded-xl p-6">
        <SettingsForm initialConfig={initialConfig} />
      </div>
    </>
  );
}

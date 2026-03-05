import { db } from '@/lib/db';
import { siteConfig } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getSiteConfig() {
  const results = await db.select().from(siteConfig).where(eq(siteConfig.id, 1));
  return results[0] ?? null;
}

export async function updateSiteConfig(data: Partial<typeof siteConfig.$inferInsert>) {
  await db.update(siteConfig).set(data).where(eq(siteConfig.id, 1));
  return getSiteConfig();
}

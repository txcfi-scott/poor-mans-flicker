import { db } from '@/lib/db';
import { siteConfig } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getSiteConfig() {
  const results = await db.select().from(siteConfig).where(eq(siteConfig.id, 1));
  if (results[0]) return results[0];

  // Auto-create the singleton config row with defaults if it doesn't exist
  await db.insert(siteConfig).values({ id: 1 }).onConflictDoNothing();
  const retry = await db.select().from(siteConfig).where(eq(siteConfig.id, 1));
  return retry[0] ?? null;
}

export async function updateSiteConfig(data: Partial<typeof siteConfig.$inferInsert>) {
  await db.update(siteConfig).set(data).where(eq(siteConfig.id, 1));
  return getSiteConfig();
}

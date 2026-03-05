import { db } from '@/lib/db';
import { photos } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function getPhotosByAlbum(albumId: string) {
  return db
    .select()
    .from(photos)
    .where(eq(photos.albumId, albumId))
    .orderBy(asc(photos.sortOrder));
}

export async function getPhoto(id: string) {
  const results = await db.select().from(photos).where(eq(photos.id, id));
  return results[0] ?? null;
}

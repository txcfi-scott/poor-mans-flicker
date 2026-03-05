import { db } from '@/lib/db';
import { photos } from '@/lib/db/schema';
import { eq, asc, and, isNull, isNotNull, inArray, lt } from 'drizzle-orm';

export async function getPhotosByAlbum(albumId: string) {
  return db
    .select()
    .from(photos)
    .where(and(eq(photos.albumId, albumId), isNull(photos.deletedAt)))
    .orderBy(asc(photos.sortOrder));
}

export async function getPhoto(id: string) {
  const results = await db.select().from(photos).where(and(eq(photos.id, id), isNull(photos.deletedAt)));
  return results[0] ?? null;
}

export async function getDeletedPhotos() {
  return db
    .select()
    .from(photos)
    .where(isNotNull(photos.deletedAt))
    .orderBy(asc(photos.sortOrder));
}

export async function softDeletePhoto(id: string) {
  await db
    .update(photos)
    .set({ deletedAt: Date.now(), deletedBy: 'user' })
    .where(eq(photos.id, id));
}

export async function softDeletePhotos(ids: string[]) {
  if (ids.length === 0) return;
  const now = Date.now();
  await db
    .update(photos)
    .set({ deletedAt: now, deletedBy: 'user' })
    .where(inArray(photos.id, ids));
}

export async function restorePhoto(id: string) {
  await db
    .update(photos)
    .set({ deletedAt: null, deletedBy: null })
    .where(eq(photos.id, id));
}

export async function permanentlyDeletePhotos(ids: string[]) {
  if (ids.length === 0) return;
  await db.delete(photos).where(inArray(photos.id, ids));
}

export async function getExpiredTrashPhotos(retentionDays: number) {
  const cutoff = Date.now() - (retentionDays * 86400000);
  return db
    .select()
    .from(photos)
    .where(and(isNotNull(photos.deletedAt), lt(photos.deletedAt, cutoff)));
}

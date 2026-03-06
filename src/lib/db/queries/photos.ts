// TODO: Pagination — queries currently return all rows. Add limit/offset or cursor-based
// pagination when photo counts grow large enough to warrant it.

import { db } from '@/lib/db';
import { photos, albums } from '@/lib/db/schema';
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

export async function getFavoritePhotos() {
  return db
    .select({
      id: photos.id,
      albumId: photos.albumId,
      storageKey: photos.storageKey,
      blurhash: photos.blurhash,
      caption: photos.caption,
      width: photos.width,
      height: photos.height,
      sortOrder: photos.sortOrder,
      albumTitle: albums.title,
      albumSlug: albums.slug,
    })
    .from(photos)
    .innerJoin(albums, eq(photos.albumId, albums.id))
    .where(and(eq(photos.isFavorite, true), isNull(photos.deletedAt), isNull(albums.deletedAt)))
    .orderBy(asc(photos.sortOrder));
}

export async function toggleFavorite(photoId: string, isFavorite: boolean) {
  await db
    .update(photos)
    .set({ isFavorite })
    .where(eq(photos.id, photoId));
}

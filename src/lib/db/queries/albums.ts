// TODO: Pagination — queries currently return all rows. Add limit/offset or cursor-based
// pagination when album counts grow large enough to warrant it.

import { db } from '@/lib/db';
import { albums, photos } from '@/lib/db/schema';
import { eq, asc, count, inArray, isNull, isNotNull, and } from 'drizzle-orm';
import { getStorageProvider } from '@/lib/storage';

export async function getAlbums(includePrivate = false) {
  const storage = getStorageProvider();

  // Get albums with optional public filter
  const albumList = await db
    .select({
      id: albums.id,
      title: albums.title,
      slug: albums.slug,
      description: albums.description,
      coverPhotoId: albums.coverPhotoId,
      sortOrder: albums.sortOrder,
      isHero: albums.isHero,
      isPublic: albums.isPublic,
      createdAt: albums.createdAt,
      updatedAt: albums.updatedAt,
    })
    .from(albums)
    .where(
      includePrivate
        ? isNull(albums.deletedAt)
        : and(eq(albums.isPublic, true), isNull(albums.deletedAt))
    )
    .orderBy(asc(albums.sortOrder));

  // Get photo counts per album
  const counts = await db
    .select({
      albumId: photos.albumId,
      count: count(),
    })
    .from(photos)
    .where(isNull(photos.deletedAt))
    .groupBy(photos.albumId);

  const countMap = new Map(counts.map(c => [c.albumId, c.count]));

  // Get cover photo info
  const coverPhotoIds = albumList.map(a => a.coverPhotoId).filter(Boolean) as string[];
  let coverPhotos: { id: string; storageKey: string; blurhash: string }[] = [];
  if (coverPhotoIds.length > 0) {
    coverPhotos = await db
      .select({ id: photos.id, storageKey: photos.storageKey, blurhash: photos.blurhash })
      .from(photos)
      .where(inArray(photos.id, coverPhotoIds));
  }
  const coverMap = new Map(coverPhotos.map(p => [p.id, p]));

  return albumList.map(album => {
    const cover = album.coverPhotoId ? coverMap.get(album.coverPhotoId) : null;
    return {
      ...album,
      photoCount: countMap.get(album.id) ?? 0,
      coverPhotoUrl: cover ? storage.getUrl(`${cover.storageKey}/thumb.webp`) : null,
      coverPhotoBlurhash: cover?.blurhash ?? null,
    };
  });
}

export async function getAlbum(id: string) {
  const results = await db.select().from(albums).where(and(eq(albums.id, id), isNull(albums.deletedAt)));
  const album = results[0] ?? null;
  if (!album) return null;

  const albumPhotos = await db
    .select()
    .from(photos)
    .where(and(eq(photos.albumId, id), isNull(photos.deletedAt)))
    .orderBy(asc(photos.sortOrder));

  return { album, photos: albumPhotos };
}

export async function getAlbumBySlug(slug: string) {
  const results = await db.select().from(albums).where(and(eq(albums.slug, slug), isNull(albums.deletedAt)));
  const album = results[0] ?? null;
  if (!album) return null;

  const albumPhotos = await db
    .select()
    .from(photos)
    .where(and(eq(photos.albumId, album.id), isNull(photos.deletedAt)))
    .orderBy(asc(photos.sortOrder));

  return { album, photos: albumPhotos };
}

export async function getHeroAlbums() {
  const heroAlbums = await db
    .select()
    .from(albums)
    .where(and(eq(albums.isHero, true), isNull(albums.deletedAt)))
    .orderBy(asc(albums.sortOrder));

  const heroPhotos = [];
  for (const album of heroAlbums) {
    const albumPhotos = await db
      .select()
      .from(photos)
      .where(and(eq(photos.albumId, album.id), isNull(photos.deletedAt)))
      .orderBy(asc(photos.sortOrder));
    heroPhotos.push(...albumPhotos.map(p => ({ ...p, albumTitle: album.title, albumSlug: album.slug })));
  }

  return heroPhotos;
}

export async function getDeletedAlbums() {
  return db
    .select()
    .from(albums)
    .where(isNotNull(albums.deletedAt))
    .orderBy(asc(albums.sortOrder));
}

export async function softDeleteAlbum(id: string) {
  const now = Date.now();
  await db.update(albums).set({ deletedAt: now }).where(eq(albums.id, id));
  await db
    .update(photos)
    .set({ deletedAt: now, deletedBy: 'cascade' })
    .where(and(eq(photos.albumId, id), isNull(photos.deletedAt)));
}

export async function restoreAlbum(id: string) {
  await db.update(albums).set({ deletedAt: null }).where(eq(albums.id, id));
  await db
    .update(photos)
    .set({ deletedAt: null, deletedBy: null })
    .where(and(eq(photos.albumId, id), eq(photos.deletedBy, 'cascade')));
}

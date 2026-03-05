import { db } from '@/lib/db';
import { albums, photos } from '@/lib/db/schema';
import { eq, asc, count, inArray } from 'drizzle-orm';
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
    .where(includePrivate ? undefined : eq(albums.isPublic, true))
    .orderBy(asc(albums.sortOrder));

  // Get photo counts per album
  const counts = await db
    .select({
      albumId: photos.albumId,
      count: count(),
    })
    .from(photos)
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
  const results = await db.select().from(albums).where(eq(albums.id, id));
  const album = results[0] ?? null;
  if (!album) return null;

  const albumPhotos = await db
    .select()
    .from(photos)
    .where(eq(photos.albumId, id))
    .orderBy(asc(photos.sortOrder));

  return { album, photos: albumPhotos };
}

export async function getAlbumBySlug(slug: string) {
  const results = await db.select().from(albums).where(eq(albums.slug, slug));
  const album = results[0] ?? null;
  if (!album) return null;

  const albumPhotos = await db
    .select()
    .from(photos)
    .where(eq(photos.albumId, album.id))
    .orderBy(asc(photos.sortOrder));

  return { album, photos: albumPhotos };
}

export async function getHeroAlbums() {
  const heroAlbums = await db
    .select()
    .from(albums)
    .where(eq(albums.isHero, true))
    .orderBy(asc(albums.sortOrder));

  const heroPhotos = [];
  for (const album of heroAlbums) {
    const albumPhotos = await db
      .select()
      .from(photos)
      .where(eq(photos.albumId, album.id))
      .orderBy(asc(photos.sortOrder));
    heroPhotos.push(...albumPhotos.map(p => ({ ...p, albumTitle: album.title, albumSlug: album.slug })));
  }

  return heroPhotos;
}

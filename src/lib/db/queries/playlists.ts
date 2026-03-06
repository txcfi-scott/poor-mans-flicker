import { db } from '@/lib/db';
import { playlists, playlistPhotos, photos } from '@/lib/db/schema';
import { eq, asc, max, inArray, and, isNull } from 'drizzle-orm';
import { generateId } from '@/lib/utils/id';
import { getPhotoUrl } from '@/lib/utils/url';
import { count } from 'drizzle-orm';

export async function getPlaylists(includePrivate = false) {
  const conditions = includePrivate ? undefined : eq(playlists.isPublic, true);

  const playlistList = await db
    .select({
      id: playlists.id,
      title: playlists.title,
      slug: playlists.slug,
      description: playlists.description,
      sortOrder: playlists.sortOrder,
      isPublic: playlists.isPublic,
      createdAt: playlists.createdAt,
      updatedAt: playlists.updatedAt,
    })
    .from(playlists)
    .where(conditions)
    .orderBy(asc(playlists.sortOrder));

  // Get photo counts per playlist
  const counts = await db
    .select({
      playlistId: playlistPhotos.playlistId,
      count: count(),
    })
    .from(playlistPhotos)
    .innerJoin(photos, and(eq(playlistPhotos.photoId, photos.id), isNull(photos.deletedAt)))
    .groupBy(playlistPhotos.playlistId);

  const countMap = new Map(counts.map(c => [c.playlistId, c.count]));

  return playlistList.map(playlist => ({
    ...playlist,
    photoCount: countMap.get(playlist.id) ?? 0,
  }));
}

export async function getPlaylist(id: string) {
  const results = await db.select().from(playlists).where(eq(playlists.id, id));
  return results[0] ?? null;
}

export async function getPlaylistBySlug(slug: string) {
  const results = await db.select().from(playlists).where(eq(playlists.slug, slug));
  const playlist = results[0] ?? null;
  if (!playlist) return null;

  const photoCountResult = await db
    .select({ count: count() })
    .from(playlistPhotos)
    .innerJoin(photos, and(eq(playlistPhotos.photoId, photos.id), isNull(photos.deletedAt)))
    .where(eq(playlistPhotos.playlistId, playlist.id));

  return {
    ...playlist,
    photoCount: photoCountResult[0]?.count ?? 0,
  };
}

export async function getPlaylistWithPhotos(id: string) {
  const playlist = await getPlaylist(id);
  if (!playlist) return null;

  const playlistPhotoRows = await db
    .select({
      playlistPhotoId: playlistPhotos.id,
      playlistPhotoSortOrder: playlistPhotos.sortOrder,
      addedAt: playlistPhotos.addedAt,
      id: photos.id,
      albumId: photos.albumId,
      filename: photos.filename,
      originalFilename: photos.originalFilename,
      width: photos.width,
      height: photos.height,
      sizeBytes: photos.sizeBytes,
      mimeType: photos.mimeType,
      caption: photos.caption,
      storageKey: photos.storageKey,
      blurhash: photos.blurhash,
      sortOrder: photos.sortOrder,
      createdAt: photos.createdAt,
    })
    .from(playlistPhotos)
    .innerJoin(photos, and(eq(playlistPhotos.photoId, photos.id), isNull(photos.deletedAt)))
    .where(eq(playlistPhotos.playlistId, id))
    .orderBy(asc(playlistPhotos.sortOrder));

  const photosWithUrls = playlistPhotoRows.map(row => ({
    playlistPhotoId: row.playlistPhotoId,
    playlistPhotoSortOrder: row.playlistPhotoSortOrder,
    addedAt: row.addedAt,
    id: row.id,
    albumId: row.albumId,
    filename: row.filename,
    originalFilename: row.originalFilename,
    width: row.width,
    height: row.height,
    sizeBytes: row.sizeBytes,
    mimeType: row.mimeType,
    caption: row.caption,
    storageKey: row.storageKey,
    blurhash: row.blurhash,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    urls: {
      thumb: getPhotoUrl(row.storageKey, 'thumb'),
      display: getPhotoUrl(row.storageKey, 'display'),
      full: getPhotoUrl(row.storageKey, 'full'),
    },
  }));

  return { playlist, photos: photosWithUrls };
}

export async function getPlaylistPhotosForPlayback(id: string) {
  const playlistPhotoRows = await db
    .select({
      id: photos.id,
      storageKey: photos.storageKey,
      width: photos.width,
      height: photos.height,
      blurhash: photos.blurhash,
      caption: photos.caption,
    })
    .from(playlistPhotos)
    .innerJoin(photos, and(eq(playlistPhotos.photoId, photos.id), isNull(photos.deletedAt)))
    .where(eq(playlistPhotos.playlistId, id))
    .orderBy(asc(playlistPhotos.sortOrder));

  return playlistPhotoRows.map(row => ({
    ...row,
    url: getPhotoUrl(row.storageKey, 'full'),
  }));
}

export async function createPlaylist(data: {
  title: string;
  slug: string;
  description?: string | null;
  isPublic?: boolean;
}) {
  const id = generateId();
  const now = new Date();

  // Get next sort order
  const maxResult = await db.select({ maxSort: max(playlists.sortOrder) }).from(playlists);
  const sortOrder = (maxResult[0]?.maxSort ?? -1) + 1;

  await db.insert(playlists).values({
    id,
    title: data.title,
    slug: data.slug,
    description: data.description ?? null,
    isPublic: data.isPublic ?? true,
    sortOrder,
    createdAt: now,
    updatedAt: now,
  });

  const created = await db.select().from(playlists).where(eq(playlists.id, id));
  return created[0];
}

export async function updatePlaylist(
  id: string,
  data: Partial<{ title: string; slug: string; description: string | null; isPublic: boolean }>
) {
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (data.title !== undefined) updates.title = data.title;
  if (data.slug !== undefined) updates.slug = data.slug;
  if (data.description !== undefined) updates.description = data.description;
  if (data.isPublic !== undefined) updates.isPublic = data.isPublic;

  await db.update(playlists).set(updates).where(eq(playlists.id, id));
  const updated = await db.select().from(playlists).where(eq(playlists.id, id));
  return updated[0] ?? null;
}

export async function deletePlaylist(id: string) {
  await db.delete(playlists).where(eq(playlists.id, id));
}

export async function addPhotosToPlaylist(playlistId: string, photoIds: string[]) {
  if (photoIds.length === 0) return;

  // Get current max sort order in this playlist
  const maxResult = await db
    .select({ maxSort: max(playlistPhotos.sortOrder) })
    .from(playlistPhotos)
    .where(eq(playlistPhotos.playlistId, playlistId));
  let nextSort = (maxResult[0]?.maxSort ?? -1) + 1;

  const values = photoIds.map(photoId => ({
    id: generateId(),
    playlistId,
    photoId,
    sortOrder: nextSort++,
    addedAt: new Date(),
  }));

  await db.insert(playlistPhotos).values(values);
}

export async function removePhotosFromPlaylist(playlistId: string, photoIds: string[]) {
  if (photoIds.length === 0) return;

  await db
    .delete(playlistPhotos)
    .where(
      and(
        eq(playlistPhotos.playlistId, playlistId),
        inArray(playlistPhotos.photoId, photoIds)
      )
    );
}

export async function reorderPlaylistPhotos(
  playlistId: string,
  order: { id: string; sortOrder: number }[]
) {
  for (const item of order) {
    await db
      .update(playlistPhotos)
      .set({ sortOrder: item.sortOrder })
      .where(
        and(
          eq(playlistPhotos.id, item.id),
          eq(playlistPhotos.playlistId, playlistId)
        )
      );
  }
}

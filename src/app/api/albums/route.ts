import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { albums, photos } from '@/lib/db/schema';
import { eq, asc, count, max, inArray } from 'drizzle-orm';
import { generateId } from '@/lib/utils/id';
import { generateSlug } from '@/lib/utils/slug';
import { apiSuccess, apiError } from '@/lib/api/response';
import { getStorageProvider } from '@/lib/storage';

export async function GET(request: NextRequest) {
  const includePrivate = request.nextUrl.searchParams.get('includePrivate') === 'true';
  const storage = getStorageProvider();

  const albumList = await db
    .select()
    .from(albums)
    .where(includePrivate ? undefined : eq(albums.isPublic, true))
    .orderBy(asc(albums.sortOrder));

  // Get photo counts
  const countResults = await db
    .select({ albumId: photos.albumId, photoCount: count() })
    .from(photos)
    .groupBy(photos.albumId);
  const countMap = new Map(countResults.map(c => [c.albumId, c.photoCount]));

  // Get cover photos
  const coverIds = albumList.map(a => a.coverPhotoId).filter(Boolean) as string[];
  let coverMap = new Map<string, { storageKey: string; blurhash: string }>();
  if (coverIds.length > 0) {
    const covers = await db
      .select({ id: photos.id, storageKey: photos.storageKey, blurhash: photos.blurhash })
      .from(photos)
      .where(inArray(photos.id, coverIds));
    coverMap = new Map(covers.map(c => [c.id, c]));
  }

  const result = albumList.map(album => {
    const cover = album.coverPhotoId ? coverMap.get(album.coverPhotoId) : null;
    return {
      ...album,
      photoCount: countMap.get(album.id) ?? 0,
      coverPhotoUrl: cover ? storage.getUrl(`${cover.storageKey}/thumb.webp`) : null,
      coverPhotoBlurhash: cover?.blurhash ?? null,
    };
  });

  return apiSuccess({ albums: result });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, isPublic = true, isHero = false } = body;

  if (!title || typeof title !== 'string' || title.trim().length === 0 || title.length > 200) {
    return apiError('Title is required and must be under 200 characters', 'INVALID_TITLE', 400);
  }

  // Generate unique slug
  let slug = generateSlug(title);
  let attempt = 0;
  while (attempt < 10) {
    const existing = await db.select({ id: albums.id }).from(albums).where(eq(albums.slug, slug));
    if (existing.length === 0) break;
    attempt++;
    slug = `${generateSlug(title)}-${attempt}`;
  }
  if (attempt >= 10) {
    return apiError('Could not generate unique slug', 'SLUG_GENERATION_FAILED', 409);
  }

  // Get next sort order
  const maxResult = await db.select({ maxSort: max(albums.sortOrder) }).from(albums);
  const sortOrder = (maxResult[0]?.maxSort ?? -1) + 1;

  // If setting as hero, unset existing hero
  if (isHero) {
    await db.update(albums).set({ isHero: false }).where(eq(albums.isHero, true));
  }

  const id = generateId();
  const now = new Date();

  await db.insert(albums).values({
    id,
    title: title.trim(),
    slug,
    description: description?.trim() || null,
    isPublic,
    isHero,
    sortOrder,
    createdAt: now,
    updatedAt: now,
  });

  const created = await db.select().from(albums).where(eq(albums.id, id));
  return apiSuccess({ album: created[0] }, 201);
}

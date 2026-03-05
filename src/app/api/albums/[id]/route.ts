import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { albums, photos } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateSlug } from '@/lib/utils/slug';
import { getStorageProvider } from '@/lib/storage';
import { apiSuccess, apiError } from '@/lib/api/response';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const album = await db.select().from(albums).where(eq(albums.id, id));
  if (album.length === 0) {
    return apiError('Album not found', 'ALBUM_NOT_FOUND', 404);
  }

  const albumPhotos = await db.select().from(photos).where(eq(photos.albumId, id));
  return apiSuccess({ album: album[0], photos: albumPhotos });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await db.select().from(albums).where(eq(albums.id, id));
  if (existing.length === 0) {
    return apiError('Album not found', 'ALBUM_NOT_FOUND', 404);
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (body.title !== undefined) {
    if (!body.title || body.title.length > 200) {
      return apiError('Title must be 1-200 characters', 'INVALID_TITLE', 400);
    }
    updates.title = body.title.trim();
    updates.slug = generateSlug(body.title);
  }
  if (body.description !== undefined) updates.description = body.description;
  if (body.isPublic !== undefined) updates.isPublic = body.isPublic;
  if (body.isHero !== undefined) {
    if (body.isHero) {
      // Unset existing hero
      await db.update(albums).set({ isHero: false }).where(eq(albums.isHero, true));
    }
    updates.isHero = body.isHero;
  }

  await db.update(albums).set(updates).where(eq(albums.id, id));
  const updated = await db.select().from(albums).where(eq(albums.id, id));
  return apiSuccess({ album: updated[0] });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = await db.select().from(albums).where(eq(albums.id, id));
  if (existing.length === 0) {
    return apiError('Album not found', 'ALBUM_NOT_FOUND', 404);
  }

  // Get all photos to clean up storage
  const albumPhotos = await db.select().from(photos).where(eq(photos.albumId, id));

  // Delete storage objects
  const storage = getStorageProvider();
  for (const photo of albumPhotos) {
    try {
      const keys = await storage.list(`${photo.storageKey}/`);
      if (keys.length > 0) await storage.deleteMany(keys);
    } catch (error) {
      console.error(`Failed to delete storage for photo ${photo.id}:`, error);
    }
  }

  // Delete album (photos cascade)
  await db.delete(albums).where(eq(albums.id, id));

  return new Response(null, { status: 204 });
}

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { photos, albums } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/lib/api/response';
import { softDeletePhoto } from '@/lib/db/queries/photos';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Find the photo
  const photo = await db.select().from(photos).where(eq(photos.id, id)).get();
  if (!photo) {
    return apiError('Photo not found', 'PHOTO_NOT_FOUND', 404);
  }

  // If this is the album's cover photo, clear it
  const album = await db.select().from(albums).where(eq(albums.id, photo.albumId)).get();
  if (album && album.coverPhotoId === id) {
    await db.update(albums).set({ coverPhotoId: null, updatedAt: new Date() }).where(eq(albums.id, album.id));
  }

  // R2 cleanup now handled by trash system
  // const storage = getStorageProvider();
  // try {
  //   const keys = await storage.list(`${photo.storageKey}/`);
  //   if (keys.length > 0) {
  //     await storage.deleteMany(keys);
  //   }
  // } catch (error) {
  //   console.error('Failed to delete storage objects:', error);
  // }

  // Soft-delete the photo
  await softDeletePhoto(id);

  return new Response(null, { status: 204 });
}

// Also support PATCH for updating caption
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const photo = await db.select().from(photos).where(eq(photos.id, id)).get();
  if (!photo) {
    return apiError('Photo not found', 'PHOTO_NOT_FOUND', 404);
  }

  const updates: Record<string, unknown> = {};
  if (body.caption !== undefined) updates.caption = body.caption;

  if (Object.keys(updates).length === 0) {
    return apiError('No fields to update', 'NO_UPDATES', 400);
  }

  await db.update(photos).set(updates).where(eq(photos.id, id));

  const updated = await db.select().from(photos).where(eq(photos.id, id)).get();
  return apiSuccess({ photo: updated });
}

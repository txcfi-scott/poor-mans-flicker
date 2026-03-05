import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { photos, albums } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { getStorageProvider } from '@/lib/storage';
import { apiSuccess, apiError } from '@/lib/api/response';
import { MAX_BULK_DELETE } from '@/lib/constants';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { photoIds } = body;

  if (!Array.isArray(photoIds) || photoIds.length === 0) {
    return apiError('photoIds must be a non-empty array', 'INVALID_INPUT', 400);
  }

  if (photoIds.length > MAX_BULK_DELETE) {
    return apiError(`Maximum ${MAX_BULK_DELETE} photos per request`, 'TOO_MANY_PHOTOS', 400);
  }

  // Fetch all photos to get storage keys
  const photosToDelete = await db.select().from(photos).where(inArray(photos.id, photoIds));

  if (photosToDelete.length === 0) {
    return apiError('No photos found', 'PHOTOS_NOT_FOUND', 404);
  }

  // Clear cover photos that reference any of these photos
  const albumIds = [...new Set(photosToDelete.map((p: { albumId: string }) => p.albumId))];
  for (const albumId of albumIds) {
    const album = await db.select().from(albums).where(eq(albums.id, albumId)).get();
    if (album && album.coverPhotoId && (photoIds as string[]).includes(album.coverPhotoId)) {
      await db.update(albums).set({ coverPhotoId: null, updatedAt: new Date() }).where(eq(albums.id, albumId));
    }
  }

  // Delete from storage
  const storage = getStorageProvider();
  const allKeys: string[] = [];
  for (const photo of photosToDelete) {
    try {
      const keys = await storage.list(`${photo.storageKey}/`);
      allKeys.push(...keys);
    } catch (error) {
      console.error(`Failed to list storage for ${photo.id}:`, error);
    }
  }
  if (allKeys.length > 0) {
    try {
      await storage.deleteMany(allKeys);
    } catch (error) {
      console.error('Failed to delete storage objects:', error);
    }
  }

  // Delete database records
  await db.delete(photos).where(inArray(photos.id, photoIds));

  return apiSuccess({ deleted: photosToDelete.length });
}

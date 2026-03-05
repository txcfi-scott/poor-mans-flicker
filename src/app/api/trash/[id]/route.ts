import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { albums, photos } from '@/lib/db/schema';
import { eq, isNotNull, and } from 'drizzle-orm';
import { requireAuth } from '@/lib/api/auth';
import { apiError } from '@/lib/api/response';
import { getStorageProvider } from '@/lib/storage';
import { permanentlyDeletePhotos } from '@/lib/db/queries/photos';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const storage = getStorageProvider();

  // Check if it's a trashed album
  const album = await db
    .select()
    .from(albums)
    .where(and(eq(albums.id, id), isNotNull(albums.deletedAt)))
    .get();

  if (album) {
    // Get all photos in this album (including soft-deleted ones)
    const albumPhotos = await db
      .select()
      .from(photos)
      .where(eq(photos.albumId, id));

    // Delete all photo storage objects
    for (const photo of albumPhotos) {
      try {
        const keys = await storage.list(`${photo.storageKey}/`);
        if (keys.length > 0) await storage.deleteMany(keys);
      } catch (error) {
        console.error(`Failed to delete storage for photo ${photo.id}:`, error);
      }
    }

    // Permanently delete photos then the album
    if (albumPhotos.length > 0) {
      await permanentlyDeletePhotos(albumPhotos.map(p => p.id));
    }
    await db.delete(albums).where(eq(albums.id, id));

    return new Response(null, { status: 204 });
  }

  // Check if it's a trashed photo
  const photo = await db
    .select()
    .from(photos)
    .where(and(eq(photos.id, id), isNotNull(photos.deletedAt)))
    .get();

  if (photo) {
    // Delete storage objects
    try {
      const keys = await storage.list(`${photo.storageKey}/`);
      if (keys.length > 0) await storage.deleteMany(keys);
    } catch (error) {
      console.error(`Failed to delete storage for photo ${photo.id}:`, error);
    }

    // Permanently delete from database
    await permanentlyDeletePhotos([id]);

    return new Response(null, { status: 204 });
  }

  return apiError('Item not found in trash', 'NOT_FOUND', 404);
}

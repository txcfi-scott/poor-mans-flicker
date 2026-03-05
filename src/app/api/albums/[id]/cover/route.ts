import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { albums, photos } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/lib/api/response';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: albumId } = await params;
  const body = await request.json();
  const { photoId } = body;

  // Verify album exists
  const album = await db.select().from(albums).where(eq(albums.id, albumId));
  if (album.length === 0) {
    return apiError('Album not found', 'ALBUM_NOT_FOUND', 404);
  }

  // Verify photo exists and belongs to album
  const photo = await db.select().from(photos).where(eq(photos.id, photoId));
  if (photo.length === 0) {
    return apiError('Photo not found', 'PHOTO_NOT_FOUND', 404);
  }
  if (photo[0].albumId !== albumId) {
    return apiError('Photo does not belong to this album', 'PHOTO_NOT_IN_ALBUM', 400);
  }

  await db.update(albums).set({ coverPhotoId: photoId, updatedAt: new Date() }).where(eq(albums.id, albumId));

  const updated = await db.select().from(albums).where(eq(albums.id, albumId));
  return apiSuccess({ album: updated[0] });
}

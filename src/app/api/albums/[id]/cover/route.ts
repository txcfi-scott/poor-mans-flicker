import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { albums, photos } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/lib/api/response';
import { requireAuth } from '@/lib/api/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id: albumId } = await params;
  const body = await request.json();
  const { photoId } = body;

  // Verify album exists and is not soft-deleted
  const album = await db.select().from(albums).where(and(eq(albums.id, albumId), isNull(albums.deletedAt)));
  if (album.length === 0) {
    return apiError('Album not found', 'ALBUM_NOT_FOUND', 404);
  }

  // Verify photo exists, belongs to album, and is not soft-deleted
  const photo = await db.select().from(photos).where(and(eq(photos.id, photoId), isNull(photos.deletedAt)));
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

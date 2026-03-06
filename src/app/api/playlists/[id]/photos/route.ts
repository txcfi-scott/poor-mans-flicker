import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { photos } from '@/lib/db/schema';
import { inArray, isNull, and } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/lib/api/response';
import { requireAuth } from '@/lib/api/auth';
import { getPlaylist, addPhotosToPlaylist, removePhotosFromPlaylist } from '@/lib/db/queries/playlists';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();
  const { photoIds } = body;

  if (!Array.isArray(photoIds) || photoIds.length === 0) {
    return apiError('photoIds must be a non-empty array', 'INVALID_PHOTO_IDS', 400);
  }

  const playlist = await getPlaylist(id);
  if (!playlist) {
    return apiError('Playlist not found', 'PLAYLIST_NOT_FOUND', 404);
  }

  // Validate all photo IDs exist and are not deleted
  const existingPhotos = await db
    .select({ id: photos.id })
    .from(photos)
    .where(and(inArray(photos.id, photoIds), isNull(photos.deletedAt)));

  const existingIds = new Set(existingPhotos.map(p => p.id));
  const invalidIds = photoIds.filter((pid: string) => !existingIds.has(pid));
  if (invalidIds.length > 0) {
    return apiError(
      `Photos not found: ${invalidIds.join(', ')}`,
      'PHOTOS_NOT_FOUND',
      400,
      { invalidIds }
    );
  }

  await addPhotosToPlaylist(id, photoIds);
  return apiSuccess({ added: photoIds.length }, 201);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();
  const { photoIds } = body;

  if (!Array.isArray(photoIds) || photoIds.length === 0) {
    return apiError('photoIds must be a non-empty array', 'INVALID_PHOTO_IDS', 400);
  }

  const playlist = await getPlaylist(id);
  if (!playlist) {
    return apiError('Playlist not found', 'PLAYLIST_NOT_FOUND', 404);
  }

  await removePhotosFromPlaylist(id, photoIds);
  return apiSuccess({ removed: photoIds.length });
}

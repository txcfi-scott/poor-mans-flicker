import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { requireAuth } from '@/lib/api/auth';
import { getPlaylist, reorderPlaylistPhotos } from '@/lib/db/queries/playlists';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();
  const { order } = body;

  if (!Array.isArray(order) || order.length === 0) {
    return apiError('order must be a non-empty array of {id, sortOrder}', 'INVALID_ORDER', 400);
  }

  for (const item of order) {
    if (!item.id || typeof item.sortOrder !== 'number') {
      return apiError('Each order item must have id (string) and sortOrder (number)', 'INVALID_ORDER_ITEM', 400);
    }
  }

  const playlist = await getPlaylist(id);
  if (!playlist) {
    return apiError('Playlist not found', 'PLAYLIST_NOT_FOUND', 404);
  }

  await reorderPlaylistPhotos(id, order);
  return apiSuccess({ reordered: order.length });
}

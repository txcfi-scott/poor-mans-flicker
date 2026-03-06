import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { getPlaylist, getPlaylistPhotosForPlayback } from '@/lib/db/queries/playlists';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const playlist = await getPlaylist(id);
  if (!playlist) {
    return apiError('Playlist not found', 'PLAYLIST_NOT_FOUND', 404);
  }

  if (!playlist.isPublic) {
    return apiError('Playlist not found', 'PLAYLIST_NOT_FOUND', 404);
  }

  const photos = await getPlaylistPhotosForPlayback(id);
  return apiSuccess({ playlist: { id: playlist.id, title: playlist.title, slug: playlist.slug }, photos });
}

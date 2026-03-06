import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { playlists } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateSlug } from '@/lib/utils/slug';
import { apiSuccess, apiError } from '@/lib/api/response';
import { requireAuth } from '@/lib/api/auth';
import { getPlaylist, getPlaylistWithPhotos, updatePlaylist, deletePlaylist } from '@/lib/db/queries/playlists';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await getPlaylistWithPhotos(id);
  if (!result) {
    return apiError('Playlist not found', 'PLAYLIST_NOT_FOUND', 404);
  }

  return apiSuccess({ playlist: result.playlist, photos: result.photos });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();

  const existing = await getPlaylist(id);
  if (!existing) {
    return apiError('Playlist not found', 'PLAYLIST_NOT_FOUND', 404);
  }

  const updates: Partial<{ title: string; slug: string; description: string | null; isPublic: boolean }> = {};

  if (body.title !== undefined) {
    if (!body.title || typeof body.title !== 'string' || body.title.length > 200) {
      return apiError('Title must be 1-200 characters', 'INVALID_TITLE', 400);
    }
    updates.title = body.title.trim();

    // Generate unique slug with collision check
    let slug = generateSlug(body.title);
    let suffix = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const conflict = await db
        .select({ id: playlists.id })
        .from(playlists)
        .where(eq(playlists.slug, slug));
      if (conflict.length === 0 || (conflict.length === 1 && conflict[0].id === id)) {
        break;
      }
      suffix++;
      slug = `${generateSlug(body.title)}-${suffix}`;
    }
    updates.slug = slug;
  }

  if (body.description !== undefined) updates.description = body.description;
  if (body.isPublic !== undefined) updates.isPublic = body.isPublic;

  const updated = await updatePlaylist(id, updates);
  return apiSuccess({ playlist: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  const existing = await getPlaylist(id);
  if (!existing) {
    return apiError('Playlist not found', 'PLAYLIST_NOT_FOUND', 404);
  }

  await deletePlaylist(id);
  return new Response(null, { status: 204 });
}

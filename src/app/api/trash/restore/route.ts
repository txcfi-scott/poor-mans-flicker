import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { apiSuccess, apiError } from '@/lib/api/response';
import { restoreAlbum } from '@/lib/db/queries/albums';
import { restorePhoto } from '@/lib/db/queries/photos';

export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const body = await request.json();
  const { type, id } = body;

  if (!type || !id) {
    return apiError('type and id are required', 'INVALID_INPUT', 400);
  }

  if (type !== 'album' && type !== 'photo') {
    return apiError('type must be "album" or "photo"', 'INVALID_TYPE', 400);
  }

  if (typeof id !== 'string') {
    return apiError('id must be a string', 'INVALID_ID', 400);
  }

  if (type === 'album') {
    await restoreAlbum(id);
    return apiSuccess({ type: 'album', id });
  }

  await restorePhoto(id);
  return apiSuccess({ type: 'photo', id });
}

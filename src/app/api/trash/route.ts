import { requireAuth } from '@/lib/api/auth';
import { apiSuccess } from '@/lib/api/response';
import { getDeletedAlbums } from '@/lib/db/queries/albums';
import { getDeletedPhotos } from '@/lib/db/queries/photos';

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  const [albums, photos] = await Promise.all([
    getDeletedAlbums(),
    getDeletedPhotos(),
  ]);

  return apiSuccess({ albums, photos });
}

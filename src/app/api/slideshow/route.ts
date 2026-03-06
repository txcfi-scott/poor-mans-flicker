import { NextRequest } from 'next/server';
import { getPhotosByAlbum } from '@/lib/db/queries/photos';
import { getPhotoUrls } from '@/lib/utils/url';
import { apiSuccess, apiError } from '@/lib/api/response';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const albumId = searchParams.get('albumId');

  if (!albumId) {
    return apiError('albumId query parameter is required', 'MISSING_ALBUM_ID', 400);
  }

  const albumPhotos = await getPhotosByAlbum(albumId);

  const photosWithUrls = albumPhotos.map((photo) => ({
    id: photo.id,
    albumId: photo.albumId,
    caption: photo.caption,
    width: photo.width,
    height: photo.height,
    blurhash: photo.blurhash,
    urls: getPhotoUrls(photo.storageKey),
  }));

  return apiSuccess(photosWithUrls);
}

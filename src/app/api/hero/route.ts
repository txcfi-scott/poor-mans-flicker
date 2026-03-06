import { getHeroAlbums } from '@/lib/db/queries/albums';
import { getPhotoUrls } from '@/lib/utils/url';
import { apiSuccess } from '@/lib/api/response';

export async function GET() {
  const heroPhotos = await getHeroAlbums();

  const photosWithUrls = heroPhotos.map((photo) => ({
    id: photo.id,
    albumId: photo.albumId,
    albumTitle: photo.albumTitle,
    albumSlug: photo.albumSlug,
    caption: photo.caption,
    width: photo.width,
    height: photo.height,
    blurhash: photo.blurhash,
    urls: getPhotoUrls(photo.storageKey),
  }));

  return apiSuccess(photosWithUrls);
}

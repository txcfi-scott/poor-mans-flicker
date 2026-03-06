import { getAlbum } from '@/lib/db/queries/albums';
import { notFound } from 'next/navigation';
import { AlbumDetail } from '@/components/admin/AlbumDetail';
import { getPhotoUrls } from '@/lib/utils/url';

export const dynamic = 'force-dynamic';

export default async function EditAlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getAlbum(id);
  if (!result) notFound();

  // Resolve R2 URLs server-side (env vars not available client-side)
  const photosWithUrls = result.photos.map((photo) => {
    const urls = getPhotoUrls(photo.storageKey);
    return {
      ...photo,
      thumbUrl: urls.thumb,
      displayUrl: urls.display,
    };
  });

  return <AlbumDetail album={result.album} photos={photosWithUrls} />;
}

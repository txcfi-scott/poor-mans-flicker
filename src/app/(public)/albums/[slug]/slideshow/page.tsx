import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAlbumBySlug } from '@/lib/db/queries/albums';
import { getSiteConfig } from '@/lib/db/queries/config';
import { getPhotoUrls } from '@/lib/utils/url';
import { SlideshowPlayer } from '@/components/gallery/slideshow';

export const metadata: Metadata = {
  robots: { index: false },
};

export default async function SlideshowPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getAlbumBySlug(slug);

  if (!result || !result.album.isPublic) {
    notFound();
  }

  const { album, photos } = result;

  if (photos.length === 0) {
    notFound();
  }

  const config = await getSiteConfig();
  const defaultIntervalMs = config?.slideshowDefaultIntervalMs ?? 4000;

  const photoData = photos.map((photo) => {
    const urls = getPhotoUrls(photo.storageKey);
    return {
      id: photo.id,
      fullUrl: urls.full,
      displayUrl: urls.display,
      width: photo.width,
      height: photo.height,
      blurhash: photo.blurhash,
      caption: photo.caption,
    };
  });

  return (
    <SlideshowPlayer
      photos={photoData}
      defaultIntervalMs={defaultIntervalMs}
      albumSlug={album.slug}
    />
  );
}

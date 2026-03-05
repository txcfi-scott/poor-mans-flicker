import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAlbumBySlug } from '@/lib/db/queries/albums';
import { getPhotoUrls } from '@/lib/utils/url';
import { AlbumGallery } from './album-gallery';

export default async function AlbumDetailPage({
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

  // Build photo data with URLs for the client component
  const photoData = photos.map((photo) => {
    const urls = getPhotoUrls(photo.storageKey);
    return {
      id: photo.id,
      width: photo.width,
      height: photo.height,
      blurhash: photo.blurhash,
      caption: photo.caption,
      thumbUrl: urls.thumb,
      displayUrl: urls.display,
    };
  });

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
      {/* Back link */}
      <Link
        href="/albums"
        className="mb-4 inline-flex items-center gap-1 text-sm text-[#9E9EA8] transition-colors hover:text-[#F0F0F2]"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 12L6 8l4-4" />
        </svg>
        Albums
      </Link>

      {/* Album header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#F0F0F2]">{album.title}</h1>

        {album.description && (
          <p className="mt-2 line-clamp-2 text-base text-[#9E9EA8]">
            {album.description}
          </p>
        )}

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#636370]">
            {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
          </p>

          {photos.length > 0 && (
            <Link
              href={`/albums/${slug}/slideshow`}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[#6B8AFF] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#8BA3FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6B8AFF]"
            >
              Start Slideshow
            </Link>
          )}
        </div>
      </div>

      {/* Photo grid + lightbox */}
      {photos.length > 0 ? (
        <AlbumGallery photos={photoData} />
      ) : (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-[#2A2A30] bg-[#141416]">
          <p className="text-[#636370]">No photos in this album yet.</p>
        </div>
      )}
    </main>
  );
}

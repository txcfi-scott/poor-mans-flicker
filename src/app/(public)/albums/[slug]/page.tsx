export const dynamic = 'force-dynamic';

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
    <div className="mx-auto w-full max-w-7xl px-6 py-8 md:px-8 page-enter">
      {/* Back link */}
      <Link
        href="/albums"
        className="mb-6 inline-flex items-center gap-1 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <path d="M10 12L6 8l4-4" />
        </svg>
        Albums
      </Link>

      {/* Album header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-light tracking-tight text-foreground">{album.title}</h1>

        {album.description && (
          <p className="mt-3 text-base leading-relaxed text-[var(--text-secondary)]">
            {album.description}
          </p>
        )}

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
          </p>

          {photos.length > 0 && (
            <Link
              href={`/albums/${slug}/slideshow`}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-white transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-border bg-surface">
          <p className="text-muted-foreground">No photos in this album yet.</p>
        </div>
      )}
    </div>
  );
}

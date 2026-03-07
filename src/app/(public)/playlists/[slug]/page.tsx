import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPlaylistBySlug, getPlaylistWithPhotos } from '@/lib/db/queries/playlists';
import { PlaylistGallery } from './playlist-gallery';

export default async function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const playlistMeta = await getPlaylistBySlug(slug);

  if (!playlistMeta || !playlistMeta.isPublic) {
    notFound();
  }

  const result = await getPlaylistWithPhotos(playlistMeta.id);
  if (!result) {
    notFound();
  }

  const { playlist, photos } = result;

  const photoData = photos.map((photo) => ({
    id: photo.id,
    width: photo.width,
    height: photo.height,
    blurhash: photo.blurhash,
    caption: photo.caption,
    thumbUrl: photo.urls.thumb,
    displayUrl: photo.urls.display,
  }));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 page-enter">
      {/* Back link */}
      <Link
        href="/playlists"
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
        Playlists
      </Link>

      {/* Playlist header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-light tracking-tight text-foreground">{playlist.title}</h1>

        {playlist.description && (
          <p className="mt-2 line-clamp-2 text-base text-muted">
            {playlist.description}
          </p>
        )}

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
          </p>

          {photos.length > 0 && (
            <Link
              href={`/playlists/${slug}/slideshow`}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-white transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Start Slideshow
            </Link>
          )}
        </div>
      </div>

      {/* Photo grid + lightbox */}
      {photos.length > 0 ? (
        <PlaylistGallery photos={photoData} />
      ) : (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-border bg-surface">
          <p className="text-muted-foreground">No photos in this playlist yet.</p>
        </div>
      )}
    </div>
  );
}

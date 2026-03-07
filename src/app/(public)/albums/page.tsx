export const dynamic = 'force-dynamic';

import { getAlbums } from '@/lib/db/queries/albums';
import { AlbumCard } from '@/components/gallery/album-card';

export const metadata = {
  title: 'Albums',
};

export default async function AlbumsPage() {
  const albums = await getAlbums(false);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:px-8 page-enter">
      <h1 className="mb-2 text-3xl md:text-4xl font-light tracking-tight text-foreground">
        Albums
      </h1>
      <p className="mb-8 text-base text-[var(--text-secondary)]">
        Browse collections of photos organized by theme, location, and moment.
      </p>

      {albums.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-4 text-muted-foreground"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
          <p className="text-lg text-muted">No albums yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {albums.map((album) => (
            <AlbumCard
              key={album.id}
              slug={album.slug}
              title={album.title}
              description={album.description}
              photoCount={album.photoCount}
              coverPhotoUrl={album.coverPhotoUrl}
              coverPhotoBlurhash={album.coverPhotoBlurhash}
            />
          ))}
        </div>
      )}
    </div>
  );
}

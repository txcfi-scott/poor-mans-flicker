import Link from 'next/link';
import { getPlaylists } from '@/lib/db/queries/playlists';

export const metadata = {
  title: 'Playlists',
};

export default async function PlaylistsPage() {
  const playlists = await getPlaylists(false);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 page-enter">
      <h1 className="mb-8 text-3xl md:text-4xl font-light tracking-tight text-foreground">
        Playlists
      </h1>

      {playlists.length === 0 ? (
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
            <path d="M8 7h8" />
            <path d="M8 11h8" />
            <path d="M8 15h4" />
          </svg>
          <p className="text-lg text-muted">No playlists yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {playlists.map((playlist) => (
            <Link
              key={playlist.id}
              href={`/playlists/${playlist.slug}`}
              className="group rounded-xl border border-border bg-surface-secondary p-6 transition-all hover:border-border-hover hover:bg-surface-hover"
            >
              <h2 className="text-lg font-medium text-foreground group-hover:text-accent transition-colors">
                {playlist.title}
              </h2>
              {playlist.description && (
                <p className="mt-2 line-clamp-2 text-sm text-muted">
                  {playlist.description}
                </p>
              )}
              <p className="mt-3 text-sm text-muted-foreground">
                {playlist.photoCount} {playlist.photoCount === 1 ? 'photo' : 'photos'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

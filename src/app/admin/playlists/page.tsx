import Link from 'next/link';
import { getPlaylists } from '@/lib/db/queries/playlists';

export const dynamic = 'force-dynamic';

export default async function AdminPlaylistsPage() {
  const playlists = await getPlaylists(true);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-heading font-bold">Playlists</h1>
        <Link
          href="/admin/playlists/new"
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors"
        >
          New Playlist
        </Link>
      </div>

      {playlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-4 opacity-50"
          >
            <path d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V4.125A2.25 2.25 0 0 0 17.25 2.25H15M9 9v10.5a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.803V9Z" />
          </svg>
          <p className="text-sm mb-4">No playlists yet</p>
          <Link
            href="/admin/playlists/new"
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors text-sm"
          >
            Create your first playlist
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {playlists.map((playlist) => (
            <Link
              key={playlist.id}
              href={`/admin/playlists/${playlist.id}`}
              className="block bg-surface hover:bg-surface-hover border border-border rounded-lg p-5 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-foreground font-semibold text-lg truncate">
                      {playlist.title}
                    </h2>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${
                        playlist.isPublic
                          ? 'bg-[#4ADE801A] text-[#4ADE80]'
                          : 'bg-[#FACC151A] text-[#FACC15]'
                      }`}
                    >
                      {playlist.isPublic ? 'Public' : 'Private'}
                    </span>
                  </div>
                  {playlist.description && (
                    <p className="text-muted text-sm line-clamp-2 mb-2">
                      {playlist.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{playlist.photoCount} photo{playlist.photoCount !== 1 ? 's' : ''}</span>
                    {playlist.createdAt && (
                      <span>
                        Created {new Date(playlist.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <svg
                  className="w-5 h-5 text-muted shrink-0 mt-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

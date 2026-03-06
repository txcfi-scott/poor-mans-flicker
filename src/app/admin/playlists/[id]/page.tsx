import { notFound } from 'next/navigation';
import { getPlaylistWithPhotos } from '@/lib/db/queries/playlists';
import { getStorageProvider } from '@/lib/storage';
import { PlaylistEditForm } from '@/components/admin/PlaylistEditForm';
import { PlaylistPhotoPicker } from '@/components/admin/PlaylistPhotoPicker';

export const dynamic = 'force-dynamic';

export default async function EditPlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getPlaylistWithPhotos(id);
  if (!result) notFound();

  // Resolve the storage base URL server-side so the client picker can construct thumb URLs
  const storage = getStorageProvider();
  const storageBaseUrl = storage.getUrl('').replace(/\/$/, '');

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-heading font-bold mb-6">{result.playlist.title}</h1>

      <PlaylistEditForm playlist={result.playlist} />

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground mb-2">Photos</h2>
        <p className="text-sm text-muted mb-4">
          Browse albums to add photos, then drag to reorder the playlist sequence.
        </p>
        <PlaylistPhotoPicker
          playlistId={result.playlist.id}
          initialPhotos={result.photos}
          storageBaseUrl={storageBaseUrl}
        />
      </div>
    </div>
  );
}

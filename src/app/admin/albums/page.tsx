import { getAlbums } from '@/lib/db/queries/albums';
import { AlbumList } from '@/components/admin/AlbumList';

export const dynamic = 'force-dynamic';

export default async function AdminAlbumsPage() {
  const albums = await getAlbums(true); // include private

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-heading font-bold">Albums</h1>
        <a
          href="/admin/albums/new"
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors"
        >
          New Album
        </a>
      </div>
      <AlbumList initialAlbums={albums} />
    </div>
  );
}

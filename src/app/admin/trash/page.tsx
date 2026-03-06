import { getDeletedAlbums } from '@/lib/db/queries/albums';
import { getDeletedPhotos } from '@/lib/db/queries/photos';
import { getPhotoUrl } from '@/lib/utils/url';
import { TrashManager } from '@/components/admin/TrashManager';

export const dynamic = 'force-dynamic';

export default async function AdminTrashPage() {
  const [deletedAlbums, deletedPhotos] = await Promise.all([
    getDeletedAlbums(),
    getDeletedPhotos(),
  ]);

  const albums = deletedAlbums.map((album) => ({
    id: album.id,
    type: 'album' as const,
    title: album.title,
    deletedAt: typeof album.deletedAt === 'number' ? album.deletedAt : null,
  }));

  const photos = deletedPhotos.map((photo) => ({
    id: photo.id,
    type: 'photo' as const,
    title: photo.originalFilename,
    caption: photo.caption,
    albumId: photo.albumId,
    thumbUrl: getPhotoUrl(photo.storageKey, 'thumb'),
    blurhash: photo.blurhash,
    width: photo.width,
    height: photo.height,
    deletedAt: typeof photo.deletedAt === 'number' ? photo.deletedAt : null,
    deletedBy: photo.deletedBy,
  }));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold">Trash</h1>
        <p className="text-secondary mt-1">
          Items are permanently deleted after 30 days.
        </p>
      </div>
      <TrashManager initialAlbums={albums} initialPhotos={photos} />
    </div>
  );
}

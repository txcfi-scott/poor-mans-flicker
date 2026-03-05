import { getAlbum } from '@/lib/db/queries/albums';
import { AlbumForm } from '@/components/admin/AlbumForm';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditAlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getAlbum(id);
  if (!result) notFound();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-heading font-bold mb-8">Edit Album</h1>
      <AlbumForm album={result.album} />
    </div>
  );
}

import { AlbumForm } from '@/components/admin/AlbumForm';

export default function NewAlbumPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-heading font-bold mb-8">Create Album</h1>
      <AlbumForm />
    </div>
  );
}

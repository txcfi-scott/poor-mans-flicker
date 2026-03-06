import { Skeleton } from '@/components/ui/skeleton';

export default function AdminAlbumDetailLoading() {
  return (
    <div>
      {/* Back link + title */}
      <Skeleton className="mb-4 h-4 w-20" />
      <Skeleton className="mb-8 h-8 w-56" />

      {/* Upload area */}
      <Skeleton className="mb-8 h-32 w-full rounded-lg" />

      {/* Photo grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

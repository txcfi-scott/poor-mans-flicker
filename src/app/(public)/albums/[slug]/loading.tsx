import { Skeleton } from '@/components/ui/skeleton';

export default function AlbumDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {/* Back link */}
      <Skeleton className="mb-6 h-4 w-24" />

      {/* Title */}
      <Skeleton className="mb-3 h-10 w-64" />

      {/* Description */}
      <Skeleton className="mb-8 h-4 w-96 max-w-full" />

      {/* Photo grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className={`w-full rounded-lg ${
              i % 3 === 0 ? 'aspect-[3/4]' : i % 3 === 1 ? 'aspect-[4/3]' : 'aspect-square'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

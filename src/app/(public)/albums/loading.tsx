import { Skeleton } from '@/components/ui/skeleton';

export default function AlbumsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:px-8">
      <Skeleton className="mb-8 h-10 w-48" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-lg">
            <Skeleton className="aspect-[3/2] w-full rounded-b-none" />
            <div className="bg-[#141416] p-4">
              <Skeleton className="mb-2 h-5 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

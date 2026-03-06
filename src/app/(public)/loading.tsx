import { Skeleton } from '@/components/ui/skeleton';

export default function HomeLoading() {
  return (
    <div>
      {/* Hero placeholder */}
      <div className="relative h-screen w-full">
        <Skeleton className="h-full w-full rounded-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent" />
      </div>

      {/* Featured albums section */}
      <div className="mx-auto max-w-7xl px-4 py-16">
        <Skeleton className="mb-8 h-8 w-48" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg">
              <Skeleton className="aspect-[3/2] w-full rounded-b-none" />
              <div className="bg-[#141416] p-4">
                <Skeleton className="mb-2 h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

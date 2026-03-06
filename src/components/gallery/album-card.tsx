import Link from 'next/link';
import { BlurHashImage } from '@/components/gallery/blurhash-image';

interface AlbumCardProps {
  slug: string;
  title: string;
  description: string | null;
  photoCount: number;
  coverPhotoUrl: string | null;
  coverPhotoBlurhash: string | null;
}

export function AlbumCard({
  slug,
  title,
  description,
  photoCount,
  coverPhotoUrl,
  coverPhotoBlurhash,
}: AlbumCardProps) {
  const truncatedDescription =
    description && description.length > 120
      ? description.slice(0, 120).trimEnd() + '...'
      : description;

  return (
    <Link
      href={`/albums/${slug}`}
      className="group block overflow-hidden rounded-xl bg-surface shadow-lg shadow-black/20"
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-surface-hover">
        {coverPhotoUrl && coverPhotoBlurhash ? (
          <BlurHashImage
            src={coverPhotoUrl}
            blurhash={coverPhotoBlurhash}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-all duration-500 group-hover:scale-[1.03] group-hover:brightness-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-base font-semibold text-foreground group-hover:underline underline-offset-4 decoration-white/30">
          {title}
        </h3>
        {truncatedDescription && (
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {truncatedDescription}
          </p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
        </p>
      </div>
    </Link>
  );
}

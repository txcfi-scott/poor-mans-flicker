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
      className="group block overflow-hidden rounded-lg border border-[#2A2A30] bg-[#141416] transition-colors hover:border-[#3E3E48]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#1E1E22]">
        {coverPhotoUrl && coverPhotoBlurhash ? (
          <BlurHashImage
            src={coverPhotoUrl}
            blurhash={coverPhotoBlurhash}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[#636370]">
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
        <div className="absolute right-2 top-2 rounded-full bg-[#0A0A0B]/70 px-2.5 py-1 text-xs font-medium text-[#F0F0F2] backdrop-blur-sm">
          {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-base font-semibold text-[#F0F0F2] transition-colors group-hover:text-[#6B8AFF]">
          {title}
        </h3>
        {truncatedDescription && (
          <p className="mt-1 text-sm leading-relaxed text-[#9E9EA8]">
            {truncatedDescription}
          </p>
        )}
      </div>
    </Link>
  );
}

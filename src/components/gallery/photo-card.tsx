'use client';

import { BlurhashImage } from '@/components/gallery/blurhash-image';

interface PhotoCardProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  blurhash: string;
  caption?: string | null;
  index: number;
  onPhotoClick: (index: number) => void;
  style: React.CSSProperties;
}

export function PhotoCard({
  src,
  alt,
  width,
  height,
  blurhash,
  caption,
  index,
  onPhotoClick,
  style,
}: PhotoCardProps) {
  return (
    <button
      type="button"
      onClick={() => onPhotoClick(index)}
      className="group relative block flex-shrink-0 cursor-pointer overflow-hidden rounded-md border border-[#2A2A30] transition-all duration-200 hover:border-[#3E3E48] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6B8AFF]"
      style={style}
      aria-label={caption || `Photo ${index + 1}`}
    >
      <BlurhashImage
        blurhash={blurhash}
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="h-full w-full"
      />

      {/* Caption overlay on hover */}
      {caption && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-[#0A0A0BCC] to-transparent px-3 py-2 transition-transform duration-200 group-hover:translate-y-0">
          <p className="truncate text-sm text-[#F0F0F2]">{caption}</p>
        </div>
      )}
    </button>
  );
}

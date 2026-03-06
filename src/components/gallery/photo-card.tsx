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
      className="group relative block flex-shrink-0 cursor-pointer overflow-hidden rounded-sm transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      style={{ ...style, minWidth: 0 }}
      aria-label={caption || `Photo ${index + 1}`}
    >
      <BlurhashImage
        blurhash={blurhash}
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="h-full w-full object-cover"
      />

      {/* Caption overlay — persistent gradient, text fades in on hover */}
      {caption && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent">
          <p className="absolute bottom-0 left-0 right-0 truncate px-3 py-2 text-sm text-foreground opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {caption}
          </p>
        </div>
      )}
    </button>
  );
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BlurHashImage } from '@/components/gallery/blurhash-image';

export interface HeroPhoto {
  displayUrl: string;
  blurhash: string;
  width: number;
  height: number;
  albumTitle?: string;
  albumSlug?: string;
}

interface HeroCarouselProps {
  photos: HeroPhoto[];
  intervalMs: number;
}

export function HeroCarousel({ photos, intervalMs }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = useCallback(() => {
    if (photos.length <= 1) return;
    const next = (currentIndex + 1) % photos.length;
    setNextIndex(next);
    // Start crossfade after a frame so the next image is in the DOM
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransitioning(true);
      });
    });
  }, [currentIndex, photos.length]);

  // Handle transition end
  useEffect(() => {
    if (!transitioning) return;
    const timeout = setTimeout(() => {
      setCurrentIndex(nextIndex!);
      setNextIndex(null);
      setTransitioning(false);
    }, 1500); // matches crossfade duration
    return () => clearTimeout(timeout);
  }, [transitioning, nextIndex]);

  // Auto-advance timer
  useEffect(() => {
    if (photos.length <= 1) return;
    if (transitioning) return;
    timerRef.current = setTimeout(advance, intervalMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [advance, intervalMs, photos.length, transitioning]);

  // Preload next image
  useEffect(() => {
    if (photos.length <= 1) return;
    const nextIdx = (currentIndex + 1) % photos.length;
    const img = new Image();
    img.src = photos[nextIdx].displayUrl;
  }, [currentIndex, photos]);

  // Empty state
  if (photos.length === 0) {
    return (
      <div className="relative h-screen w-full" style={{ backgroundColor: '#0A0A0B' }} />
    );
  }

  const currentPhoto = photos[currentIndex];
  const nextPhoto = nextIndex !== null ? photos[nextIndex] : null;

  return (
    <div className="relative h-screen w-full overflow-hidden" style={{ backgroundColor: '#0A0A0B' }}>
      {/* Current image */}
      <div className="absolute inset-0">
        <BlurHashImage
          src={currentPhoto.displayUrl}
          blurhash={currentPhoto.blurhash}
          width={currentPhoto.width}
          height={currentPhoto.height}
          alt={currentPhoto.albumTitle ?? 'Hero photo'}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Next image (crossfade) */}
      {nextPhoto && (
        <div
          className="absolute inset-0"
          style={{
            opacity: transitioning ? 1 : 0,
            transition: 'opacity 1500ms ease-in-out',
          }}
        >
          <BlurHashImage
            src={nextPhoto.displayUrl}
            blurhash={nextPhoto.blurhash}
            width={nextPhoto.width}
            height={nextPhoto.height}
            alt={nextPhoto.albumTitle ?? 'Hero photo'}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Gradient overlay for text readability */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)',
        }}
      />

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
        <svg
          className="h-6 w-6 text-white/60"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

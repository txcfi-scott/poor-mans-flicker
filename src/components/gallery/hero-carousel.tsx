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
  siteTitle?: string;
  siteDescription?: string;
}

export function HeroCarousel({ photos, intervalMs, siteTitle, siteDescription }: HeroCarouselProps) {
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
      <div className="relative h-screen w-full bg-background" />
    );
  }

  const currentPhoto = photos[currentIndex];
  const nextPhoto = nextIndex !== null ? photos[nextIndex] : null;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      {/* Current image with Ken Burns */}
      <div
        className="absolute inset-0"
        style={{ animation: `kenBurns ${intervalMs + 1500}ms ease-out forwards` }}
        key={`hero-${currentIndex}`}
      >
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

      {/* Cinematic gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.3) 100%)',
        }}
      />

      {/* Hero text overlay — centered */}
      {(siteTitle || siteDescription) && (
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div>
            {siteTitle && (
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-white">
                {siteTitle}
              </h1>
            )}
            {siteDescription && (
              <p className="mt-4 text-lg md:text-xl font-normal text-white/70">
                {siteDescription}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2" style={{ animation: 'float 3s ease-in-out infinite' }}>
        <svg
          className="h-5 w-5 text-white/40"
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

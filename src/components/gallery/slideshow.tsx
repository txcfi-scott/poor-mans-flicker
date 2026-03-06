'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSlideshow } from '@/hooks/use-slideshow';
import { BlurHashImage } from '@/components/gallery/blurhash-image';
import { KenBurnsLayer } from '@/components/gallery/ken-burns-layer';
import { SlideshowControls } from '@/components/gallery/slideshow-controls';

export interface SlideshowPhoto {
  id: string;
  fullUrl: string;
  displayUrl: string;
  width: number;
  height: number;
  blurhash: string;
  caption: string | null;
}

interface SlideshowPlayerProps {
  photos: SlideshowPhoto[];
  defaultIntervalMs: number;
  albumSlug: string;
}

export function SlideshowPlayer({
  photos,
  defaultIntervalMs,
  albumSlug,
}: SlideshowPlayerProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const lastIndexRef = useRef(0);

  const slideshow = useSlideshow({
    totalPhotos: photos.length,
    defaultIntervalMs,
  });

  const {
    currentIndex,
    isPlaying,
    intervalMs,
    kenBurnsEnabled,
    toggle,
    next,
    prev,
    setIntervalMs,
    toggleKenBurns,
    enterFullscreen,
  } = slideshow;

  // Crossfade logic: when currentIndex changes, set previous and start transition
  useEffect(() => {
    if (lastIndexRef.current !== currentIndex) {
      setPrevIndex(lastIndexRef.current);
      setTransitioning(true);

      const timeout = setTimeout(() => {
        setPrevIndex(null);
        setTransitioning(false);
      }, 1000); // crossfade duration

      lastIndexRef.current = currentIndex;
      return () => clearTimeout(timeout);
    }
  }, [currentIndex]);

  // Preload next 2 images
  useEffect(() => {
    for (let offset = 1; offset <= 2; offset++) {
      const idx = (currentIndex + offset) % photos.length;
      const img = new window.Image();
      img.src = photos[idx].fullUrl;
    }
  }, [currentIndex, photos]);

  // Try fullscreen on mount
  useEffect(() => {
    enterFullscreen();
  }, [enterFullscreen]);

  // Exit handler
  const handleExit = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    router.push(`/albums/${albumSlug}`);
  }, [router, albumSlug]);

  // Keyboard handlers
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          toggle();
          break;
        case 'ArrowLeft':
          prev();
          break;
        case 'ArrowRight':
          next();
          break;
        case 'Escape':
          handleExit();
          break;
        case 'f':
        case 'F':
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          } else {
            document.documentElement.requestFullscreen?.().catch(() => {});
          }
          break;
        case 'k':
        case 'K':
          toggleKenBurns();
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle, next, prev, handleExit, toggleKenBurns]);

  // Touch handlers
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const dt = Date.now() - touchStartRef.current.time;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Swipe detection (min 50px, max 500ms)
      if (dt < 500 && (absDx > 50 || absDy > 50)) {
        if (absDx > absDy) {
          // Horizontal swipe
          if (dx < 0) next();
          else prev();
        } else if (dy < -50) {
          // Swipe up — exit
          handleExit();
        }
        touchStartRef.current = null;
        return;
      }

      // Tap detection (minimal movement, quick)
      if (absDx < 10 && absDy < 10 && dt < 300) {
        const screenWidth = window.innerWidth;
        const x = touch.clientX;
        if (x < screenWidth / 3) {
          prev();
        } else if (x > (screenWidth * 2) / 3) {
          next();
        } else {
          toggle();
        }
      }

      touchStartRef.current = null;
    },
    [next, prev, toggle, handleExit]
  );

  if (photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];
  const prevPhoto = prevIndex !== null ? photos[prevIndex] : null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 select-none"
      style={{ backgroundColor: '#000000' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Previous image layer (fading out) */}
      {prevPhoto && transitioning && (
        <div
          className="absolute inset-0"
          style={{
            opacity: 0,
            transition: 'opacity 1000ms ease-in-out',
            zIndex: 1,
          }}
        >
          <BlurHashImage
            src={prevPhoto.fullUrl}
            blurhash={prevPhoto.blurhash}
            width={prevPhoto.width}
            height={prevPhoto.height}
            alt={prevPhoto.caption ?? ''}
            fill
            className="h-full w-full object-contain"
          />
        </div>
      )}

      {/* Current image layer */}
      <div
        className="absolute inset-0"
        style={{
          opacity: transitioning ? 1 : 1,
          transition: 'opacity 1000ms ease-in-out',
          zIndex: 2,
        }}
      >
        <KenBurnsLayer
          enabled={kenBurnsEnabled}
          photoKey={currentPhoto.id}
          durationMs={intervalMs}
        >
          <BlurHashImage
            src={currentPhoto.fullUrl}
            blurhash={currentPhoto.blurhash}
            width={currentPhoto.width}
            height={currentPhoto.height}
            alt={currentPhoto.caption ?? ''}
            fill
            className="h-full w-full object-contain"
          />
        </KenBurnsLayer>
      </div>

      {/* Caption overlay */}
      {currentPhoto.caption && (
        <div
          className="absolute inset-x-0 bottom-16 z-10 flex justify-center px-4"
          style={{ pointerEvents: 'none' }}
        >
          <p
            className="max-w-xl rounded-lg px-4 py-2 text-center text-sm text-[#F0F0F2]"
            style={{
              backgroundColor: 'rgba(10, 10, 11, 0.7)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            {currentPhoto.caption}
          </p>
        </div>
      )}

      {/* Controls */}
      <SlideshowControls
        isPlaying={isPlaying}
        currentIndex={currentIndex}
        totalPhotos={photos.length}
        intervalMs={intervalMs}
        kenBurnsEnabled={kenBurnsEnabled}
        onTogglePlay={toggle}
        onPrev={prev}
        onNext={next}
        onSetInterval={setIntervalMs}
        onToggleKenBurns={toggleKenBurns}
        onExit={handleExit}
      />
    </div>
  );
}

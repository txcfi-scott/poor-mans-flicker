'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { LightboxPhoto } from '@/hooks/use-lightbox';

interface LightboxProps {
  isOpen: boolean;
  photos: LightboxPhoto[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export function Lightbox({
  isOpen,
  photos,
  currentIndex,
  onClose,
  onNext,
  onPrev,
}: LightboxProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Touch swipe state
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);

  // Fade-in animation
  useEffect(() => {
    if (isOpen) {
      // Trigger entrance animation on next frame
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // Reset loaded state on index change
  useEffect(() => {
    setImageLoaded(false);
  }, [currentIndex]);

  // Preload adjacent images
  useEffect(() => {
    if (!isOpen) return;

    const preload = (index: number) => {
      if (index >= 0 && index < photos.length) {
        const img = new Image();
        img.src = photos[index].src;
      }
    };

    preload(currentIndex - 1);
    preload(currentIndex + 1);
  }, [isOpen, currentIndex, photos]);

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  // Touch swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = true;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isSwiping.current) return;
      isSwiping.current = false;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;

      // Only count horizontal swipes (ignore vertical scrolls)
      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < 0) {
          onNext();
        } else {
          onPrev();
        }
      }
    },
    [onNext, onPrev]
  );

  if (!isOpen || photos.length === 0) return null;

  const photo = photos[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === photos.length - 1;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Photo lightbox"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-300"
      style={{
        backgroundColor: '#000000cc',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        opacity: visible ? 1 : 0,
      }}
      onClick={handleBackdropClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-lg bg-black/40 text-white transition-colors hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-label="Close lightbox"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 4l12 12M16 4L4 16" />
        </svg>
      </button>

      {/* Previous arrow — always visible, dimmed at boundary */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); if (!isFirst) onPrev(); }}
        className={`absolute left-2 sm:left-4 top-1/2 z-10 flex h-11 w-11 sm:h-12 sm:w-12 -translate-y-1/2 items-center justify-center rounded-lg bg-black/40 text-white transition-colors hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${isFirst ? 'opacity-30 cursor-default' : ''}`}
        aria-label="Previous photo"
        aria-disabled={isFirst}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      {/* Next arrow — always visible, dimmed at boundary */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); if (!isLast) onNext(); }}
        className={`absolute right-2 sm:right-4 top-1/2 z-10 flex h-11 w-11 sm:h-12 sm:w-12 -translate-y-1/2 items-center justify-center rounded-lg bg-black/40 text-white transition-colors hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${isLast ? 'opacity-30 cursor-default' : ''}`}
        aria-label="Next photo"
        aria-disabled={isLast}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* Main image */}
      <div
        className="flex flex-col items-center px-2 sm:px-0 transition-transform duration-300"
        style={{
          transform: visible ? 'scale(1)' : 'scale(0.95)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.src}
          alt={photo.alt}
          className="will-change-opacity transition-opacity duration-200"
          style={{
            maxWidth: '95vw',
            maxHeight: '85vh',
            objectFit: 'contain',
            opacity: imageLoaded ? 1 : 0,
          }}
          onLoad={() => setImageLoaded(true)}
          draggable={false}
        />

        {/* Caption + counter */}
        <div className="mt-3 sm:mt-4 text-center px-4">
          {photo.caption && (
            <p className="text-lg text-white/80">{photo.caption}</p>
          )}
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            {currentIndex + 1} / {photos.length}
          </p>
        </div>
      </div>
    </div>
  );
}

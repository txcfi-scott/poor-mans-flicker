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
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-lg bg-[#0A0A0B99] text-[#F0F0F2] transition-colors hover:bg-[#1E1E22] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6B8AFF]"
        aria-label="Close lightbox"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 4l12 12M16 4L4 16" />
        </svg>
      </button>

      {/* Previous arrow */}
      {!isFirst && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-lg bg-[#0A0A0B99] text-[#F0F0F2] transition-colors hover:bg-[#1E1E22] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6B8AFF]"
          aria-label="Previous photo"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      {/* Next arrow */}
      {!isLast && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-lg bg-[#0A0A0B99] text-[#F0F0F2] transition-colors hover:bg-[#1E1E22] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6B8AFF]"
          aria-label="Next photo"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}

      {/* Main image */}
      <div
        className="flex flex-col items-center transition-transform duration-300"
        style={{
          transform: visible ? 'scale(1)' : 'scale(0.95)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.src}
          alt={photo.alt}
          className="transition-opacity duration-200"
          style={{
            maxWidth: '90vw',
            maxHeight: '80vh',
            objectFit: 'contain',
            opacity: imageLoaded ? 1 : 0,
          }}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Caption + counter */}
        <div className="mt-4 text-center">
          {photo.caption && (
            <p className="text-base text-[#9E9EA8]">{photo.caption}</p>
          )}
          <p className="mt-1 text-sm text-[#636370]">
            {currentIndex + 1} / {photos.length}
          </p>
        </div>
      </div>
    </div>
  );
}

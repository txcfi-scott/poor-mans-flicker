'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export interface LightboxPhoto {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string | null;
}

interface UseLightboxReturn {
  isOpen: boolean;
  currentIndex: number;
  photos: LightboxPhoto[];
  open: (index: number) => void;
  close: () => void;
  next: () => void;
  prev: () => void;
}

export function useLightbox(photos: LightboxPhoto[]): UseLightboxReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const previousOverflow = useRef<string>('');

  const open = useCallback((index: number) => {
    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setCurrentIndex(index);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    document.body.style.overflow = previousOverflow.current;
    setIsOpen(false);
  }, []);

  const next = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, photos.length - 1));
  }, [photos.length]);

  const prev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case 'Escape':
          close();
          break;
        case 'ArrowLeft':
          prev();
          break;
        case 'ArrowRight':
          next();
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close, prev, next]);

  // Cleanup scroll lock on unmount
  useEffect(() => {
    return () => {
      if (document.body.style.overflow === 'hidden') {
        document.body.style.overflow = previousOverflow.current;
      }
    };
  }, []);

  return { isOpen, currentIndex, photos, open, close, next, prev };
}

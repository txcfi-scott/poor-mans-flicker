'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

const STORAGE_KEY_KEN_BURNS = 'slideshow-ken-burns';
const STORAGE_KEY_INTERVAL = 'slideshow-interval';

interface UseSlideshowOptions {
  totalPhotos: number;
  defaultIntervalMs: number;
}

interface UseSlideshowReturn {
  currentIndex: number;
  isPlaying: boolean;
  intervalMs: number;
  kenBurnsEnabled: boolean;
  isFullscreen: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  setIntervalMs: (ms: number) => void;
  toggleKenBurns: () => void;
  enterFullscreen: () => void;
  exitFullscreen: () => void;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return fallback;
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

export function useSlideshow({
  totalPhotos,
  defaultIntervalMs,
}: UseSlideshowOptions): UseSlideshowReturn {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [intervalMs, setIntervalMsState] = useState(() =>
    loadFromStorage(STORAGE_KEY_INTERVAL, defaultIntervalMs)
  );
  const [kenBurnsEnabled, setKenBurnsEnabled] = useState(() =>
    loadFromStorage(STORAGE_KEY_KEN_BURNS, true)
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-advance
  useEffect(() => {
    if (!isPlaying || totalPhotos <= 1) return;

    timerRef.current = setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % totalPhotos);
    }, intervalMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, intervalMs, totalPhotos, currentIndex]);

  // Track fullscreen changes
  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const toggle = useCallback(() => setIsPlaying((p) => !p), []);

  const next = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % totalPhotos);
  }, [totalPhotos]);

  const prev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + totalPhotos) % totalPhotos);
  }, [totalPhotos]);

  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalPhotos) {
        setCurrentIndex(index);
      }
    },
    [totalPhotos]
  );

  const setIntervalMs = useCallback((ms: number) => {
    setIntervalMsState(ms);
    try {
      localStorage.setItem(STORAGE_KEY_INTERVAL, JSON.stringify(ms));
    } catch {
      // ignore
    }
  }, []);

  const toggleKenBurns = useCallback(() => {
    setKenBurnsEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY_KEN_BURNS, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const enterFullscreen = useCallback(() => {
    document.documentElement.requestFullscreen?.().catch(() => {
      // Fullscreen not available — silently ignore
    });
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {
        // ignore
      });
    }
  }, []);

  return {
    currentIndex,
    isPlaying,
    intervalMs,
    kenBurnsEnabled,
    isFullscreen,
    play,
    pause,
    toggle,
    next,
    prev,
    goTo,
    setIntervalMs,
    toggleKenBurns,
    enterFullscreen,
    exitFullscreen,
  };
}

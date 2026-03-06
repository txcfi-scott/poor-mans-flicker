'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const SPEED_OPTIONS = [
  { label: '3s', value: 3000 },
  { label: '5s', value: 5000 },
  { label: '8s', value: 8000 },
  { label: '12s', value: 12000 },
];

interface SlideshowControlsProps {
  isPlaying: boolean;
  currentIndex: number;
  totalPhotos: number;
  intervalMs: number;
  kenBurnsEnabled: boolean;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSetInterval: (ms: number) => void;
  onToggleKenBurns: () => void;
  onExit: () => void;
}

export function SlideshowControls({
  isPlaying,
  currentIndex,
  totalPhotos,
  intervalMs,
  kenBurnsEnabled,
  onTogglePlay,
  onPrev,
  onNext,
  onSetInterval,
  onToggleKenBurns,
  onExit,
}: SlideshowControlsProps) {
  const [visible, setVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const resetHideTimer = useCallback(() => {
    setVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (isPlaying) setVisible(false);
    }, 3000);
  }, [isPlaying]);

  // Show controls when paused
  useEffect(() => {
    if (!isPlaying) {
      setVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    } else {
      resetHideTimer();
    }
  }, [isPlaying, resetHideTimer]);

  // Listen for mouse/touch on the whole document to show controls
  useEffect(() => {
    const handleActivity = () => resetHideTimer();
    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('touchstart', handleActivity);
    return () => {
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('touchstart', handleActivity);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [resetHideTimer]);

  const cycleSpeed = useCallback(() => {
    const currentIdx = SPEED_OPTIONS.findIndex((o) => o.value === intervalMs);
    const nextIdx = (currentIdx + 1) % SPEED_OPTIONS.length;
    onSetInterval(SPEED_OPTIONS[nextIdx].value);
  }, [intervalMs, onSetInterval]);

  const currentSpeedLabel =
    SPEED_OPTIONS.find((o) => o.value === intervalMs)?.label ?? `${Math.round(intervalMs / 1000)}s`;

  return (
    <div
      ref={containerRef}
      className="fixed inset-x-0 bottom-0 z-[60] transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 sm:px-6"
        style={{
          backgroundColor: 'rgba(10, 10, 11, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Left controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-[#9E9EA8] transition-colors hover:bg-[#1E1E22] hover:text-[#F0F0F2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6B8AFF]"
            aria-label="Previous photo"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-[#F0F0F2] transition-colors hover:bg-[#1E1E22] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6B8AFF]"
            aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
          >
            {isPlaying ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4l14 8-14 8V4z" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={onNext}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-[#9E9EA8] transition-colors hover:bg-[#1E1E22] hover:text-[#F0F0F2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6B8AFF]"
            aria-label="Next photo"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Center counter */}
        <div className="text-sm text-[#9E9EA8]">
          {currentIndex + 1} / {totalPhotos}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Speed cycle */}
          <button
            type="button"
            onClick={cycleSpeed}
            className="flex h-11 min-w-11 items-center justify-center rounded-lg px-2 text-sm text-[#9E9EA8] transition-colors hover:bg-[#1E1E22] hover:text-[#F0F0F2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6B8AFF]"
            aria-label={`Speed: ${currentSpeedLabel}. Click to cycle.`}
          >
            {currentSpeedLabel}
          </button>

          {/* Ken Burns toggle */}
          <button
            type="button"
            onClick={onToggleKenBurns}
            className="flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-[#1E1E22] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6B8AFF]"
            style={{
              color: kenBurnsEnabled ? '#6B8AFF' : '#636370',
            }}
            aria-label={kenBurnsEnabled ? 'Disable Ken Burns effect' : 'Enable Ken Burns effect'}
            title="Ken Burns effect"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M2 12h3M19 12h3M12 2v3M12 19v3" />
            </svg>
          </button>

          {/* Exit */}
          <button
            type="button"
            onClick={onExit}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-[#9E9EA8] transition-colors hover:bg-[#1E1E22] hover:text-[#F0F0F2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6B8AFF]"
            aria-label="Exit slideshow"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4l12 12M16 4L4 16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

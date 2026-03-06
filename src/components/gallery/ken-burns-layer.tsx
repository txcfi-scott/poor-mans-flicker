'use client';

import { useMemo } from 'react';

interface KenBurnsLayerProps {
  enabled: boolean;
  photoKey: string;
  durationMs: number;
  children: React.ReactNode;
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function KenBurnsLayer({
  enabled,
  photoKey,
  durationMs,
  children,
}: KenBurnsLayerProps) {
  // Generate random transform params when photo changes
  const params = useMemo(() => {
    const startScale = 1.0;
    const endScale = randomBetween(1.08, 1.15);
    const startX = randomBetween(-3, 3);
    const startY = randomBetween(-3, 3);
    const endX = randomBetween(-3, 3);
    const endY = randomBetween(-3, 3);
    return { startScale, endScale, startX, startY, endX, endY };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoKey]);

  if (!enabled) {
    return <>{children}</>;
  }

  const animationName = `kb-${photoKey.replace(/[^a-zA-Z0-9]/g, '')}`;
  const keyframesCSS = `
    @keyframes ${animationName} {
      from {
        transform: scale(${params.startScale}) translate(${params.startX}%, ${params.startY}%);
      }
      to {
        transform: scale(${params.endScale}) translate(${params.endX}%, ${params.endY}%);
      }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: keyframesCSS }} />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          willChange: 'transform',
          animation: `${animationName} ${durationMs}ms ease-in-out forwards`,
        }}
      >
        {children}
      </div>
    </>
  );
}

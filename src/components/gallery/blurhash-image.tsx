'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { decode } from 'blurhash';

type BlurhashImageProps = {
  blurhash: string;
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
} & (
  | { fill: true; width?: number; height?: number }
  | { fill?: false; width: number; height: number }
);

export function BlurHashImage({
  blurhash,
  src,
  alt,
  width,
  height,
  fill,
  className = '',
  sizes,
}: BlurhashImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);

  // Use sensible defaults for aspect ratio when fill mode
  const aspectW = width || 4;
  const aspectH = height || 3;

  // Decode blurhash and paint to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Decode at small resolution — blurhash is inherently low-res
    const w = 32;
    const h = Math.round(32 * (aspectH / aspectW));
    const pixels = decode(blurhash, w, Math.max(h, 1));

    canvas.width = w;
    canvas.height = Math.max(h, 1);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.createImageData(w, Math.max(h, 1));
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);
  }, [blurhash, aspectW, aspectH]);

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  const containerClass = fill
    ? `absolute inset-0 ${className}`
    : `relative overflow-hidden ${className}`;

  return (
    <div className={containerClass}>
      {/* Blurhash canvas placeholder */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
        style={{ opacity: loaded ? 0 : 1 }}
        aria-hidden
      />

      {/* Real image */}
      {fill ? (
        <img
          src={src}
          alt={alt}
          sizes={sizes}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
          style={{ opacity: loaded ? 1 : 0 }}
        />
      ) : (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          className="w-full h-full object-cover transition-opacity duration-300"
          style={{ opacity: loaded ? 1 : 0 }}
        />
      )}
    </div>
  );
}

// Alias for alternate casing convention
export const BlurhashImage = BlurHashImage;

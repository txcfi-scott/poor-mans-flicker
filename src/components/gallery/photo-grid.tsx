'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { PhotoCard } from '@/components/gallery/photo-card';

export interface GridPhoto {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  blurhash: string;
  caption?: string | null;
}

interface PhotoGridProps {
  photos: GridPhoto[];
  onPhotoClick: (index: number) => void;
}

interface LayoutPhoto {
  photo: GridPhoto;
  index: number;
  computedWidth: number;
  computedHeight: number;
}

interface LayoutRow {
  photos: LayoutPhoto[];
}

const GAP = 8;

function getTargetHeight(): number {
  if (typeof window === 'undefined') return 240;
  const w = window.innerWidth;
  if (w < 768) return 200;
  if (w < 1024) return 240;
  return 280;
}

function computeLayout(
  photos: GridPhoto[],
  containerWidth: number
): LayoutRow[] {
  if (containerWidth <= 0 || photos.length === 0) return [];

  const targetHeight = getTargetHeight();
  const rows: LayoutRow[] = [];
  let currentRow: LayoutPhoto[] = [];
  let currentRowWidth = 0;

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const aspect = photo.width / photo.height;
    const scaledWidth = Math.round(targetHeight * aspect);

    currentRow.push({
      photo,
      index: i,
      computedWidth: scaledWidth,
      computedHeight: targetHeight,
    });

    currentRowWidth += scaledWidth + (currentRow.length > 1 ? GAP : 0);

    // If row exceeds container width, justify it
    if (currentRowWidth >= containerWidth && currentRow.length > 0) {
      const totalGap = (currentRow.length - 1) * GAP;
      const availableWidth = containerWidth - totalGap;
      const naturalWidth = currentRow.reduce((sum, p) => sum + p.computedWidth, 0);
      const scale = availableWidth / naturalWidth;

      const rowHeight = Math.round(targetHeight * scale);
      let usedWidth = 0;

      for (let j = 0; j < currentRow.length; j++) {
        const p = currentRow[j];
        if (j === currentRow.length - 1) {
          // Last photo takes remaining space to avoid rounding gaps
          p.computedWidth = containerWidth - usedWidth - (currentRow.length - 1) * GAP;
        } else {
          p.computedWidth = Math.round(p.computedWidth * scale);
        }
        p.computedHeight = rowHeight;
        usedWidth += p.computedWidth;
      }

      rows.push({ photos: currentRow });
      currentRow = [];
      currentRowWidth = 0;
    }
  }

  // Handle last row — left-aligned unless >80% full
  if (currentRow.length > 0) {
    const totalGap = (currentRow.length - 1) * GAP;
    const naturalWidth = currentRow.reduce((sum, p) => sum + p.computedWidth, 0);
    const rowWidth = naturalWidth + totalGap;

    if (rowWidth / containerWidth > 0.8) {
      // Justify like a full row
      const availableWidth = containerWidth - totalGap;
      const scale = availableWidth / naturalWidth;
      const rowHeight = Math.round(targetHeight * scale);
      let usedWidth = 0;

      for (let j = 0; j < currentRow.length; j++) {
        const p = currentRow[j];
        if (j === currentRow.length - 1) {
          p.computedWidth = containerWidth - usedWidth - totalGap;
        } else {
          p.computedWidth = Math.round(p.computedWidth * scale);
        }
        p.computedHeight = rowHeight;
        usedWidth += p.computedWidth;
      }
    }
    // Otherwise leave at target height (left-aligned)

    rows.push({ photos: currentRow });
  }

  return rows;
}

export function PhotoGrid({ photos, onPhotoClick }: PhotoGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const updateWidth = useCallback(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.clientWidth);
    }
  }, []);

  // ResizeObserver for responsive recalculation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Initial measurement
    setContainerWidth(el.clientWidth);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
        setContainerWidth(Math.floor(width));
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Also recalculate on breakpoint change (target height changes)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    function handleResize() {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateWidth, 150);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateWidth]);

  const rows = computeLayout(photos, containerWidth);

  return (
    <div ref={containerRef} className="w-full">
      {containerWidth > 0 &&
        rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex"
            style={{ gap: GAP, marginBottom: GAP }}
          >
            {row.photos.map((item) => (
              <PhotoCard
                key={item.photo.id}
                src={item.photo.src}
                alt={item.photo.alt}
                width={item.photo.width}
                height={item.photo.height}
                blurhash={item.photo.blurhash}
                caption={item.photo.caption}
                index={item.index}
                onPhotoClick={onPhotoClick}
                style={{
                  width: item.computedWidth,
                  height: item.computedHeight,
                }}
              />
            ))}
          </div>
        ))}
    </div>
  );
}

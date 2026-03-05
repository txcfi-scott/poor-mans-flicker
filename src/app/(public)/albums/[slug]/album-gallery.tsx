'use client';

import { useMemo } from 'react';
import { PhotoGrid } from '@/components/gallery/photo-grid';
import { Lightbox } from '@/components/gallery/lightbox';
import { useLightbox } from '@/hooks/use-lightbox';
import type { GridPhoto } from '@/components/gallery/photo-grid';
import type { LightboxPhoto } from '@/hooks/use-lightbox';

interface AlbumPhoto {
  id: string;
  width: number;
  height: number;
  blurhash: string;
  caption?: string | null;
  thumbUrl: string;
  displayUrl: string;
}

interface AlbumGalleryProps {
  photos: AlbumPhoto[];
}

export function AlbumGallery({ photos }: AlbumGalleryProps) {
  // Grid photos use thumb URLs
  const gridPhotos: GridPhoto[] = useMemo(
    () =>
      photos.map((p) => ({
        id: p.id,
        src: p.thumbUrl,
        alt: p.caption || 'Photo',
        width: p.width,
        height: p.height,
        blurhash: p.blurhash,
        caption: p.caption,
      })),
    [photos]
  );

  // Lightbox photos use display-size URLs
  const lightboxPhotos: LightboxPhoto[] = useMemo(
    () =>
      photos.map((p) => ({
        id: p.id,
        src: p.displayUrl,
        alt: p.caption || 'Photo',
        width: p.width,
        height: p.height,
        caption: p.caption,
      })),
    [photos]
  );

  const lightbox = useLightbox(lightboxPhotos);

  return (
    <>
      <PhotoGrid photos={gridPhotos} onPhotoClick={lightbox.open} />
      <Lightbox
        isOpen={lightbox.isOpen}
        photos={lightbox.photos}
        currentIndex={lightbox.currentIndex}
        onClose={lightbox.close}
        onNext={lightbox.next}
        onPrev={lightbox.prev}
      />
    </>
  );
}

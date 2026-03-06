'use client';

import { useMemo } from 'react';
import { PhotoGrid } from '@/components/gallery/photo-grid';
import { Lightbox } from '@/components/gallery/lightbox';
import { useLightbox } from '@/hooks/use-lightbox';
import type { GridPhoto } from '@/components/gallery/photo-grid';
import type { LightboxPhoto } from '@/hooks/use-lightbox';

interface PlaylistPhoto {
  id: string;
  width: number;
  height: number;
  blurhash: string;
  caption?: string | null;
  thumbUrl: string;
  displayUrl: string;
}

interface PlaylistGalleryProps {
  photos: PlaylistPhoto[];
}

export function PlaylistGallery({ photos }: PlaylistGalleryProps) {
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

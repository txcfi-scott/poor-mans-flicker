'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { PhotoCard } from './PhotoCard';

interface Photo {
  id: string;
  storageKey: string;
  blurhash: string;
  caption: string | null;
  originalFilename: string;
  width: number;
  height: number;
  thumbUrl: string;
  displayUrl: string;
  isFavorite?: boolean;
}

interface PhotoGridProps {
  photos: Photo[];
  albumId: string;
  onSelectionChange?: (selectedIds: string[]) => void;
  onSetCover?: (photoId: string) => void;
  onEditPhoto?: (photoId: string) => void;
  onDeletePhoto?: (photoId: string) => void;
  onToggleFavorite?: (photoId: string) => void;
}

export function PhotoGrid({
  photos: initialPhotos,
  albumId,
  onSelectionChange,
  onSetCover,
  onEditPhoto,
  onDeletePhoto,
  onToggleFavorite,
}: PhotoGridProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sync with parent when photos prop changes (e.g., after uploads or deletions)
  useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);
  const [isReordering, setIsReordering] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSelect = useCallback(
    (id: string, selected: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (selected) {
          next.add(id);
        } else {
          next.delete(id);
        }
        onSelectionChange?.(Array.from(next));
        return next;
      });
    },
    [onSelectionChange]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      const oldIndex = photos.findIndex((p) => p.id === active.id);
      const newIndex = photos.findIndex((p) => p.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(photos, oldIndex, newIndex);
      setPhotos(reordered);

      // Persist the new order
      setIsReordering(true);
      try {
        const response = await fetch(`/api/albums/${albumId}/photos/reorder`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order: reordered.map((p, index) => ({ id: p.id, sortOrder: index })),
          }),
        });

        if (!response.ok) {
          // Revert on failure
          setPhotos(photos);
          console.error('Failed to save photo order');
        }
      } catch (error) {
        // Revert on error
        setPhotos(photos);
        console.error('Failed to save photo order:', error);
      } finally {
        setIsReordering(false);
      }
    },
    [photos, albumId]
  );

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mb-4 opacity-50"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
        <p className="text-sm">No photos in this album yet.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {isReordering && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/50 rounded-lg">
          <p className="text-sm text-muted">Saving order...</p>
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={photos.map((p) => p.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                selected={selectedIds.has(photo.id)}
                onSelect={handleSelect}
                onSetCover={onSetCover}
                onEditPhoto={onEditPhoto}
                onDeletePhoto={onDeletePhoto}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

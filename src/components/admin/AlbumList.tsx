'use client';

import { useState } from 'react';
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
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { AlbumCard } from './AlbumCard';

type Album = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverPhotoId: string | null;
  sortOrder: number;
  isHero: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  photoCount: number;
  coverPhotoUrl: string | null;
  coverPhotoBlurhash: string | null;
};

interface AlbumListProps {
  initialAlbums: Album[];
}

export function AlbumList({ initialAlbums }: AlbumListProps) {
  const [albums, setAlbums] = useState(initialAlbums);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = albums.findIndex((a) => a.id === active.id);
    const newIndex = albums.findIndex((a) => a.id === over.id);

    const reordered = arrayMove(albums, oldIndex, newIndex);
    setAlbums(reordered);

    // Persist the new order
    const order = reordered.map((album, index) => ({
      id: album.id,
      sortOrder: index,
    }));

    try {
      await fetch('/api/albums/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order }),
      });
    } catch (error) {
      console.error('Failed to persist album order:', error);
      // Revert on failure
      setAlbums(albums);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/albums/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAlbums((prev) => prev.filter((a) => a.id !== id));
      } else {
        console.error('Failed to delete album');
      }
    } catch (error) {
      console.error('Failed to delete album:', error);
    }
  }

  if (albums.length === 0) {
    return (
      <div className="text-center py-16 text-muted">
        <p className="text-lg mb-2">No albums yet</p>
        <p className="text-sm">
          Create your first album to start organizing photos.
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={albums.map((a) => a.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2">
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} onDelete={handleDelete} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

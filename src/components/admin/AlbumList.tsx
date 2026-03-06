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
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <svg
          className="mb-6 h-16 w-16 opacity-20 text-[#9E9EA8]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
          />
        </svg>
        <h3 className="mb-2 text-lg font-medium text-[#F0F0F2]">No albums yet</h3>
        <p className="mb-6 max-w-sm text-sm text-[#9E9EA8]">
          Create your first album to start organizing your photos.
        </p>
        <a
          href="/admin/albums/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[#6B8AFF] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#8BA3FF]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Album
        </a>
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

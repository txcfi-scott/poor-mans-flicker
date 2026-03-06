'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface AlbumCardProps {
  album: {
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
  onDelete: (id: string) => void;
}

export function AlbumCard({ album, onDelete }: AlbumCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: album.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDelete = () => {
    if (confirm(`Delete album "${album.title}"? This will also delete all photos in this album. This cannot be undone.`)) {
      onDelete(album.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center gap-4 p-4 bg-surface hover:bg-surface-hover border border-border rounded-lg"
    >
      {/* Drag handle */}
      <button
        ref={setActivatorNodeRef}
        {...listeners}
        className="text-muted-foreground cursor-grab active:cursor-grabbing p-1 touch-none"
        aria-label="Drag to reorder"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="3" r="1.5" />
          <circle cx="11" cy="3" r="1.5" />
          <circle cx="5" cy="8" r="1.5" />
          <circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="13" r="1.5" />
          <circle cx="11" cy="13" r="1.5" />
        </svg>
      </button>

      {/* Cover thumbnail */}
      <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-border">
        {album.coverPhotoUrl ? (
          <img
            src={album.coverPhotoUrl}
            alt={`${album.title} cover`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}
      </div>

      {/* Album info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-foreground truncate">{album.title}</h3>
          {album.isHero && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-accent/20 text-accent">
              Hero
            </span>
          )}
          {!album.isPublic && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-muted-foreground/20 text-muted-foreground">
              Private
            </span>
          )}
        </div>
        <p className="text-sm text-muted">
          {album.photoCount} {album.photoCount === 1 ? 'photo' : 'photos'}
          <span className="mx-2">·</span>
          {new Date(album.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <a
          href={`/admin/albums/${album.id}`}
          className="px-3 py-1.5 text-sm text-foreground hover:bg-border rounded-md transition-colors"
        >
          Edit
        </a>
        <button
          onClick={handleDelete}
          className="px-3 py-1.5 text-sm text-danger hover:bg-danger/10 rounded-md transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

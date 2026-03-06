'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PhotoCardProps {
  photo: {
    id: string;
    storageKey: string;
    blurhash: string;
    caption: string | null;
    originalFilename: string;
    width: number;
    height: number;
    thumbUrl: string;
    isFavorite?: boolean;
  };
  selected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onSetCover?: (photoId: string) => void;
  onEditPhoto?: (photoId: string) => void;
  onDeletePhoto?: (photoId: string) => void;
  onToggleFavorite?: (photoId: string) => void;
}

export function PhotoCard({
  photo,
  selected,
  onSelect,
  onSetCover,
  onEditPhoto,
  onDeletePhoto,
  onToggleFavorite,
}: PhotoCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const thumbUrl = photo.thumbUrl;

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelect(photo.id, e.target.checked);
  };

  const handleDelete = () => {
    if (confirm(`Delete "${photo.caption || photo.originalFilename}"? This cannot be undone.`)) {
      onDeletePhoto?.(photo.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`relative group rounded-lg overflow-hidden bg-surface border-2 transition-colors ${
        selected
          ? 'border-accent'
          : 'border-transparent hover:border-border'
      }`}
    >
      {/* Thumbnail container */}
      <div className="relative aspect-square">
        <img
          src={thumbUrl}
          alt={photo.caption || photo.originalFilename}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Selection checkbox — always visible */}
        <label className="absolute top-2 left-2 z-10 cursor-pointer">
          <input
            type="checkbox"
            checked={selected}
            onChange={handleCheckboxChange}
            className="w-5 h-5 rounded border-2 border-white/80 bg-black/30 text-accent cursor-pointer ring-2 ring-white/50 accent-[var(--color-accent,#3b82f6)]"
          />
        </label>

        {/* Favorite badge — always visible when photo is a favorite */}
        {photo.isFavorite && (
          <div className="absolute bottom-2 left-2 z-10 p-1 rounded-full bg-black/40 text-red-400 pointer-events-none">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
        )}

        {/* Drag handle */}
        <button
          ref={setActivatorNodeRef}
          {...listeners}
          className="absolute top-2 right-2 z-10 p-1 rounded bg-black/30 text-white/80 cursor-grab active:cursor-grabbing touch-none opacity-0 group-hover:opacity-100 transition-opacity"
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

        {/* Hover overlay with action buttons */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
          {onSetCover && (
            <button
              onClick={() => onSetCover(photo.id)}
              className="pointer-events-auto p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              title="Set as cover"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          )}
          {onEditPhoto && (
            <button
              onClick={() => onEditPhoto(photo.id)}
              className="pointer-events-auto p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              title="Edit photo"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(photo.id)}
              className="pointer-events-auto p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              title={photo.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={photo.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          )}
          <button
            onClick={handleDelete}
            className="pointer-events-auto p-2 rounded-full bg-white/20 hover:bg-danger/60 text-white transition-colors"
            title="Delete photo"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
      </div>

      {/* Caption / filename */}
      <div className="px-2 py-1.5">
        <p className="text-xs text-muted truncate">
          {photo.caption || photo.originalFilename}
        </p>
      </div>
    </div>
  );
}

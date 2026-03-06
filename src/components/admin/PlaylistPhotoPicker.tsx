'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
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
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PlaylistPhoto {
  playlistPhotoId: string;
  playlistPhotoSortOrder: number | null;
  addedAt: Date | null;
  id: string;
  albumId: string;
  filename: string;
  originalFilename: string;
  width: number;
  height: number;
  sizeBytes: number;
  mimeType: string;
  caption: string | null;
  storageKey: string;
  blurhash: string;
  sortOrder: number;
  createdAt: Date;
  urls: {
    thumb: string;
    display: string;
    full: string;
  };
}

interface Album {
  id: string;
  title: string;
  photoCount: number;
}

interface AlbumPhoto {
  id: string;
  storageKey: string;
  originalFilename: string;
  caption: string | null;
  width: number;
  height: number;
  thumbUrl: string;
}

interface PlaylistPhotoPickerProps {
  playlistId: string;
  initialPhotos: PlaylistPhoto[];
  storageBaseUrl: string;
}

function SortablePhotoItem({
  photo,
  onRemove,
}: {
  photo: PlaylistPhoto;
  onRemove: (photoId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.playlistPhotoId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-surface border border-border rounded-lg p-2 group"
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted hover:text-foreground p-1 min-h-[44px] min-w-[44px] flex items-center justify-center touch-none"
        {...attributes}
        {...listeners}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
        </svg>
      </button>
      <div className="w-12 h-12 rounded overflow-hidden bg-[#1E1E22] shrink-0 relative">
        <Image
          src={photo.urls.thumb}
          alt={photo.caption || photo.originalFilename}
          fill
          className="object-cover"
          sizes="48px"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground truncate">
          {photo.caption || photo.originalFilename}
        </p>
        <p className="text-xs text-muted-foreground">
          {photo.width} x {photo.height}
        </p>
      </div>
      <button
        onClick={() => onRemove(photo.id)}
        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-[#F87171] transition-colors shrink-0"
        title="Remove from playlist"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function PlaylistPhotoPicker({ playlistId, initialPhotos, storageBaseUrl }: PlaylistPhotoPickerProps) {
  const [photos, setPhotos] = useState<PlaylistPhoto[]>(initialPhotos);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [albumPhotos, setAlbumPhotos] = useState<AlbumPhoto[]>([]);
  const [loadingAlbums, setLoadingAlbums] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const photoIdsInPlaylist = new Set(photos.map((p) => p.id));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Fetch albums on mount
  useEffect(() => {
    async function fetchAlbums() {
      try {
        const res = await fetch('/api/albums?includePrivate=true');
        if (res.ok) {
          const data = await res.json();
          setAlbums(data.albums ?? []);
        }
      } catch {
        console.error('Failed to fetch albums');
      } finally {
        setLoadingAlbums(false);
      }
    }
    fetchAlbums();
  }, []);

  // Fetch photos when album is selected
  useEffect(() => {
    if (!selectedAlbumId) {
      setAlbumPhotos([]);
      return;
    }

    async function fetchPhotos() {
      setLoadingPhotos(true);
      try {
        const res = await fetch(`/api/albums/${selectedAlbumId}`);
        if (res.ok) {
          const data = await res.json();
          const mapped: AlbumPhoto[] = (data.photos ?? []).map((p: Record<string, unknown>) => ({
            id: p.id as string,
            storageKey: p.storageKey as string,
            originalFilename: p.originalFilename as string,
            caption: p.caption as string | null,
            width: p.width as number,
            height: p.height as number,
            thumbUrl: `${storageBaseUrl}/${p.storageKey}/thumb.webp`,
          }));
          setAlbumPhotos(mapped);
        }
      } catch {
        console.error('Failed to fetch album photos');
      } finally {
        setLoadingPhotos(false);
      }
    }
    fetchPhotos();
  }, [selectedAlbumId]);

  const handleAddPhoto = useCallback(
    async (photoId: string) => {
      if (photoIdsInPlaylist.has(photoId)) return;

      try {
        const res = await fetch(`/api/playlists/${playlistId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoIds: [photoId] }),
        });

        if (res.ok) {
          // Refetch the full playlist to get proper data with URLs
          const playlistRes = await fetch(`/api/playlists/${playlistId}`);
          if (playlistRes.ok) {
            const data = await playlistRes.json();
            setPhotos(data.photos ?? []);
          }
        }
      } catch {
        console.error('Failed to add photo');
      }
    },
    [playlistId, photoIdsInPlaylist]
  );

  const handleRemovePhoto = useCallback(
    async (photoId: string) => {
      const prev = [...photos];
      setPhotos((current) => current.filter((p) => p.id !== photoId));

      try {
        const res = await fetch(`/api/playlists/${playlistId}/photos`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoIds: [photoId] }),
        });

        if (!res.ok) {
          setPhotos(prev);
          console.error('Failed to remove photo');
        }
      } catch {
        setPhotos(prev);
        console.error('Failed to remove photo');
      }
    },
    [playlistId, photos]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = photos.findIndex((p) => p.playlistPhotoId === active.id);
      const newIndex = photos.findIndex((p) => p.playlistPhotoId === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(photos, oldIndex, newIndex);
      setPhotos(reordered);

      setIsSaving(true);
      try {
        const res = await fetch(`/api/playlists/${playlistId}/photos/reorder`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order: reordered.map((p, index) => ({
              id: p.playlistPhotoId,
              sortOrder: index,
            })),
          }),
        });

        if (!res.ok) {
          setPhotos(photos);
          console.error('Failed to save order');
        }
      } catch {
        setPhotos(photos);
        console.error('Failed to save order');
      } finally {
        setIsSaving(false);
      }
    },
    [photos, playlistId]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Left side: Album browser */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4">Browse Albums</h3>

        {loadingAlbums ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted">Loading albums...</p>
          </div>
        ) : albums.length === 0 ? (
          <p className="text-sm text-muted text-center py-8">No albums found</p>
        ) : (
          <>
            <select
              value={selectedAlbumId ?? ''}
              onChange={(e) => setSelectedAlbumId(e.target.value || null)}
              className="w-full px-4 py-2.5 bg-[#1E1E22] border border-border rounded-lg text-foreground focus:outline-none focus:border-[#6B8AFF] transition-colors mb-4 min-h-[44px]"
            >
              <option value="">Select an album...</option>
              {albums.map((album) => (
                <option key={album.id} value={album.id}>
                  {album.title} ({album.photoCount} photos)
                </option>
              ))}
            </select>

            {selectedAlbumId && (
              <div className="max-h-[400px] overflow-y-auto">
                {loadingPhotos ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-sm text-muted">Loading photos...</p>
                  </div>
                ) : albumPhotos.length === 0 ? (
                  <p className="text-sm text-muted text-center py-8">No photos in this album</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {albumPhotos.map((photo) => {
                      const inPlaylist = photoIdsInPlaylist.has(photo.id);
                      return (
                        <button
                          key={photo.id}
                          onClick={() => handleAddPhoto(photo.id)}
                          disabled={inPlaylist}
                          className={`relative aspect-square rounded-lg overflow-hidden group transition-opacity ${
                            inPlaylist ? 'opacity-40 cursor-default' : 'hover:ring-2 hover:ring-accent cursor-pointer'
                          }`}
                          title={inPlaylist ? 'Already in playlist' : `Add "${photo.caption || photo.originalFilename}"`}
                        >
                          <Image
                            src={photo.thumbUrl}
                            alt={photo.caption || photo.originalFilename}
                            fill
                            className="object-cover"
                            sizes="120px"
                          />
                          {inPlaylist ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                              <svg className="w-6 h-6 text-[#4ADE80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                              </svg>
                            </div>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                              <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Right side: Playlist sequence */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">
            Playlist Sequence
          </h3>
          <span className="text-xs text-muted-foreground">
            {photos.length} photo{photos.length !== 1 ? 's' : ''}
          </span>
        </div>

        {isSaving && (
          <div className="mb-3 text-xs text-muted text-center">Saving order...</div>
        )}

        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-3 opacity-50"
            >
              <path d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V4.125A2.25 2.25 0 0 0 17.25 2.25H15M9 9v10.5a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.803V9Z" />
            </svg>
            <p className="text-sm">No photos yet</p>
            <p className="text-xs mt-1">Select an album and add photos</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={photos.map((p) => p.playlistPhotoId)}
                strategy={verticalListSortingStrategy}
              >
                {photos.map((photo) => (
                  <SortablePhotoItem
                    key={photo.playlistPhotoId}
                    photo={photo}
                    onRemove={handleRemovePhoto}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>
    </div>
  );
}

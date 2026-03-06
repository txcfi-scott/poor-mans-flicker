'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { PhotoUploader } from './PhotoUploader';
import { PhotoGrid } from './PhotoGrid';
import PhotoEditModal from './PhotoEditModal';
import { BulkActions } from './BulkActions';

interface Album {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverPhotoId: string | null;
}

interface Photo {
  id: string;
  albumId: string;
  storageKey: string;
  blurhash: string;
  caption: string | null;
  originalFilename: string;
  width: number;
  height: number;
  sortOrder: number;
  exifJson: string | null;
  thumbUrl: string;
  displayUrl: string;
}

interface AlbumDetailProps {
  album: Album;
  photos: Photo[];
}

export function AlbumDetail({ album, photos: initialPhotos }: AlbumDetailProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);

  const handleUploadComplete = useCallback((newPhotos: Record<string, unknown>[]) => {
    const mapped = newPhotos.map((p) => {
      const urls = p.urls as { thumb: string; display: string } | undefined;
      return {
        id: p.id as string,
        albumId: p.albumId as string,
        storageKey: p.storageKey as string,
        blurhash: p.blurhash as string,
        caption: (p.caption as string | null) ?? null,
        originalFilename: p.originalFilename as string,
        width: p.width as number,
        height: p.height as number,
        sortOrder: p.sortOrder as number,
        exifJson: (p.exifJson as string | null) ?? null,
        thumbUrl: urls?.thumb ?? '',
        displayUrl: urls?.display ?? '',
      };
    });
    setPhotos((prev) => [...prev, ...mapped]);
  }, []);

  const handleSelectionChange = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  const handleSetCover = useCallback(async (photoId: string) => {
    try {
      const res = await fetch(`/api/albums/${album.id}/cover`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId }),
      });
      if (!res.ok) {
        console.error('Failed to set cover photo');
      }
    } catch (err) {
      console.error('Failed to set cover photo:', err);
    }
  }, [album.id]);

  const handleEditPhoto = useCallback((photoId: string) => {
    const photo = photos.find((p) => p.id === photoId);
    if (photo) setEditingPhoto(photo);
  }, [photos]);

  const handleDeletePhoto = useCallback(async (photoId: string) => {
    try {
      const res = await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        setSelectedIds((prev) => prev.filter((id) => id !== photoId));
      } else {
        console.error('Failed to delete photo');
      }
    } catch (err) {
      console.error('Failed to delete photo:', err);
    }
  }, []);

  const handleBulkDelete = useCallback(async (ids: string[]) => {
    try {
      const res = await fetch('/api/photos/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoIds: ids }),
      });
      if (res.ok) {
        const idSet = new Set(ids);
        setPhotos((prev) => prev.filter((p) => !idSet.has(p.id)));
        setSelectedIds([]);
      } else {
        console.error('Failed to bulk delete photos');
      }
    } catch (err) {
      console.error('Failed to bulk delete photos:', err);
    }
  }, []);

  const handleDeselectAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const handleEditSave = useCallback((photoId: string, caption: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, caption: caption || null } : p))
    );
    setEditingPhoto(null);
  }, []);

  const handleEditClose = useCallback(() => {
    setEditingPhoto(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/admin/albums"
              className="text-muted hover:text-foreground transition-colors text-sm"
            >
              &larr; Back to Albums
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{album.title}</h1>
          <p className="text-sm text-muted mt-1">
            {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
          </p>
        </div>
        <Link
          href={`/admin/albums/${album.id}/edit`}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-surface border border-border hover:bg-surface/80 text-foreground transition-colors"
        >
          Edit Album
        </Link>
      </div>

      {/* Uploader */}
      <PhotoUploader albumId={album.id} onUploadComplete={handleUploadComplete} />

      {/* Photo Grid */}
      <PhotoGrid
        photos={photos}
        albumId={album.id}
        onSelectionChange={handleSelectionChange}
        onSetCover={handleSetCover}
        onEditPhoto={handleEditPhoto}
        onDeletePhoto={handleDeletePhoto}
      />

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <BulkActions
          selectedCount={selectedIds.length}
          selectedIds={selectedIds}
          onDelete={handleBulkDelete}
          onDeselectAll={handleDeselectAll}
        />
      )}

      {/* Edit Modal */}
      {editingPhoto && (
        <PhotoEditModal
          photo={editingPhoto}
          onClose={handleEditClose}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}

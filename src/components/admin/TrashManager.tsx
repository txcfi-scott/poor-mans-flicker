'use client';

import { useState, useCallback } from 'react';

interface TrashedAlbum {
  id: string;
  type: 'album';
  title: string;
  deletedAt: number | null;
}

interface TrashedPhoto {
  id: string;
  type: 'photo';
  title: string;
  caption: string | null;
  albumId: string;
  thumbUrl: string;
  blurhash: string;
  width: number;
  height: number;
  deletedAt: number | null;
  deletedBy: string | null;
}

interface TrashManagerProps {
  initialAlbums: TrashedAlbum[];
  initialPhotos: TrashedPhoto[];
}

function timeAgo(timestamp: number | null): string {
  if (!timestamp) return 'Unknown';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function daysUntilExpiry(timestamp: number | null): number | null {
  if (!timestamp) return null;
  const deletedDaysAgo = (Date.now() - timestamp) / 86400000;
  return Math.max(0, Math.ceil(30 - deletedDaysAgo));
}

export function TrashManager({ initialAlbums, initialPhotos }: TrashManagerProps) {
  const [albums, setAlbums] = useState(initialAlbums);
  const [photos, setPhotos] = useState(initialPhotos);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const isEmpty = albums.length === 0 && photos.length === 0;

  const setItemLoading = useCallback((id: string, isLoading: boolean) => {
    setLoading((prev) => ({ ...prev, [id]: isLoading }));
  }, []);

  const handleRestore = useCallback(async (type: 'album' | 'photo', id: string) => {
    setItemLoading(id, true);
    try {
      const res = await fetch('/api/trash/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id }),
      });
      if (!res.ok) throw new Error('Restore failed');

      if (type === 'album') {
        setAlbums((prev) => prev.filter((a) => a.id !== id));
        // Also remove cascade-deleted photos for this album
        setPhotos((prev) => prev.filter((p) => p.albumId !== id || p.deletedBy !== 'cascade'));
      } else {
        setPhotos((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error('Restore failed:', error);
    } finally {
      setItemLoading(id, false);
    }
  }, [setItemLoading]);

  const handlePermanentDelete = useCallback(async (id: string, type: 'album' | 'photo') => {
    setConfirmDelete(null);
    setItemLoading(id, true);
    try {
      const res = await fetch(`/api/trash/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');

      if (type === 'album') {
        setAlbums((prev) => prev.filter((a) => a.id !== id));
        // Remove photos that belonged to this album
        setPhotos((prev) => prev.filter((p) => p.albumId !== id));
      } else {
        setPhotos((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error('Permanent delete failed:', error);
    } finally {
      setItemLoading(id, false);
    }
  }, [setItemLoading]);

  if (isEmpty) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4 opacity-30">&#128465;</div>
        <p className="text-lg text-secondary">Trash is empty</p>
        <p className="text-sm text-disabled mt-1">
          Deleted albums and photos will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Albums Section */}
      {albums.length > 0 && (
        <section>
          <h2 className="text-lg font-heading font-semibold mb-4 text-secondary">
            Albums ({albums.length})
          </h2>
          <div className="space-y-2">
            {albums.map((album) => {
              const remaining = daysUntilExpiry(album.deletedAt);
              return (
                <div
                  key={album.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-[#141416] border border-[#2A2A30]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{album.title}</p>
                    <div className="flex items-center gap-3 text-sm text-[#9E9EA8] mt-1">
                      <span>Deleted {timeAgo(album.deletedAt)}</span>
                      {remaining !== null && (
                        <span className={remaining <= 3 ? 'text-[#F87171]' : ''}>
                          {remaining === 0
                            ? 'Expires today'
                            : `${remaining} day${remaining === 1 ? '' : 's'} remaining`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleRestore('album', album.id)}
                      disabled={loading[album.id]}
                      className="px-3 py-1.5 text-sm rounded-md bg-[#6B8AFF1A] text-[#6B8AFF] hover:bg-[#6B8AFF33] transition-colors disabled:opacity-50"
                    >
                      {loading[album.id] ? 'Restoring...' : 'Restore'}
                    </button>
                    {confirmDelete === album.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handlePermanentDelete(album.id, 'album')}
                          className="px-3 py-1.5 text-sm rounded-md bg-[#F871711A] text-[#F87171] hover:bg-[#F8717133] transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-3 py-1.5 text-sm rounded-md text-[#9E9EA8] hover:text-[#F0F0F2] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(album.id)}
                        disabled={loading[album.id]}
                        className="px-3 py-1.5 text-sm rounded-md text-[#9E9EA8] hover:text-[#F87171] hover:bg-[#F871711A] transition-colors disabled:opacity-50"
                      >
                        Delete Forever
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Photos Section */}
      {photos.length > 0 && (
        <section>
          <h2 className="text-lg font-heading font-semibold mb-4 text-secondary">
            Photos ({photos.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo) => {
              const remaining = daysUntilExpiry(photo.deletedAt);
              return (
                <div
                  key={photo.id}
                  className="rounded-lg bg-[#141416] border border-[#2A2A30] overflow-hidden"
                >
                  <div className="aspect-[4/3] relative bg-[#1E1E22]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.thumbUrl}
                      alt={photo.caption || photo.title}
                      className="w-full h-full object-cover opacity-60"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium truncate">
                      {photo.caption || photo.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[#9E9EA8] mt-1">
                      <span>Deleted {timeAgo(photo.deletedAt)}</span>
                      {remaining !== null && remaining <= 7 && (
                        <span className={remaining <= 3 ? 'text-[#F87171]' : ''}>
                          {remaining === 0 ? 'Expires today' : `${remaining}d left`}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleRestore('photo', photo.id)}
                        disabled={loading[photo.id]}
                        className="flex-1 px-3 py-1.5 text-xs rounded-md bg-[#6B8AFF1A] text-[#6B8AFF] hover:bg-[#6B8AFF33] transition-colors disabled:opacity-50"
                      >
                        {loading[photo.id] ? '...' : 'Restore'}
                      </button>
                      {confirmDelete === photo.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handlePermanentDelete(photo.id, 'photo')}
                            className="px-2 py-1.5 text-xs rounded-md bg-[#F871711A] text-[#F87171] hover:bg-[#F8717133] transition-colors"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="px-2 py-1.5 text-xs rounded-md text-[#9E9EA8] hover:text-[#F0F0F2] transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(photo.id)}
                          disabled={loading[photo.id]}
                          className="flex-1 px-3 py-1.5 text-xs rounded-md text-[#9E9EA8] hover:text-[#F87171] hover:bg-[#F871711A] transition-colors disabled:opacity-50"
                        >
                          {loading[photo.id] ? '...' : 'Delete Forever'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface PhotoData {
  id: string;
  storageKey: string;
  caption: string | null;
  originalFilename: string;
  width: number;
  height: number;
  exifJson: string | null;
  displayUrl: string;
}

interface ExifData {
  cameraMake?: string;
  cameraModel?: string;
  lens?: string;
  lensModel?: string;
  iso?: number;
  shutterSpeed?: string;
  exposureTime?: string | number;
  aperture?: number;
  fNumber?: number;
  focalLength?: string | number;
  dateTaken?: string;
  dateTimeOriginal?: string;
  [key: string]: unknown;
}

interface PhotoEditModalProps {
  photo: PhotoData;
  onClose: () => void;
  onSave: (photoId: string, caption: string) => void;
}

function parseExif(exifJson: string | null): ExifData | null {
  if (!exifJson) return null;
  try {
    return JSON.parse(exifJson) as ExifData;
  } catch {
    return null;
  }
}

function formatExifField(label: string, value: string | number | undefined | null): { label: string; value: string } | null {
  if (value === undefined || value === null || value === '') return null;
  return { label, value: String(value) };
}

function getExifFields(exif: ExifData | null): { label: string; value: string }[] {
  if (!exif) return [];

  const fields: ({ label: string; value: string } | null)[] = [
    formatExifField('Camera', exif.cameraModel ?? exif.cameraMake ?? undefined),
    formatExifField('Lens', exif.lensModel ?? exif.lens ?? undefined),
    formatExifField('ISO', exif.iso),
    formatExifField(
      'Shutter Speed',
      exif.shutterSpeed ?? (exif.exposureTime !== undefined ? `${exif.exposureTime}s` : undefined)
    ),
    formatExifField(
      'Aperture',
      exif.fNumber !== undefined ? `f/${exif.fNumber}` : exif.aperture !== undefined ? `f/${exif.aperture}` : undefined
    ),
    formatExifField(
      'Focal Length',
      exif.focalLength !== undefined
        ? typeof exif.focalLength === 'number'
          ? `${exif.focalLength}mm`
          : String(exif.focalLength)
        : undefined
    ),
    formatExifField('Date Taken', exif.dateTimeOriginal ?? exif.dateTaken ?? undefined),
  ];

  return fields.filter((f): f is { label: string; value: string } => f !== null);
}

export default function PhotoEditModal({ photo, onClose, onSave }: PhotoEditModalProps) {
  const [caption, setCaption] = useState(photo.caption ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLTextAreaElement>(null);

  const exif = parseExif(photo.exifJson);
  const exifFields = getExifFields(exif);
  const displayUrl = photo.displayUrl;

  // Focus trap
  useEffect(() => {
    firstFocusRef.current?.focus();
  }, []);

  // Escape key handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap: Tab and Shift+Tab
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/photos/${photo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption: caption || null }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `Failed to save (${res.status})`);
      }

      onSave(photo.id, caption);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [photo.id, caption, onSave]);

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={`Edit photo: ${photo.originalFilename}`}
    >
      <div
        ref={modalRef}
        className="bg-surface rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Image */}
        <div className="relative w-full">
          <img
            src={displayUrl}
            alt={photo.caption ?? photo.originalFilename}
            className="w-full rounded-t-xl object-contain max-h-[50vh]"
          />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Filename */}
          <p className="text-sm text-white/50 truncate">{photo.originalFilename}</p>

          {/* EXIF Data */}
          {exifFields.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-white/70 mb-2">Camera Info</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                {exifFields.map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm py-1">
                    <span className="text-white/40">{label}</span>
                    <span className="text-white/70">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Caption */}
          <div>
            <label htmlFor="photo-caption" className="block text-sm font-medium text-white/70 mb-2">
              Caption
            </label>
            <textarea
              ref={firstFocusRef}
              id="photo-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              placeholder="Add a caption..."
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-y"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

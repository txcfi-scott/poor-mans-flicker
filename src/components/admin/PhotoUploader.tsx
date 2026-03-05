'use client';

import { useCallback, useRef, useState } from 'react';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { UploadProgress } from './UploadProgress';
import { ACCEPTED_MIME_TYPES } from '@/lib/constants';

interface PhotoUploaderProps {
  albumId: string;
  onUploadComplete?: (photos: Record<string, unknown>[]) => void;
}

export function PhotoUploader({ albumId, onUploadComplete }: PhotoUploaderProps) {
  const { files, addFiles, removeFile, retryFile, isUploading, completedPhotos } = usePhotoUpload(albumId);
  const reportedRef = useRef(0);

  // Notify parent when new photos complete
  if (completedPhotos.length > reportedRef.current) {
    const newPhotos = completedPhotos.slice(reportedRef.current);
    reportedRef.current = completedPhotos.length;
    // Use queueMicrotask to avoid calling setState during render
    queueMicrotask(() => onUploadComplete?.(newPhotos as Record<string, unknown>[]));
  }
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
        // Reset so the same files can be selected again
        e.target.value = '';
      }
    },
    [addFiles],
  );

  const acceptTypes = ACCEPTED_MIME_TYPES.join(',');

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-accent bg-accent/10'
            : 'border-border hover:border-accent'
        }`}
      >
        <svg
          className="mx-auto w-10 h-10 text-text-muted mb-3"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
        <p className="text-text font-medium">
          Drop photos here or click to browse
        </p>
        <p className="text-sm text-text-muted mt-1">
          JPEG, PNG, WebP, or HEIC up to 20MB each
        </p>
        {isUploading && (
          <p className="text-sm text-accent mt-2">Uploading...</p>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={acceptTypes}
        multiple
        onChange={handleInputChange}
        className="hidden"
      />

      {/* File queue */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <UploadProgress
              key={file.id}
              file={file}
              onRetry={retryFile}
              onRemove={removeFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

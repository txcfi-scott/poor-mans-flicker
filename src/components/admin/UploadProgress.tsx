'use client';

import type { UploadFile } from '@/hooks/usePhotoUpload';

interface UploadProgressProps {
  file: UploadFile;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}

export function UploadProgress({ file, onRetry, onRemove }: UploadProgressProps) {
  return (
    <div className="bg-surface rounded-lg p-3 flex items-center gap-3">
      {/* Thumbnail preview */}
      <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-surface-alt">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={file.preview}
          alt={file.file.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* File info and progress */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text truncate">{file.file.name}</p>

        {file.status === 'uploading' && (
          <div className="mt-1 w-full bg-border rounded-full overflow-hidden h-1">
            <div
              className="bg-accent h-1 rounded-full transition-all duration-300"
              style={{ width: `${file.progress}%` }}
            />
          </div>
        )}

        {file.status === 'error' && (
          <p className="text-xs text-red-500 mt-0.5 truncate">
            {file.error || 'Upload failed'}
          </p>
        )}
      </div>

      {/* Status icon / actions */}
      <div className="flex-shrink-0 flex items-center gap-2">
        {file.status === 'pending' && (
          <span className="text-xs text-text-muted">Waiting...</span>
        )}

        {file.status === 'uploading' && (
          <svg
            className="w-5 h-5 text-accent animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}

        {file.status === 'complete' && (
          <svg
            className="w-5 h-5 text-green-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clipRule="evenodd"
            />
          </svg>
        )}

        {file.status === 'error' && (
          <button
            onClick={() => onRetry(file.id)}
            className="text-xs text-accent hover:text-accent/80 font-medium"
          >
            Retry
          </button>
        )}

        {(file.status === 'pending' || file.status === 'error' || file.status === 'complete') && (
          <button
            onClick={() => onRemove(file.id)}
            className="text-text-muted hover:text-text transition-colors"
            aria-label={`Remove ${file.file.name}`}
          >
            <svg
              className="w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

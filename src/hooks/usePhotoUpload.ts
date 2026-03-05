'use client';

import { useState, useCallback, useRef } from 'react';
import { preResizeImage } from '@/lib/images/client-resize';

export interface UploadFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  progress: number;
  error?: string;
  result?: Record<string, unknown>;
}

export function usePhotoUpload(albumId: string) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const queueRef = useRef<UploadFile[]>([]);
  const uploadingRef = useRef(false);

  const processQueue = useCallback(async () => {
    if (uploadingRef.current) return;
    uploadingRef.current = true;
    setIsUploading(true);

    while (true) {
      const pending = queueRef.current.find(f => f.status === 'pending');
      if (!pending) break;

      // Update status to uploading
      pending.status = 'uploading';
      setFiles([...queueRef.current]);

      try {
        // Pre-resize
        const resized = await preResizeImage(pending.file);

        // Upload via fetch
        const formData = new FormData();
        formData.append('files', resized, pending.file.name);

        const response = await fetch(`/api/albums/${albumId}/photos`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const data = await response.json();
        pending.status = 'complete';
        pending.progress = 100;
        pending.result = data.photos?.[0];
      } catch (err) {
        pending.status = 'error';
        pending.error = err instanceof Error ? err.message : 'Upload failed';
      }

      setFiles([...queueRef.current]);
    }

    uploadingRef.current = false;
    setIsUploading(false);
  }, [albumId]);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const additions: UploadFile[] = Array.from(newFiles).map(file => ({
      id: Math.random().toString(36).slice(2),
      file,
      preview: URL.createObjectURL(file),
      status: 'pending' as const,
      progress: 0,
    }));

    queueRef.current = [...queueRef.current, ...additions];
    setFiles([...queueRef.current]);
    processQueue();
  }, [processQueue]);

  const removeFile = useCallback((id: string) => {
    const file = queueRef.current.find(f => f.id === id);
    if (file) URL.revokeObjectURL(file.preview);
    queueRef.current = queueRef.current.filter(f => f.id !== id);
    setFiles([...queueRef.current]);
  }, []);

  const retryFile = useCallback((id: string) => {
    const file = queueRef.current.find(f => f.id === id);
    if (file) {
      file.status = 'pending';
      file.error = undefined;
      file.progress = 0;
      setFiles([...queueRef.current]);
      processQueue();
    }
  }, [processQueue]);

  const completedPhotos = files
    .filter(f => f.status === 'complete')
    .map(f => f.result)
    .filter(Boolean);

  return { files, addFiles, removeFile, retryFile, isUploading, completedPhotos };
}

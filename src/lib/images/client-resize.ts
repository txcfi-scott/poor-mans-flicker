'use client';

import { CLIENT_RESIZE_MAX_DIMENSION, CLIENT_RESIZE_MAX_SIZE } from '@/lib/constants';

export async function preResizeImage(file: File): Promise<File> {
  // If already small enough, return as-is
  if (file.size <= CLIENT_RESIZE_MAX_SIZE) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down if either dimension exceeds max
      if (width > CLIENT_RESIZE_MAX_DIMENSION || height > CLIENT_RESIZE_MAX_DIMENSION) {
        const ratio = Math.min(
          CLIENT_RESIZE_MAX_DIMENSION / width,
          CLIENT_RESIZE_MAX_DIMENSION / height,
        );
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          const resized = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(resized);
        },
        'image/jpeg',
        0.85,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for resize'));
    };

    img.src = url;
  });
}

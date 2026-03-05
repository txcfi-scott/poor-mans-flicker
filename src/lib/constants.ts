export const IMAGE_VARIANTS = {
  thumb: { width: 400, quality: 80 },
  display: { width: 1600, quality: 85 },
  full: { width: 2400, quality: 90 },
} as const;

export const ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
] as const;

export const MAX_UPLOAD_SIZE = 20 * 1024 * 1024; // 20MB
export const MAX_FILES_PER_UPLOAD = 10;
export const MAX_BULK_DELETE = 50;

export const CLIENT_RESIZE_MAX_DIMENSION = 4096;
export const CLIENT_RESIZE_MAX_SIZE = 4 * 1024 * 1024; // 4MB

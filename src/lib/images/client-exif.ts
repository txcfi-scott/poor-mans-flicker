'use client';

import type { ExifData } from './exif';

export async function readClientExif(file: File): Promise<ExifData> {
  try {
    // Dynamic import to keep bundle size small — exifr only loads when needed
    const exifr = await import('exifr');

    const exif = await exifr.parse(file, {
      pick: ['Make', 'Model', 'LensModel', 'ISO', 'ExposureTime', 'FNumber', 'FocalLength', 'DateTimeOriginal', 'CreateDate'],
    });

    if (!exif) return emptyExif();

    return {
      camera: formatCamera(exif.Make, exif.Model),
      lens: exif.LensModel || null,
      iso: exif.ISO || null,
      shutterSpeed: formatShutterSpeed(exif.ExposureTime),
      aperture: formatAperture(exif.FNumber),
      focalLength: formatFocalLength(exif.FocalLength),
      dateTaken: formatDate(exif.DateTimeOriginal || exif.CreateDate),
    };
  } catch {
    return emptyExif();
  }
}

function emptyExif(): ExifData {
  return { camera: null, lens: null, iso: null, shutterSpeed: null, aperture: null, focalLength: null, dateTaken: null };
}

function formatCamera(make?: string, model?: string): string | null {
  if (!make && !model) return null;
  if (!make) return model!;
  if (!model) return make;
  if (model.toLowerCase().startsWith(make.toLowerCase())) return model;
  return `${make} ${model}`;
}

function formatShutterSpeed(exposureTime?: number): string | null {
  if (!exposureTime) return null;
  if (exposureTime >= 1) return `${exposureTime}s`;
  return `1/${Math.round(1 / exposureTime)}`;
}

function formatAperture(fNumber?: number): string | null {
  if (!fNumber) return null;
  return `f/${fNumber}`;
}

function formatFocalLength(focalLength?: number): string | null {
  if (!focalLength) return null;
  return `${Math.round(focalLength)}mm`;
}

function formatDate(date?: Date | string): string | null {
  if (!date) return null;
  try { return new Date(date).toISOString(); } catch { return null; }
}

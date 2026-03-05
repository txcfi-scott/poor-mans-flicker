import exifr from 'exifr';

export interface ExifData {
  camera: string | null;
  lens: string | null;
  iso: number | null;
  shutterSpeed: string | null;
  aperture: string | null;
  focalLength: string | null;
  dateTaken: string | null;
}

function emptyExif(): ExifData {
  return {
    camera: null,
    lens: null,
    iso: null,
    shutterSpeed: null,
    aperture: null,
    focalLength: null,
    dateTaken: null,
  };
}

function formatCamera(make?: string, model?: string): string | null {
  if (!make && !model) return null;
  const m = (make ?? '').trim();
  const mod = (model ?? '').trim();
  // Avoid duplicating the make if the model already starts with it
  if (mod.toLowerCase().startsWith(m.toLowerCase())) return mod;
  return `${m} ${mod}`.trim() || null;
}

function formatShutterSpeed(exposureTime?: number): string | null {
  if (exposureTime == null) return null;
  if (exposureTime >= 1) return `${exposureTime}s`;
  const denominator = Math.round(1 / exposureTime);
  return `1/${denominator}s`;
}

function formatAperture(fNumber?: number): string | null {
  if (fNumber == null) return null;
  return `f/${fNumber}`;
}

function formatFocalLength(fl?: number): string | null {
  if (fl == null) return null;
  return `${Math.round(fl)}mm`;
}

function formatDate(date?: Date | string): string | null {
  if (!date) return null;
  try {
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString();
  } catch {
    return null;
  }
}

export async function extractExif(buffer: Buffer): Promise<ExifData> {
  try {
    const raw = await exifr.parse(buffer, {
      pick: [
        'Make', 'Model', 'LensModel', 'LensMake',
        'ISO', 'ExposureTime', 'FNumber', 'FocalLength',
        'DateTimeOriginal', 'CreateDate',
      ],
    });

    if (!raw) return emptyExif();

    return {
      camera: formatCamera(raw.Make, raw.Model),
      lens: raw.LensModel ?? null,
      iso: raw.ISO ?? null,
      shutterSpeed: formatShutterSpeed(raw.ExposureTime),
      aperture: formatAperture(raw.FNumber),
      focalLength: formatFocalLength(raw.FocalLength),
      dateTaken: formatDate(raw.DateTimeOriginal ?? raw.CreateDate),
    };
  } catch {
    return emptyExif();
  }
}

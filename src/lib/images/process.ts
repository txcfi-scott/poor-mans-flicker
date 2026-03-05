import sharp from 'sharp';
import { encode } from 'blurhash';
import { IMAGE_VARIANTS } from '@/lib/constants';

export interface ProcessedImage {
  thumb: Buffer;
  display: Buffer;
  full: Buffer;
  blurhash: string;
  width: number;
  height: number;
  aspectRatio: number;
}

export async function processImage(buffer: Buffer): Promise<ProcessedImage> {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error('Unable to read image dimensions');
  }

  const width = metadata.width;
  const height = metadata.height;
  const aspectRatio = width / height;

  // Strip EXIF GPS data, auto-orient based on EXIF rotation
  const normalized = sharp(buffer).rotate().removeAlpha();

  // Generate variants - resize by longest edge, no upscaling
  const [thumb, display, full] = await Promise.all([
    generateVariant(normalized.clone(), IMAGE_VARIANTS.thumb.width, IMAGE_VARIANTS.thumb.quality, width, height),
    generateVariant(normalized.clone(), IMAGE_VARIANTS.display.width, IMAGE_VARIANTS.display.quality, width, height),
    generateVariant(normalized.clone(), IMAGE_VARIANTS.full.width, IMAGE_VARIANTS.full.quality, width, height),
  ]);

  // Generate BlurHash from a small version (needs RGBA pixels)
  const blurhashData = await normalized.clone()
    .resize(32, 32, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const blurhash = encode(
    new Uint8ClampedArray(blurhashData.data),
    blurhashData.info.width,
    blurhashData.info.height,
    4, // x components
    3, // y components
  );

  return { thumb, display, full, blurhash, width, height, aspectRatio };
}

async function generateVariant(
  image: sharp.Sharp,
  maxDimension: number,
  quality: number,
  originalWidth: number,
  originalHeight: number,
): Promise<Buffer> {
  // Don't upscale
  const longestEdge = Math.max(originalWidth, originalHeight);
  const targetSize = Math.min(maxDimension, longestEdge);

  // Resize by longest edge
  const resizeOptions = originalWidth >= originalHeight
    ? { width: targetSize }
    : { height: targetSize };

  return image
    .resize({
      ...resizeOptions,
      withoutEnlargement: true,
      fit: 'inside' as const,
    })
    .webp({ quality })
    .toBuffer();
}

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { photos, albums } from '@/lib/db/schema';
import { eq, max } from 'drizzle-orm';
import { processImage } from '@/lib/images/process';
import { extractExif } from '@/lib/images/exif';
import { getStorageProvider } from '@/lib/storage';
import { generateId } from '@/lib/utils/id';
import { apiSuccess, apiError } from '@/lib/api/response';
import { ACCEPTED_MIME_TYPES, MAX_UPLOAD_SIZE, MAX_FILES_PER_UPLOAD } from '@/lib/constants';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: albumId } = await params;

  // Verify album exists
  const album = await db.select().from(albums).where(eq(albums.id, albumId)).get();
  if (!album) {
    return apiError('Album not found', 'ALBUM_NOT_FOUND', 404);
  }

  // Parse multipart form data
  const formData = await request.formData();
  const files = formData.getAll('files') as File[];

  if (files.length === 0) {
    return apiError('No files provided', 'NO_FILES', 400);
  }

  if (files.length > MAX_FILES_PER_UPLOAD) {
    return apiError(`Maximum ${MAX_FILES_PER_UPLOAD} files per upload`, 'TOO_MANY_FILES', 400);
  }

  // Validate all files before processing
  for (const file of files) {
    if (!ACCEPTED_MIME_TYPES.includes(file.type as typeof ACCEPTED_MIME_TYPES[number])) {
      return apiError(`Invalid file type: ${file.type}`, 'INVALID_FILE_TYPE', 400);
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      return apiError(`File too large: ${file.name}`, 'FILE_TOO_LARGE', 413);
    }
  }

  // Get current max sort order for this album
  const maxSort = await db
    .select({ value: max(photos.sortOrder) })
    .from(photos)
    .where(eq(photos.albumId, albumId))
    .get();
  let sortOrder = (maxSort?.value ?? -1) + 1;

  const storage = getStorageProvider();
  const results = [];

  for (const file of files) {
    const photoId = generateId();
    const storageKey = `albums/${albumId}/${photoId}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      // Process image (generate variants + blurhash)
      const processed = await processImage(buffer);

      // Extract EXIF metadata
      const exif = await extractExif(buffer);

      // Upload all three variants to storage in parallel
      await Promise.all([
        storage.upload(`${storageKey}/thumb.webp`, processed.thumb, 'image/webp'),
        storage.upload(`${storageKey}/display.webp`, processed.display, 'image/webp'),
        storage.upload(`${storageKey}/full.webp`, processed.full, 'image/webp'),
      ]);

      // Insert database record
      const photoRecord = {
        id: photoId,
        albumId,
        filename: `${photoId}_display.webp`,
        originalFilename: file.name,
        width: processed.width,
        height: processed.height,
        sizeBytes: file.size,
        mimeType: file.type,
        exifJson: JSON.stringify(exif),
        caption: null,
        sortOrder: sortOrder++,
        storageKey,
        blurhash: processed.blurhash,
      };

      await db.insert(photos).values(photoRecord);

      results.push({
        ...photoRecord,
        urls: {
          thumb: storage.getUrl(`${storageKey}/thumb.webp`),
          display: storage.getUrl(`${storageKey}/display.webp`),
          full: storage.getUrl(`${storageKey}/full.webp`),
        },
      });
    } catch (error) {
      // Clean up any uploaded variants on failure
      try {
        const keys = await storage.list(storageKey);
        if (keys.length > 0) await storage.deleteMany(keys);
      } catch {
        // Ignore cleanup errors
      }

      return apiError(
        'Failed to process image',
        'PROCESSING_FAILED',
        500,
        { processed: results.length, failed: file.name }
      );
    }
  }

  // Set cover photo if album doesn't have one yet
  if (!album.coverPhotoId && results.length > 0) {
    await db
      .update(albums)
      .set({ coverPhotoId: results[0].id, updatedAt: new Date() })
      .where(eq(albums.id, albumId));
  }

  return apiSuccess({ photos: results }, 201);
}

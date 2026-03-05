# Poor Man's Flickr — Architecture Design Document

**Version:** 1.0
**Date:** 2026-03-05
**Status:** Approved for implementation

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Data Model](#2-data-model)
3. [API Design](#3-api-design)
4. [Image Pipeline](#4-image-pipeline)
5. [Storage Abstraction Layer](#5-storage-abstraction-layer)
6. [Authentication Strategy](#6-authentication-strategy)
7. [Caching Strategy](#7-caching-strategy)
8. [Error Handling](#8-error-handling)
9. [Performance Considerations](#9-performance-considerations)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Directory Structure](#11-directory-structure)

---

## 1. System Overview

### High-Level Architecture

```
                                 +---------------------+
                                 |    Cloudflare CDN    |
                                 |  (R2 public bucket)  |
                                 +----------+----------+
                                            |
                                            | images (immutable URLs)
                                            |
+-------------+    HTTPS     +-------------+-------------+
|             |  ---------> |         Vercel Edge         |
|   Browser   |             |   Next.js 15 (App Router)   |
|   Client    | <--------- |                             |
|             |   HTML/JSON  |  +-------+  +-----------+  |
+------+------+             |  | React  |  | Route     |  |
       |                    |  | RSC    |  | Handlers  |  |
       | upload (multipart) |  +-------+  +-----+-----+  |
       +-------------------> |                  |         |
                            +-------------------+---------+
                                                |
                              +-----------------+------------------+
                              |                                    |
                    +---------v---------+            +-------------v-----------+
                    |   Turso (libSQL)  |            |   Cloudflare R2         |
                    |   SQLite over HTTP|            |   (S3-compatible API)   |
                    |                   |            |                         |
                    |  - Albums         |            |  albums/{albumId}/      |
                    |  - Photos         |            |    {photoId}/           |
                    |  - SiteConfig     |            |      original.*         |
                    +-------------------+            |      thumb.webp         |
                                                     |      display.webp       |
                                                     |      full.webp          |
                                                     +-------------------------+
```

### Component Inventory

| Component | Technology | Responsibility |
|-----------|-----------|----------------|
| **Frontend (Public)** | React Server Components + Client Components | Gallery grid, album pages, slideshow viewer, hero carousel |
| **Frontend (Admin)** | React Client Components | Album/photo CRUD, drag-and-drop reorder, bulk upload, site settings |
| **API Layer** | Next.js Route Handlers | RESTful endpoints for all mutations and data queries |
| **ORM** | Drizzle ORM | Type-safe database queries, schema definition, migrations |
| **Database** | Turso (libSQL) | Persistent storage for albums, photos, site configuration |
| **Image Processor** | Sharp (server-side) + client-side canvas | Resize, convert to WebP, extract EXIF, generate BlurHash |
| **Object Storage** | Cloudflare R2 via @aws-sdk/client-s3 | Store original and processed image variants |
| **Auth (V1)** | Middleware + env token | Protect admin routes and mutation endpoints |
| **Auth (V2)** | Auth.js | OAuth/magic-link authentication for admin |
| **Hosting** | Vercel (free tier) | Edge deployment, serverless functions, git-push deploy |

### Request Flows

#### Public Page Load (Album Gallery)

```
1. Browser requests /albums/landscapes
2. Vercel edge serves cached ISR page (if valid)
   — OR —
   Next.js RSC renders:
   a. Query Turso: SELECT * FROM album WHERE slug = 'landscapes' AND is_public = 1
   b. Query Turso: SELECT * FROM photo WHERE album_id = ? ORDER BY sort_order ASC
   c. Render React Server Component with photo grid
   d. BlurHash placeholders inlined in HTML (no extra fetch)
   e. Image src attributes point to R2 public CDN URLs
3. Browser renders HTML immediately (blurhash visible)
4. Browser lazy-loads images from Cloudflare CDN (R2 public URL)
5. Vercel caches rendered page for ISR revalidation period
```

#### Photo Upload

```
1. Admin selects files in browser upload UI
2. Client-side pre-processing (per file, parallel):
   a. Read EXIF data via exif-js or similar
   b. Resize to max 2400px on longest side using canvas
   c. Compress to JPEG quality 85 (or keep if already small enough)
   d. Generate BlurHash from a small thumbnail canvas
3. Client sends multipart POST to /api/albums/{albumId}/photos
   - Body: FormData with file(s) + JSON metadata (exif, blurhash, original dimensions)
4. Server Route Handler:
   a. Validate auth token
   b. For each file:
      i.   Generate UUID for photo ID
      ii.  Process with Sharp: create thumb (400px), display (1600px), full (2400px) — all WebP
      iii. Upload all 4 files to R2 (original + 3 variants)
      iv.  Insert row into photo table (with blurhash, exif, dimensions, storage_key)
   c. Return created photo records
5. Client updates gallery grid with new photos
```

#### Slideshow Start

```
1. User clicks "Slideshow" on album page (or hero plays automatically)
2. Client fetches GET /api/slideshow?albumId={id}&interval=5000
   — OR for hero: GET /api/hero
3. Server returns ordered photo list with display-variant URLs + blurhash
4. Client enters fullscreen slideshow mode:
   a. Display current photo
   b. Preload next 2 photos into hidden <img> elements
   c. Advance on timer (configurable interval from SiteConfig or query param)
   d. Cross-fade transition between photos
```

---

## 2. Data Model

### Schema Definition (Drizzle ORM)

All tables use Drizzle's SQLite column types. Primary keys are TEXT (UUID v4). Timestamps are INTEGER (Unix epoch milliseconds).

#### Album Table

```typescript
export const album = sqliteTable('album', {
  id:             text('id').primaryKey(),                    // UUID v4
  title:          text('title').notNull(),                    // "Landscapes of Iceland"
  slug:           text('slug').notNull().unique(),            // "landscapes-of-iceland"
  description:    text('description'),                        // Optional markdown description
  coverPhotoId:   text('cover_photo_id'),                     // FK to photo.id (nullable, SET NULL on photo delete)
  sortOrder:      integer('sort_order').notNull().default(0), // Manual ordering
  isHero:         integer('is_hero', { mode: 'boolean' }).notNull().default(false), // Include in hero carousel
  isPublic:       integer('is_public', { mode: 'boolean' }).notNull().default(true),
  createdAt:      integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  updatedAt:      integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  slugIdx:        uniqueIndex('album_slug_idx').on(table.slug),
  sortOrderIdx:   index('album_sort_order_idx').on(table.sortOrder),
  isHeroIdx:      index('album_is_hero_idx').on(table.isHero),
  isPublicIdx:    index('album_is_public_idx').on(table.isPublic),
}));
```

#### Photo Table

```typescript
export const photo = sqliteTable('photo', {
  id:               text('id').primaryKey(),                      // UUID v4
  albumId:          text('album_id').notNull()
                      .references(() => album.id, { onDelete: 'cascade' }),
  filename:         text('filename').notNull(),                   // Generated: "{id}_display.webp"
  originalFilename: text('original_filename').notNull(),          // "DSC_4521.jpg"
  width:            integer('width').notNull(),                   // Original width in px
  height:           integer('height').notNull(),                  // Original height in px
  sizeBytes:        integer('size_bytes').notNull(),              // Original file size
  mimeType:         text('mime_type').notNull(),                  // "image/jpeg", "image/webp", etc.
  exifJson:         text('exif_json'),                            // JSON string of extracted EXIF
  caption:          text('caption'),                              // Optional caption/alt text
  sortOrder:        integer('sort_order').notNull().default(0),   // Manual ordering within album
  storageKey:       text('storage_key').notNull(),                // R2 path prefix: "albums/{albumId}/{photoId}"
  blurhash:         text('blurhash').notNull(),                   // BlurHash string (e.g. "LEHV6nWB2yk8pyo0adR*.7kCMdnj")
  createdAt:        integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  albumIdIdx:       index('photo_album_id_idx').on(table.albumId),
  sortOrderIdx:     index('photo_sort_order_idx').on(table.albumId, table.sortOrder),
  storageKeyIdx:    uniqueIndex('photo_storage_key_idx').on(table.storageKey),
}));
```

#### SiteConfig Table

```typescript
export const siteConfig = sqliteTable('site_config', {
  id:                          integer('id').primaryKey().default(1), // Always 1 (single-row)
  siteTitle:                   text('site_title').notNull().default('My Photography'),
  siteDescription:             text('site_description').notNull().default('A photography portfolio'),
  heroIntervalMs:              integer('hero_interval_ms').notNull().default(5000),
  slideshowDefaultIntervalMs:  integer('slideshow_default_interval_ms').notNull().default(4000),
  themeColorPrimary:           text('theme_color_primary').notNull().default('#ffffff'),
  themeColorBackground:        text('theme_color_background').notNull().default('#0a0a0a'),
  themeColorAccent:            text('theme_color_accent').notNull().default('#3b82f6'),
  themeFontHeading:            text('theme_font_heading').notNull().default('Inter'),
  themeFontBody:               text('theme_font_body').notNull().default('Inter'),
});
```

### Relationships

```
Album 1 ---< N Photo        (album.id -> photo.album_id, CASCADE DELETE)
Album 1 ---? 1 Photo        (album.cover_photo_id -> photo.id, SET NULL on photo delete)
```

- Deleting an album cascades to delete all its photos (and triggers R2 cleanup via application logic).
- Deleting a photo that is an album's cover sets `cover_photo_id` to NULL.
- The `cover_photo_id` foreign key is enforced at the application level (not DB level) to avoid circular reference issues in SQLite. The application sets it to NULL before deleting the photo.

### Indexes Summary

| Index Name | Table | Columns | Type | Purpose |
|------------|-------|---------|------|---------|
| `album_slug_idx` | album | slug | UNIQUE | Lookup album by URL slug |
| `album_sort_order_idx` | album | sort_order | INDEX | Order albums for display |
| `album_is_hero_idx` | album | is_hero | INDEX | Filter hero albums |
| `album_is_public_idx` | album | is_public | INDEX | Filter public albums |
| `photo_album_id_idx` | photo | album_id | INDEX | Get all photos in album |
| `photo_sort_order_idx` | photo | album_id, sort_order | INDEX | Ordered photo list within album |
| `photo_storage_key_idx` | photo | storage_key | UNIQUE | Ensure no storage collisions |

### Seed Data

The `site_config` table is seeded with a single row (id=1) during migration. All subsequent operations are UPDATEs.

---

## 3. API Design

All API routes live under `/app/api/`. All mutation routes require authentication (V1: `Authorization: Bearer {ADMIN_TOKEN}`). All responses use JSON. All errors follow the standard error format.

### Standard Error Response

```typescript
interface ApiError {
  error: string;    // Human-readable message
  code: string;     // Machine-readable code (e.g. "ALBUM_NOT_FOUND")
  details?: any;    // Optional additional context
}
```

HTTP status codes: 200 (success), 201 (created), 204 (no content), 400 (bad request), 401 (unauthorized), 404 (not found), 409 (conflict), 413 (payload too large), 500 (internal server error).

---

### Albums

#### `GET /api/albums`

List all albums. Public route returns only public albums. Admin route returns all.

**Query Parameters:**
- `includePrivate` (boolean, default false) — requires auth

**Response (200):**
```json
{
  "albums": [
    {
      "id": "uuid",
      "title": "Landscapes",
      "slug": "landscapes",
      "description": "Mountain and valley photography",
      "coverPhotoId": "uuid-or-null",
      "coverPhotoUrl": "https://r2.example.com/albums/.../thumb.webp",
      "coverPhotoBlurhash": "LEHV6nWB...",
      "sortOrder": 0,
      "isHero": false,
      "isPublic": true,
      "photoCount": 42,
      "createdAt": "2026-03-01T00:00:00.000Z",
      "updatedAt": "2026-03-01T00:00:00.000Z"
    }
  ]
}
```

#### `GET /api/albums/[slug]`

Get a single album by slug with its photos.

**Response (200):**
```json
{
  "album": { /* Album object */ },
  "photos": [
    {
      "id": "uuid",
      "albumId": "uuid",
      "filename": "uuid_display.webp",
      "originalFilename": "DSC_4521.jpg",
      "width": 4000,
      "height": 2667,
      "sizeBytes": 4200000,
      "mimeType": "image/jpeg",
      "exif": { "camera": "Nikon D850", "lens": "24-70mm f/2.8", "iso": 200, "aperture": "f/8", "shutter": "1/250" },
      "caption": "Sunrise over the valley",
      "sortOrder": 0,
      "blurhash": "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
      "urls": {
        "thumb": "https://r2.example.com/albums/{albumId}/{photoId}/thumb.webp",
        "display": "https://r2.example.com/albums/{albumId}/{photoId}/display.webp",
        "full": "https://r2.example.com/albums/{albumId}/{photoId}/full.webp"
      },
      "createdAt": "2026-03-01T00:00:00.000Z"
    }
  ]
}
```

**Error (404):**
```json
{ "error": "Album not found", "code": "ALBUM_NOT_FOUND" }
```

#### `POST /api/albums` (Auth required)

Create a new album.

**Request Body:**
```json
{
  "title": "Landscapes",
  "description": "Mountain photography",
  "isPublic": true,
  "isHero": false
}
```

- `slug` is auto-generated from `title` (lowercase, hyphenated, deduplicated with numeric suffix if collision).
- `sortOrder` is set to MAX(sort_order) + 1 of existing albums.

**Response (201):**
```json
{ "album": { /* full Album object */ } }
```

**Errors:**
- 400 `INVALID_TITLE` — title is empty or exceeds 200 characters
- 409 `SLUG_GENERATION_FAILED` — could not generate a unique slug after 10 attempts

#### `PATCH /api/albums/[id]` (Auth required)

Update album fields. Only provided fields are updated. `updatedAt` is automatically set.

**Request Body (all fields optional):**
```json
{
  "title": "New Title",
  "description": "Updated description",
  "isPublic": false,
  "isHero": true
}
```

If `title` changes, `slug` is regenerated (with redirect consideration — out of scope for V1).

**Response (200):**
```json
{ "album": { /* updated Album object */ } }
```

**Errors:**
- 404 `ALBUM_NOT_FOUND`
- 400 `INVALID_TITLE`

#### `DELETE /api/albums/[id]` (Auth required)

Delete an album and all its photos. Triggers cascading photo deletion in DB and R2 cleanup.

**Response (204):** No content.

**Side effects:**
1. All photo rows deleted via CASCADE.
2. Background job (or inline) deletes all R2 objects under `albums/{albumId}/`.

**Errors:**
- 404 `ALBUM_NOT_FOUND`

#### `PUT /api/albums/reorder` (Auth required)

Reorder albums.

**Request Body:**
```json
{
  "order": [
    { "id": "uuid-1", "sortOrder": 0 },
    { "id": "uuid-2", "sortOrder": 1 },
    { "id": "uuid-3", "sortOrder": 2 }
  ]
}
```

**Response (200):**
```json
{ "success": true }
```

Updates all provided album sort_order values in a single transaction.

#### `PUT /api/albums/[id]/cover` (Auth required)

Set the cover photo for an album.

**Request Body:**
```json
{ "photoId": "uuid" }
```

**Response (200):**
```json
{ "album": { /* updated Album object */ } }
```

**Errors:**
- 404 `ALBUM_NOT_FOUND`
- 404 `PHOTO_NOT_FOUND`
- 400 `PHOTO_NOT_IN_ALBUM` — photo exists but belongs to different album

---

### Photos

#### `POST /api/albums/[albumId]/photos` (Auth required)

Upload one or more photos to an album. Accepts multipart/form-data.

**Request:** `Content-Type: multipart/form-data`

Form fields:
- `files` — one or more image files (max 10 per request, max 20MB each after client resize)
- `metadata` — JSON string: array of objects matching file order:
  ```json
  [
    {
      "originalFilename": "DSC_4521.jpg",
      "width": 4000,
      "height": 2667,
      "exif": { /* extracted EXIF */ },
      "blurhash": "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
      "caption": "Optional caption"
    }
  ]
  ```

**Processing per file:**
1. Validate file type (image/jpeg, image/png, image/webp, image/heic).
2. Generate UUID for photo ID.
3. Run Sharp pipeline (see Section 4).
4. Upload 4 files to R2.
5. Insert photo row.
6. Set `sortOrder` to MAX(sort_order) + 1 within the album.

**Response (201):**
```json
{
  "photos": [ /* array of created Photo objects with URLs */ ]
}
```

**Errors:**
- 400 `NO_FILES` — no files in upload
- 400 `TOO_MANY_FILES` — exceeds 10 file limit
- 400 `INVALID_FILE_TYPE` — unsupported MIME type (includes which file failed)
- 400 `FILE_TOO_LARGE` — file exceeds 20MB
- 404 `ALBUM_NOT_FOUND`
- 500 `PROCESSING_FAILED` — Sharp or R2 failure (includes partial results if some succeeded)

#### `DELETE /api/photos/[id]` (Auth required)

Delete a single photo.

**Response (204):** No content.

**Side effects:**
1. If this photo is the album's `coverPhotoId`, set it to NULL.
2. Delete all R2 objects under `albums/{albumId}/{photoId}/`.
3. Delete photo row.

#### `DELETE /api/photos/bulk` (Auth required)

Bulk delete photos.

**Request Body:**
```json
{ "photoIds": ["uuid-1", "uuid-2", "uuid-3"] }
```

**Response (200):**
```json
{ "deleted": 3 }
```

Maximum 50 photos per request.

#### `PUT /api/albums/[albumId]/photos/reorder` (Auth required)

Reorder photos within an album.

**Request Body:**
```json
{
  "order": [
    { "id": "uuid-1", "sortOrder": 0 },
    { "id": "uuid-2", "sortOrder": 1 }
  ]
}
```

**Response (200):**
```json
{ "success": true }
```

#### `PATCH /api/photos/[id]` (Auth required)

Update photo caption.

**Request Body:**
```json
{ "caption": "New caption text" }
```

**Response (200):**
```json
{ "photo": { /* updated Photo object */ } }
```

---

### Hero

#### `GET /api/hero`

Get photos for the hero carousel. Returns all photos from albums where `is_hero = true`, ordered by album sort_order then photo sort_order.

**Response (200):**
```json
{
  "photos": [
    {
      "id": "uuid",
      "albumId": "uuid",
      "albumTitle": "Landscapes",
      "albumSlug": "landscapes",
      "blurhash": "LEHV6nWB...",
      "urls": {
        "display": "https://r2.example.com/...",
        "full": "https://r2.example.com/..."
      },
      "width": 4000,
      "height": 2667,
      "caption": "Sunrise"
    }
  ],
  "intervalMs": 5000
}
```

---

### Slideshow

#### `GET /api/slideshow`

Get photos for slideshow playback.

**Query Parameters:**
- `albumId` (required) — single album ID
- `startFromId` (optional) — photo ID to start from (default: first photo)

**Response (200):**
```json
{
  "photos": [
    {
      "id": "uuid",
      "blurhash": "LEHV6nWB...",
      "urls": {
        "display": "https://r2.example.com/...",
        "full": "https://r2.example.com/..."
      },
      "width": 4000,
      "height": 2667,
      "caption": "Sunrise"
    }
  ],
  "intervalMs": 4000,
  "albumTitle": "Landscapes"
}
```

---

### Site Configuration

#### `GET /api/config`

Get site configuration. Public route.

**Response (200):**
```json
{
  "config": {
    "siteTitle": "My Photography",
    "siteDescription": "A photography portfolio",
    "heroIntervalMs": 5000,
    "slideshowDefaultIntervalMs": 4000,
    "theme": {
      "colorPrimary": "#ffffff",
      "colorBackground": "#0a0a0a",
      "colorAccent": "#3b82f6",
      "fontHeading": "Inter",
      "fontBody": "Inter"
    }
  }
}
```

#### `PATCH /api/config` (Auth required)

Update site configuration. Only provided fields are updated.

**Request Body (all fields optional):**
```json
{
  "siteTitle": "Updated Title",
  "siteDescription": "Updated description",
  "heroIntervalMs": 6000,
  "slideshowDefaultIntervalMs": 5000,
  "theme": {
    "colorPrimary": "#f0f0f0",
    "colorBackground": "#111111"
  }
}
```

**Response (200):**
```json
{ "config": { /* full updated config */ } }
```

---

## 4. Image Pipeline

### Client-Side Pre-Processing

Performed in the browser before upload, using a Web Worker where possible to avoid blocking the UI.

```
Input File
    |
    v
[1. Read EXIF] -----> Extract: camera, lens, ISO, aperture, shutter speed,
    |                  focal length, date taken, GPS (if present)
    |                  Library: exifr (lightweight, tree-shakeable)
    v
[2. Resize]  -------> Max 2400px on longest side
    |                  Use OffscreenCanvas (in Worker) or HTMLCanvasElement
    |                  Maintain aspect ratio
    |                  Output: JPEG at quality 0.85 (or keep original if already <= 2400px and WebP)
    v
[3. BlurHash] ------> Downscale to 32px wide (maintain aspect)
    |                  Compute BlurHash with components (4, 3)
    |                  Library: blurhash (encode function)
    v
[4. Package] -------> FormData:
                         - file: resized Blob
                         - metadata: JSON { originalFilename, width, height, exif, blurhash }
```

**Size limit enforcement:** If the resized file exceeds 20MB, reject client-side with error message before attempting upload.

### Server-Side Processing (Sharp)

Performed in the Next.js Route Handler (runs on Vercel Serverless Function, not Edge — Sharp requires Node.js runtime).

```typescript
// next.config.ts — force Node.js runtime for API routes that use Sharp
// Sharp is server-only; never imported in client bundles

async function processImage(buffer: Buffer, photoId: string, albumId: string): Promise<ProcessedImage> {
  const sharp = (await import('sharp')).default;
  const image = sharp(buffer);
  const metadata = await image.metadata();

  // Variant specifications
  const variants = [
    { name: 'thumb',   maxDimension: 400,  quality: 80 },
    { name: 'display', maxDimension: 1600, quality: 85 },
    { name: 'full',    maxDimension: 2400, quality: 90 },
  ] as const;

  const results: Record<string, Buffer> = {};

  for (const variant of variants) {
    results[variant.name] = await sharp(buffer)
      .rotate()                           // Auto-rotate based on EXIF orientation
      .resize(variant.maxDimension, variant.maxDimension, {
        fit: 'inside',                    // Maintain aspect ratio, fit within box
        withoutEnlargement: true,         // Never upscale
      })
      .webp({ quality: variant.quality })
      .toBuffer();
  }

  return {
    variants: results,                    // { thumb: Buffer, display: Buffer, full: Buffer }
    original: buffer,                     // Keep original as-is
    width: metadata.width!,
    height: metadata.height!,
  };
}
```

### Variant Specifications

| Variant | Max Dimension | Format | Quality | Use Case |
|---------|--------------|--------|---------|----------|
| `thumb` | 400px | WebP | 80 | Gallery grid, album covers |
| `display` | 1600px | WebP | 85 | Lightbox, slideshow |
| `full` | 2400px | WebP | 90 | Full-screen viewing, zoom |
| `original` | as-uploaded | original | original | Archive/download |

All variants use `fit: 'inside'` — the longest side matches `maxDimension`, the other side scales proportionally.

### EXIF Extraction

EXIF is extracted client-side (using `exifr`) and stored as JSON in the `exif_json` column. The server does NOT re-extract EXIF — the client is the source of truth.

Stored EXIF fields (normalized):
```typescript
interface PhotoExif {
  cameraMake?: string;        // "Nikon"
  cameraModel?: string;       // "D850"
  lens?: string;              // "24-70mm f/2.8"
  focalLength?: number;       // 50 (mm)
  aperture?: number;          // 2.8
  shutterSpeed?: string;      // "1/250"
  iso?: number;               // 200
  dateTaken?: string;         // ISO 8601
  gpsLatitude?: number;       // 64.1466 (optional, may be stripped for privacy)
  gpsLongitude?: number;      // -21.9426
}
```

### BlurHash Generation

Generated client-side from a small (32px wide) version of the image. Components: (4, 3) — good balance of detail and string length. Result is a ~20-30 character string stored in the `blurhash` column.

Server-side fallback: if the client does not send a BlurHash (e.g., API upload), the server generates one from the thumb variant using the `blurhash` npm package.

### R2 Storage Layout

```
{R2_BUCKET}/
  albums/
    {albumId}/
      {photoId}/
        original.{ext}       # DSC_4521.jpg (original format, original extension)
        thumb.webp            # 400px WebP
        display.webp          # 1600px WebP
        full.webp             # 2400px WebP
```

- `{albumId}` and `{photoId}` are UUID v4 strings.
- `{ext}` preserves the original file extension (jpg, png, webp, heic).
- All objects use `Content-Type` headers matching their format.
- WebP variants include `Cache-Control: public, max-age=31536000, immutable`.

### R2 Configuration

| Setting | Value |
|---------|-------|
| Bucket name | `pmf-photos` (configurable via `R2_BUCKET` env var) |
| Public access | Enabled — public bucket with custom domain |
| CDN domain | `photos.yourdomain.com` (CNAME to R2 public bucket URL) |
| CORS | Allow `*` for GET; restrict PUT/DELETE to app origin |

### URL Generation

Public bucket approach (no signed URLs for reads):

```typescript
function getPhotoUrl(storageKey: string, variant: 'thumb' | 'display' | 'full' | 'original'): string {
  const ext = variant === 'original' ? photo.originalExtension : 'webp';
  return `${process.env.R2_PUBLIC_URL}/albums/${storageKey}/${variant}.${ext}`;
}
```

Uploads use the S3-compatible SDK with credentials (never exposed to client).

### Deletion Cleanup

When a photo is deleted:

```typescript
async function deletePhotoAssets(storageKey: string, originalExt: string): Promise<void> {
  const keys = [
    `albums/${storageKey}/original.${originalExt}`,
    `albums/${storageKey}/thumb.webp`,
    `albums/${storageKey}/display.webp`,
    `albums/${storageKey}/full.webp`,
  ];

  // Use DeleteObjects for batch deletion (max 1000 keys per request)
  await s3Client.send(new DeleteObjectsCommand({
    Bucket: process.env.R2_BUCKET,
    Delete: { Objects: keys.map(Key => ({ Key })) },
  }));
}
```

When an album is deleted, all photos are fetched first, then all R2 keys are batched into DeleteObjects calls (up to 1000 per request).

---

## 5. Storage Abstraction Layer

### Interface

```typescript
// lib/storage/types.ts

export interface StorageProvider {
  /**
   * Upload a file to storage.
   * @param key - Full object key (e.g., "albums/{albumId}/{photoId}/thumb.webp")
   * @param data - File contents
   * @param contentType - MIME type
   * @returns The public URL of the uploaded object
   */
  upload(key: string, data: Buffer, contentType: string): Promise<string>;

  /**
   * Delete a single object from storage.
   * @param key - Full object key
   */
  delete(key: string): Promise<void>;

  /**
   * Delete multiple objects from storage.
   * @param keys - Array of full object keys (max 1000)
   */
  deleteMany(keys: string[]): Promise<void>;

  /**
   * Get the public URL for an object.
   * @param key - Full object key
   */
  getUrl(key: string): string;

  /**
   * List objects under a prefix.
   * @param prefix - Key prefix (e.g., "albums/{albumId}/")
   * @returns Array of object keys
   */
  list(prefix: string): Promise<string[]>;
}
```

### R2 Implementation

```typescript
// lib/storage/r2.ts

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import type { StorageProvider } from './types';

export class R2StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor() {
    this.client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT!,           // https://{accountId}.r2.cloudflarestorage.com
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY!,
        secretAccessKey: process.env.R2_SECRET_KEY!,
      },
    });
    this.bucket = process.env.R2_BUCKET!;
    this.publicUrl = process.env.R2_PUBLIC_URL!;     // https://photos.yourdomain.com
  }

  async upload(key: string, data: Buffer, contentType: string): Promise<string> {
    const cacheControl = key.endsWith('.webp')
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=86400';

    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: data,
      ContentType: contentType,
      CacheControl: cacheControl,
    }));

    return this.getUrl(key);
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
  }

  async deleteMany(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    // R2 supports up to 1000 keys per DeleteObjects request
    for (let i = 0; i < keys.length; i += 1000) {
      const batch = keys.slice(i, i + 1000);
      await this.client.send(new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: { Objects: batch.map(Key => ({ Key })) },
      }));
    }
  }

  getUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }

  async list(prefix: string): Promise<string[]> {
    const keys: string[] = [];
    let continuationToken: string | undefined;

    do {
      const response = await this.client.send(new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }));
      keys.push(...(response.Contents?.map(obj => obj.Key!).filter(Boolean) ?? []));
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return keys;
  }
}
```

### Local Filesystem Implementation (Development)

```typescript
// lib/storage/local.ts

import fs from 'fs/promises';
import path from 'path';
import type { StorageProvider } from './types';

export class LocalStorageProvider implements StorageProvider {
  private basePath: string;
  private publicPrefix: string;

  constructor() {
    this.basePath = path.join(process.cwd(), 'public', 'uploads');
    this.publicPrefix = '/uploads';
  }

  async upload(key: string, data: Buffer, _contentType: string): Promise<string> {
    const filePath = path.join(this.basePath, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data);
    return this.getUrl(key);
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.basePath, key);
    await fs.unlink(filePath).catch(() => {});
  }

  async deleteMany(keys: string[]): Promise<void> {
    await Promise.allSettled(keys.map(key => this.delete(key)));
  }

  getUrl(key: string): string {
    return `${this.publicPrefix}/${key}`;
  }

  async list(prefix: string): Promise<string[]> {
    const dirPath = path.join(this.basePath, prefix);
    try {
      const entries = await fs.readdir(dirPath, { recursive: true, withFileTypes: true });
      return entries
        .filter(e => e.isFile())
        .map(e => path.join(prefix, e.parentPath?.replace(dirPath, '') ?? '', e.name).replace(/\\/g, '/'));
    } catch {
      return [];
    }
  }
}
```

### Provider Factory

```typescript
// lib/storage/index.ts

import type { StorageProvider } from './types';

let _provider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (_provider) return _provider;

  if (process.env.STORAGE_PROVIDER === 'local' || process.env.NODE_ENV === 'development') {
    const { LocalStorageProvider } = require('./local');
    _provider = new LocalStorageProvider();
  } else {
    const { R2StorageProvider } = require('./r2');
    _provider = new R2StorageProvider();
  }

  return _provider;
}
```

---

## 6. Authentication Strategy

### V1: Middleware Token Check

Simple, zero-dependency authentication for initial launch. The admin provides a token via environment variable. All mutation routes and `/admin/*` pages check for it.

#### Middleware

```typescript
// middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

const PROTECTED_PATHS = ['/admin'];
const PROTECTED_API_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin pages
  const isAdminPage = PROTECTED_PATHS.some(p => pathname.startsWith(p));

  // Protect mutation API routes
  const isApiMutation = pathname.startsWith('/api/') && PROTECTED_API_METHODS.includes(request.method);

  if (!isAdminPage && !isApiMutation) {
    return NextResponse.next();
  }

  // Check for token in cookie (admin pages) or Authorization header (API)
  const cookieToken = request.cookies.get('admin_token')?.value;
  const headerToken = request.headers.get('Authorization')?.replace('Bearer ', '');
  const token = headerToken || cookieToken;

  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    if (isAdminPage) {
      // Redirect to login page
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
```

#### Login Flow

1. `/login` page presents a password field.
2. User submits token.
3. POST `/api/auth/login` validates token against `ADMIN_TOKEN` env var.
4. On success, sets `admin_token` cookie (HttpOnly, Secure, SameSite=Strict, 30-day expiry).
5. Redirects to `/admin`.

### V2: Auth.js (Future)

When the application needs multi-user support or more robust auth:

- **Providers:** Google OAuth, GitHub OAuth, Email magic link
- **Session strategy:** JWT (no session table needed — keeps Turso costs low)
- **Role model:** Single `admin` role. The first user to sign in (or a configured email allowlist in env vars) gets admin. All others are public viewers.
- **Migration path:** Replace the middleware token check with Auth.js `auth()` calls. The admin cookie approach naturally extends to session cookies.

---

## 7. Caching Strategy

### Image Caching

| Layer | Strategy | TTL |
|-------|----------|-----|
| R2 / Cloudflare CDN | `Cache-Control: public, max-age=31536000, immutable` on all WebP variants | 1 year |
| Browser | Respects Cache-Control headers, stores in disk cache | 1 year |
| Original files | `Cache-Control: public, max-age=86400` | 1 day |

Images are immutable — their URL includes the photo UUID. If a photo is re-processed, it gets a new UUID (delete old, create new). No cache busting is needed.

### Page Caching (ISR)

| Page | Revalidation | Strategy |
|------|-------------|----------|
| `/` (Home/Hero) | 60 seconds | ISR with `revalidate: 60` |
| `/albums` (Album list) | 60 seconds | ISR with `revalidate: 60` |
| `/albums/[slug]` (Album detail) | 60 seconds | ISR with `revalidate: 60` |
| `/admin/*` | 0 (no cache) | `dynamic = 'force-dynamic'` |

On-demand revalidation: After any admin mutation (create/update/delete album or photo), the API route calls `revalidatePath('/')` and `revalidatePath('/albums/[slug]')` to purge stale ISR pages.

### API Caching

| Endpoint | Strategy |
|----------|----------|
| `GET /api/albums` | `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` |
| `GET /api/albums/[slug]` | `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` |
| `GET /api/hero` | `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` |
| `GET /api/slideshow` | `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` |
| `GET /api/config` | `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` |
| All mutation endpoints | `Cache-Control: no-store` |

### BlurHash Strategy

BlurHash strings are stored in the database and included inline in every photo response and Server Component render. There is no separate fetch — the BlurHash is available before any image loads.

---

## 8. Error Handling

### Upload Failure & Cleanup

Upload is the most failure-prone operation. The strategy is **best-effort cleanup with eventual consistency**.

```
Upload Flow with Error Handling:

1. Receive files ---------> Validation error? Return 400 immediately.
2. Process with Sharp ----> Processing error?
                              a. Log error with file details
                              b. Skip this file, continue with others
                              c. Include in response: { partial: true, failed: [...] }
3. Upload to R2 ----------> R2 error?
                              a. Retry once with exponential backoff
                              b. If still failing, clean up any variants already uploaded
                              c. Skip this file, include in failed list
4. Insert DB row ---------> DB error?
                              a. Clean up R2 objects for this photo
                              b. Retry once
                              c. Skip this file, include in failed list
5. Return response -------> Include both succeeded and failed photos
```

**Partial success response (201):**
```json
{
  "photos": [ /* successfully created photos */ ],
  "failed": [
    {
      "originalFilename": "DSC_4521.jpg",
      "error": "Processing failed: unsupported color space",
      "code": "PROCESSING_FAILED"
    }
  ]
}
```

### Orphaned R2 Objects

If the server crashes between R2 upload and DB insert, orphaned objects may remain. A scheduled cleanup job (run manually or via cron) lists all R2 keys and removes any not referenced in the database. This is a V2 concern — the volume is low enough to ignore initially.

### Database Errors (Turso)

```typescript
// lib/db/client.ts

import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// Drizzle wraps this client. Turso's HTTP client handles reconnection automatically.
// For transient errors (network timeouts), retry up to 3 times with backoff: 100ms, 500ms, 2000ms.
```

Turso's HTTP transport is stateless — no persistent connections to manage. Transient failures are retried at the fetch level.

### Client-Side Error Boundaries

```typescript
// app/error.tsx — root error boundary
// app/admin/error.tsx — admin error boundary
// app/albums/[slug]/error.tsx — album page error boundary

// Each error boundary:
// 1. Catches rendering errors
// 2. Displays user-friendly message
// 3. Offers "Try Again" button (calls reset())
// 4. Logs error to console (and optionally to external service in V2)
```

### API Error Response Format

All API errors use this consistent shape:

```typescript
interface ApiErrorResponse {
  error: string;       // Human-readable: "Album not found"
  code: string;        // Machine-readable: "ALBUM_NOT_FOUND"
  details?: unknown;   // Optional: { field: "title", message: "Must be non-empty" }
}
```

Utility function for route handlers:

```typescript
// lib/api/response.ts

export function apiError(
  message: string,
  code: string,
  status: number,
  details?: unknown
): NextResponse {
  return NextResponse.json(
    { error: message, code, ...(details !== undefined && { details }) },
    { status }
  );
}

export function apiSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}
```

---

## 9. Performance Considerations

### Lazy Loading

All gallery images use native `loading="lazy"`:

```tsx
<img
  src={photo.urls.thumb}
  loading="lazy"
  decoding="async"
  alt={photo.caption || ''}
  width={photo.width}
  height={photo.height}
  style={{ aspectRatio: `${photo.width}/${photo.height}` }}
/>
```

The first row of images (above the fold) use `loading="eager"` and `fetchpriority="high"`.

### Responsive Images (srcset)

```tsx
<img
  src={photo.urls.display}
  srcSet={`${photo.urls.thumb} 400w, ${photo.urls.display} 1600w, ${photo.urls.full} 2400w`}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  loading="lazy"
  decoding="async"
  alt={photo.caption || ''}
/>
```

Context-dependent usage:
- **Gallery grid:** sizes based on column count; browser picks thumb or display.
- **Lightbox:** `sizes="100vw"` — browser picks display or full.
- **Slideshow:** explicit `src={photo.urls.full}` for maximum quality.

### Slideshow Preloading

```typescript
// Preload next N images during slideshow
const PRELOAD_COUNT = 2;

function preloadImages(photos: Photo[], currentIndex: number): void {
  for (let i = 1; i <= PRELOAD_COUNT; i++) {
    const nextIndex = (currentIndex + i) % photos.length;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = photos[nextIndex].urls.display;
    document.head.appendChild(link);
  }
}
```

### Database Query Optimization

Key queries and their index usage:

| Query | Used Index |
|-------|-----------|
| `SELECT * FROM album WHERE slug = ?` | `album_slug_idx` (unique, O(1)) |
| `SELECT * FROM album WHERE is_public = 1 ORDER BY sort_order` | `album_is_public_idx` + `album_sort_order_idx` |
| `SELECT * FROM album WHERE is_hero = 1` | `album_is_hero_idx` |
| `SELECT * FROM photo WHERE album_id = ? ORDER BY sort_order` | `photo_sort_order_idx` (composite, covers both filter and sort) |

All public page loads require at most 2 queries: one for album(s), one for photos. No N+1 problems.

### Bundle Size

| Concern | Mitigation |
|---------|-----------|
| Sharp (47MB) | Server-only import; never reaches client bundle. Use `import('sharp')` in route handlers only. |
| @aws-sdk/client-s3 (~1MB) | Server-only; only imported in storage provider. |
| exifr (client EXIF) | Tree-shake to `exifr/dist/mini.esm.mjs` (~15KB gzipped) — only GPS, camera, lens, exposure |
| blurhash (client) | ~3KB gzipped |
| Drizzle ORM | Server-only |
| Total client JS target | < 80KB gzipped for initial page load |

---

## 10. Deployment Architecture

### Vercel Configuration

No `vercel.json` is required for standard Next.js 15 deployment. However, set the following:

**Build settings:**
- Framework preset: Next.js
- Build command: `next build`
- Output directory: `.next`
- Node.js version: 20.x

**Serverless function configuration** (in `next.config.ts`):

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const config: NextConfig = {
  images: {
    unoptimized: true,           // We handle optimization ourselves via Sharp + R2
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',     // Allow large photo uploads
    },
  },
};

export default config;
```

Route handler configuration for upload endpoints:

```typescript
// app/api/albums/[albumId]/photos/route.ts
export const runtime = 'nodejs';          // Required for Sharp
export const maxDuration = 60;            // 60s timeout for processing multiple images
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `TURSO_URL` | Turso database HTTP URL | `libsql://mydb-myorg.turso.io` |
| `TURSO_AUTH_TOKEN` | Turso authentication token | `eyJ...` |
| `R2_ENDPOINT` | Cloudflare R2 S3-compatible endpoint | `https://{accountId}.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY` | R2 API token access key ID | `abc123...` |
| `R2_SECRET_KEY` | R2 API token secret access key | `xyz789...` |
| `R2_BUCKET` | R2 bucket name | `pmf-photos` |
| `R2_PUBLIC_URL` | Public URL for R2 bucket (custom domain or r2.dev) | `https://photos.yourdomain.com` |
| `ADMIN_TOKEN` | V1 admin authentication token | `some-long-random-string` |
| `STORAGE_PROVIDER` | Storage backend (optional, auto-detects) | `r2` or `local` |
| `NEXT_PUBLIC_SITE_URL` | Public site URL | `https://yourdomain.com` |

All secrets are stored in Vercel's environment variable settings (encrypted). Never committed to source.

### Database Migration Strategy

Using Drizzle Kit for schema management:

```typescript
// drizzle.config.ts

import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'turso',
  dbCredentials: {
    url: process.env.TURSO_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
} satisfies Config;
```

**Migration workflow:**

```bash
# Generate migration from schema changes
npx drizzle-kit generate

# Review generated SQL in ./drizzle/
# Apply to production
npx drizzle-kit push

# Seed initial site_config row (run once)
npx tsx scripts/seed.ts
```

**Seed script (`scripts/seed.ts`):**
```typescript
import { db } from '../lib/db';
import { siteConfig } from '../lib/db/schema';

async function seed() {
  await db.insert(siteConfig).values({ id: 1 }).onConflictDoNothing();
  console.log('Seeded site_config');
}

seed();
```

### R2 Bucket Setup

1. Log in to Cloudflare Dashboard.
2. Navigate to R2 Object Storage.
3. Create bucket named `pmf-photos`.
4. Enable public access:
   - Settings > Public access > Allow Access.
   - Note the `r2.dev` subdomain or configure custom domain.
5. (Optional) Custom domain:
   - Settings > Custom Domains > Add domain.
   - Add `photos.yourdomain.com` as CNAME to the R2 public URL.
   - Cloudflare handles TLS automatically.
6. Configure CORS:
   ```json
   [
     {
       "AllowedOrigins": ["https://yourdomain.com", "http://localhost:3000"],
       "AllowedMethods": ["GET"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 86400
     }
   ]
   ```
7. Create API token:
   - R2 > Manage R2 API Tokens > Create API Token.
   - Permissions: Object Read & Write.
   - Scope: Specific bucket (`pmf-photos`).
   - Copy Access Key ID and Secret Access Key to Vercel env vars.

### Domain and DNS

For Vercel:
1. Add custom domain in Vercel project settings.
2. Configure DNS: CNAME `yourdomain.com` to `cname.vercel-dns.com`.
3. Vercel provisions TLS automatically.

For R2 CDN:
1. CNAME `photos.yourdomain.com` to the R2 public bucket URL.
2. Cloudflare provisions TLS automatically (domain must be on Cloudflare DNS).

---

## 11. Directory Structure

```
poor-mans-flicker/
|
+-- app/
|   +-- (public)/                          # Route group: public pages (no layout prefix)
|   |   +-- layout.tsx                     # Public layout: nav, footer, theme
|   |   +-- page.tsx                       # Home page: hero carousel + featured albums
|   |   +-- albums/
|   |   |   +-- page.tsx                   # Album listing grid
|   |   |   +-- [slug]/
|   |   |       +-- page.tsx               # Album detail: photo grid
|   |   |       +-- slideshow/
|   |   |           +-- page.tsx           # Fullscreen slideshow for album
|   |   +-- about/
|   |       +-- page.tsx                   # About/bio page (static)
|   |
|   +-- admin/
|   |   +-- layout.tsx                     # Admin layout: sidebar nav, auth check
|   |   +-- page.tsx                       # Admin dashboard: overview stats
|   |   +-- albums/
|   |   |   +-- page.tsx                   # Album management list
|   |   |   +-- new/
|   |   |   |   +-- page.tsx               # Create album form
|   |   |   +-- [id]/
|   |   |       +-- page.tsx               # Edit album: photos grid, upload, reorder
|   |   +-- settings/
|   |       +-- page.tsx                   # Site configuration form
|   |
|   +-- login/
|   |   +-- page.tsx                       # Login form (V1: token entry)
|   |
|   +-- api/
|   |   +-- auth/
|   |   |   +-- login/
|   |   |       +-- route.ts               # POST: validate token, set cookie
|   |   +-- albums/
|   |   |   +-- route.ts                   # GET: list albums, POST: create album
|   |   |   +-- reorder/
|   |   |   |   +-- route.ts               # PUT: reorder albums
|   |   |   +-- [id]/
|   |   |       +-- route.ts               # PATCH: update album, DELETE: delete album
|   |   |       +-- cover/
|   |   |       |   +-- route.ts           # PUT: set cover photo
|   |   |       +-- photos/
|   |   |           +-- route.ts           # POST: upload photos
|   |   |           +-- reorder/
|   |   |               +-- route.ts       # PUT: reorder photos
|   |   +-- photos/
|   |   |   +-- [id]/
|   |   |   |   +-- route.ts              # PATCH: update caption, DELETE: delete photo
|   |   |   +-- bulk/
|   |   |       +-- route.ts              # DELETE: bulk delete photos
|   |   +-- hero/
|   |   |   +-- route.ts                  # GET: hero carousel photos
|   |   +-- slideshow/
|   |   |   +-- route.ts                  # GET: slideshow photos
|   |   +-- config/
|   |       +-- route.ts                  # GET: site config, PATCH: update config
|   |
|   +-- layout.tsx                         # Root layout: html, body, fonts, metadata
|   +-- globals.css                        # Tailwind imports + global styles
|   +-- error.tsx                          # Root error boundary
|   +-- not-found.tsx                      # 404 page
|
+-- components/
|   +-- ui/                                # Reusable UI primitives
|   |   +-- button.tsx
|   |   +-- input.tsx
|   |   +-- dialog.tsx
|   |   +-- dropdown-menu.tsx
|   |   +-- skeleton.tsx
|   |   +-- toast.tsx
|   +-- gallery/
|   |   +-- photo-grid.tsx                 # Responsive masonry/grid layout
|   |   +-- photo-card.tsx                 # Single photo tile with blurhash placeholder
|   |   +-- album-card.tsx                 # Album cover tile for album list
|   |   +-- lightbox.tsx                   # Full-screen photo viewer overlay
|   |   +-- slideshow.tsx                  # Slideshow player (fullscreen, auto-advance)
|   |   +-- hero-carousel.tsx             # Home page hero image carousel
|   |   +-- blurhash-image.tsx            # <img> wrapper with BlurHash placeholder
|   +-- admin/
|   |   +-- album-form.tsx                 # Create/edit album form
|   |   +-- photo-uploader.tsx             # Drag-and-drop multi-file upload
|   |   +-- photo-manager.tsx             # Photo grid with select, reorder, delete
|   |   +-- sortable-list.tsx             # Drag-and-drop reorderable list (albums or photos)
|   |   +-- settings-form.tsx             # Site configuration form
|   +-- layout/
|       +-- header.tsx                     # Site header/nav
|       +-- footer.tsx                     # Site footer
|       +-- admin-sidebar.tsx             # Admin navigation sidebar
|
+-- lib/
|   +-- db/
|   |   +-- schema.ts                     # Drizzle schema definitions (all tables)
|   |   +-- index.ts                      # Database client initialization
|   |   +-- queries/
|   |       +-- albums.ts                 # Album query functions (getAlbums, getAlbumBySlug, etc.)
|   |       +-- photos.ts                # Photo query functions
|   |       +-- config.ts                # SiteConfig query functions
|   +-- storage/
|   |   +-- types.ts                      # StorageProvider interface
|   |   +-- r2.ts                         # R2 implementation
|   |   +-- local.ts                      # Local filesystem implementation
|   |   +-- index.ts                      # Provider factory
|   +-- images/
|   |   +-- process.ts                    # Sharp processing pipeline
|   |   +-- variants.ts                   # Variant definitions (dimensions, quality)
|   |   +-- blurhash.ts                   # Server-side BlurHash generation (fallback)
|   |   +-- exif.ts                       # EXIF normalization utility
|   +-- api/
|   |   +-- response.ts                   # apiError(), apiSuccess() helpers
|   |   +-- validate.ts                   # Request validation utilities (zod schemas)
|   +-- utils/
|       +-- slug.ts                        # Slug generation from title
|       +-- id.ts                          # UUID generation
|       +-- url.ts                         # Photo URL builder
|
+-- hooks/
|   +-- use-upload.ts                      # Upload state management hook
|   +-- use-slideshow.ts                  # Slideshow playback hook
|   +-- use-lightbox.ts                   # Lightbox open/close/navigate hook
|
+-- workers/
|   +-- image-processor.ts                # Web Worker for client-side image resize + blurhash
|
+-- drizzle/
|   +-- 0000_initial.sql                   # Generated migration: create tables
|   +-- meta/                              # Drizzle Kit metadata
|
+-- scripts/
|   +-- seed.ts                            # Database seed script
|
+-- public/
|   +-- uploads/                           # Local storage (dev only, gitignored)
|   +-- favicon.ico
|   +-- og-image.jpg                       # Open Graph default image
|
+-- .env.local                             # Local environment variables (gitignored)
+-- .env.example                           # Template for required env vars
+-- .gitignore
+-- drizzle.config.ts                      # Drizzle Kit configuration
+-- middleware.ts                           # Auth middleware
+-- next.config.ts                         # Next.js configuration
+-- package.json
+-- tailwind.config.ts                     # Tailwind configuration
+-- tsconfig.json                          # TypeScript configuration
+-- postcss.config.mjs                     # PostCSS configuration (for Tailwind)
```

### Key Conventions

- **Route groups:** `(public)` groups public pages without affecting URL paths.
- **Route parameters:** `[slug]` for public album access (human-readable), `[id]` for admin operations (UUID).
- **Server vs. Client Components:** All components are Server Components by default. Add `'use client'` directive only for components that need interactivity (lightbox, slideshow, upload, sortable lists, forms with state).
- **Data fetching:** Server Components call `lib/db/queries/*` directly. Client Components fetch from `/api/*` routes.
- **Colocation:** API route handlers are thin — they validate, call query/mutation functions from `lib/`, and return responses. Business logic lives in `lib/`.

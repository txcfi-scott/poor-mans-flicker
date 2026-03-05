# Poor Man's Flickr -- Development Plan

**Version:** 1.0
**Date:** 2026-03-05
**Status:** Draft

---

## Table of Contents

1. [Phase Breakdown](#1-phase-breakdown)
2. [Task Details](#2-task-details)
3. [File Manifest](#3-file-manifest)
4. [Dependency Graph](#4-dependency-graph)
5. [Risk Register](#5-risk-register)
6. [Definition of Done](#6-definition-of-done)

---

## 1. Phase Breakdown

### Phase 1: Project Scaffold

**Goal:** Standing Next.js 15 app with database connectivity, R2 abstraction, and foundational project structure. Nothing user-visible yet -- just verified plumbing.

**Tasks:** P1-T1 through P1-T8

**Dependencies:** None (first phase)

**Acceptance Criteria:**
- `npm run dev` starts the app on localhost:3000 without errors
- Drizzle schema compiles and `drizzle-kit push` creates tables in Turso
- A test script can write to and read from R2 via the abstraction layer
- Tailwind utility classes render correctly in a throwaway test page
- TypeScript strict mode enabled with zero type errors
- ESLint passes with zero warnings

**Estimated Complexity:** M

---

### Phase 2: Image Pipeline

**Goal:** Complete image upload, processing, and deletion flow. A photo can be uploaded via API, processed into three size variants with BlurHash, stored in R2, and deleted cleanly.

**Tasks:** P2-T1 through P2-T7

**Dependencies:** Phase 1 complete

**Acceptance Criteria:**
- Uploading a 6000x4000 JPEG via the API endpoint produces three variants in R2: `thumb` (320px short edge), `display` (1600px long edge), `full` (2400px long edge)
- Each photo record in the database contains width, height, aspect ratio, BlurHash string, EXIF data (camera, lens, ISO, shutter speed, aperture, focal length, date taken), and R2 key prefixes
- Client-side pre-resize reduces a 20MB photo to under 4MB before upload begins
- Deleting a photo removes all three R2 objects and the database row
- Uploading a PNG or WebP succeeds (converted to JPEG during processing)
- Uploading a non-image file returns a 400 error with descriptive message
- EXIF GPS data is stripped from all stored variants

**Estimated Complexity:** L

---

### Phase 3: Admin -- Album Management

**Goal:** Admin can create, edit, delete, and reorder albums. One album can be designated as the hero album.

**Tasks:** P3-T1 through P3-T5

**Dependencies:** Phase 1 complete (Phase 2 not required -- albums are independent of photos at this stage)

**Acceptance Criteria:**
- Admin can create an album with a title, description, and optional slug
- Admin can edit album title, description, and slug
- Admin can delete an album; all photos in the album are also deleted (with R2 cleanup)
- Admin can reorder albums via drag-and-drop; order persists across page reloads
- Exactly one album can be flagged as hero; setting a new hero unsets the previous one
- Album list dashboard displays all albums with photo count, cover thumbnail, and creation date
- Slug auto-generates from title if not provided; slug is unique

**Estimated Complexity:** M

---

### Phase 4: Admin -- Photo Management

**Goal:** Admin can upload photos to albums, manage photo metadata, reorder photos within albums, and perform bulk operations.

**Tasks:** P4-T1 through P4-T6

**Dependencies:** Phase 2 complete, Phase 3 complete

**Acceptance Criteria:**
- Drag-and-drop upload zone accepts multiple files; each shows individual progress bar
- Upload queue processes files sequentially (to avoid overwhelming the server)
- Photo grid displays all photos in an album with thumbnails at correct aspect ratios
- Admin can drag to reorder photos; order persists across page reloads
- Admin can set any photo as the album cover; cover photo displays on the album list
- Admin can edit a photo's caption (title + description)
- Admin can select multiple photos via checkbox and delete them in bulk
- After bulk delete, all R2 objects for deleted photos are removed

**Estimated Complexity:** L

---

### Phase 5: Public Gallery

**Goal:** Visitors can browse albums and view photos in a responsive, visually polished gallery. Hero shots cycle on the landing page.

**Tasks:** P5-T1 through P5-T6

**Dependencies:** Phase 4 complete (needs albums with photos to display)

**Acceptance Criteria:**
- Landing page displays the site title, a brief description, and a hero image that crossfades to the next hero album photo every 8 seconds
- Albums index page shows all non-empty albums as cards with cover photo, title, photo count, and description excerpt
- Album detail page shows a justified/masonry photo grid that preserves aspect ratios
- BlurHash placeholder is visible for each photo while the actual image loads
- Clicking a photo opens a lightbox with the display-size image, caption overlay, and left/right navigation
- Lightbox supports keyboard navigation (left/right arrows, Escape to close)
- Lightbox supports swipe gestures on touch devices
- All pages are responsive: single-column on mobile, multi-column on desktop
- Pages load with no layout shift (CLS < 0.1) due to pre-calculated aspect ratios and BlurHash

**Estimated Complexity:** L

---

### Phase 6: Slideshow Engine

**Goal:** Fullscreen slideshow player with transitions, controls, and playlist support. Admin can build playlists from albums/photos.

**Tasks:** P6-T1 through P6-T6

**Dependencies:** Phase 5 complete (needs gallery and lightbox as foundation)

**Acceptance Criteria:**
- Slideshow launches in fullscreen (Fullscreen API) with a single click from album or playlist
- Crossfade transition between photos with configurable duration (3s, 5s, 8s, 12s)
- Ken Burns effect (slow pan/zoom) active by default, toggleable off
- On-screen controls: play/pause, next/previous, speed, Ken Burns toggle, exit
- Controls auto-hide after 3 seconds of no mouse movement; reappear on movement
- Keyboard controls: Space (play/pause), Left/Right (prev/next), Escape (exit), F (fullscreen toggle)
- Touch controls: tap left/right edge for prev/next, tap center for play/pause, swipe up to exit
- Playlist model: a named collection of photos drawn from one or more albums, with custom order
- Admin UI to create playlists: select albums, pick individual photos, drag to reorder
- Slideshow can be launched from an album (plays all photos in album order) or from a playlist
- Photo preloading: next 2 photos are loaded in background during current display

**Estimated Complexity:** L

---

### Phase 7: Polish and Auth

**Goal:** Admin authentication, site settings, and comprehensive UX polish.

**Tasks:** P7-T1 through P7-T7

**Dependencies:** Phases 3, 4, 5, 6 complete

**Acceptance Criteria:**
- All `/admin` routes are protected by middleware; unauthenticated requests redirect to `/admin/login`
- Login page accepts a password; validated against `ADMIN_TOKEN` environment variable via server action
- Session persists via an HTTP-only cookie with 7-day expiry
- Admin can log out; cookie is cleared
- Site settings page allows editing: site title, site description, hero cycle interval, slideshow default duration
- Settings are stored in the database and read by all pages via a cached query
- Every page has appropriate loading states (skeleton screens, not spinners)
- Every page has appropriate error states (error.tsx boundaries with retry)
- Every page has appropriate empty states (no albums yet, no photos in album, etc.)
- All interactive elements have visible focus indicators for keyboard navigation
- All images have alt text (caption if available, "Photo in [album name]" as fallback)
- Mobile: all admin functions work on a 375px-wide viewport without horizontal scroll
- Lighthouse performance score >= 90 on the public landing page (with populated data)

**Estimated Complexity:** M

---

### Phase 8: Deployment

**Goal:** Production deployment on Vercel with Turso production database, R2 production bucket, and custom domain.

**Tasks:** P8-T1 through P8-T6

**Dependencies:** Phase 7 complete

**Acceptance Criteria:**
- App deploys to Vercel via `git push` with zero build errors
- Production environment variables are set in Vercel dashboard (Turso URL/token, R2 credentials, admin token, site URL)
- Production Turso database is created and schema is pushed
- Production R2 bucket is created with appropriate CORS policy
- Custom domain resolves to the Vercel deployment with HTTPS
- Smoke test passes: can log in, create album, upload photo, view public gallery, run slideshow, delete photo, delete album

**Estimated Complexity:** S

---

## 2. Task Details

### Phase 1: Project Scaffold

#### P1-T1: Initialize Next.js Project

**Description:** Create Next.js 15 project with App Router, TypeScript, Tailwind CSS, and ESLint. Configure `tsconfig.json` for strict mode. Set up path aliases (`@/` for `src/`).

**Files to create:**
- `package.json`
- `next.config.ts`
- `tsconfig.json`
- `tailwind.config.ts`
- `postcss.config.mjs`
- `src/app/layout.tsx` (root layout)
- `src/app/page.tsx` (placeholder home)
- `src/app/globals.css`
- `.gitignore`
- `.env.local.example`

**Dependencies:** None

**Acceptance Criteria:**
- `npm run dev` starts without errors
- `npm run build` completes without errors
- TypeScript strict mode is enabled
- `@/` path alias resolves to `src/`
- Tailwind classes render correctly

**Complexity:** S

---

#### P1-T2: Configure Turso + Drizzle ORM

**Description:** Install Drizzle ORM with `@libsql/client`. Create the database client singleton. Configure `drizzle-kit` for migrations/push.

**Files to create:**
- `src/lib/db/index.ts` (Drizzle client singleton)
- `src/lib/db/schema.ts` (empty schema file, tables added later)
- `drizzle.config.ts`

**Dependencies:** P1-T1

**Acceptance Criteria:**
- `@libsql/client` connects to Turso using `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` env vars
- Drizzle client exports a `db` singleton
- `npx drizzle-kit push` runs without error against a Turso database

**Complexity:** S

---

#### P1-T3: Define Database Schema

**Description:** Define all Drizzle tables: `albums`, `photos`, `playlists`, `playlist_photos`, `site_settings`. Include all columns, indexes, and relations.

**Files to modify:**
- `src/lib/db/schema.ts`

**Dependencies:** P1-T2

**Acceptance Criteria:**
- `albums` table: `id` (text PK, nanoid), `title`, `description`, `slug` (unique), `isHero` (boolean), `coverPhotoId` (nullable FK), `sortOrder` (integer), `createdAt`, `updatedAt`
- `photos` table: `id` (text PK, nanoid), `albumId` (FK), `caption`, `description`, `width`, `height`, `aspectRatio` (real), `blurHash`, `r2Key` (text, prefix for variants), `exifCamera`, `exifLens`, `exifIso`, `exifShutter`, `exifAperture`, `exifFocalLength`, `exifDateTaken`, `sortOrder` (integer), `createdAt`, `updatedAt`
- `playlists` table: `id` (text PK), `title`, `description`, `sortOrder`, `createdAt`, `updatedAt`
- `playlist_photos` table: `id` (text PK), `playlistId` (FK), `photoId` (FK), `sortOrder`
- `site_settings` table: `key` (text PK), `value` (text)
- All foreign keys have `ON DELETE CASCADE`
- `drizzle-kit push` creates all tables without error

**Complexity:** M

---

#### P1-T4: R2 Storage Abstraction

**Description:** Create an abstraction layer over Cloudflare R2 using the S3-compatible API (`@aws-sdk/client-s3`). Provide functions for upload, download URL generation, deletion, and listing by prefix.

**Files to create:**
- `src/lib/storage/r2.ts`

**Dependencies:** P1-T1

**Acceptance Criteria:**
- `uploadToR2(key: string, body: Buffer, contentType: string)` uploads an object
- `getR2Url(key: string)` returns the public URL for an object
- `deleteFromR2(key: string)` deletes a single object
- `deleteByPrefix(prefix: string)` deletes all objects sharing a key prefix
- All functions use env vars: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`
- Errors are caught and re-thrown with descriptive messages

**Complexity:** S

---

#### P1-T5: Shared Types and Constants

**Description:** Define shared TypeScript types, constants, and utility functions used across the codebase.

**Files to create:**
- `src/lib/types.ts` (shared types not covered by Drizzle inference)
- `src/lib/constants.ts` (image sizes, BlurHash dimensions, accepted MIME types, etc.)
- `src/lib/utils.ts` (nanoid generator, slug generator, format helpers)

**Dependencies:** P1-T1

**Acceptance Criteria:**
- Image variant sizes defined: `THUMB_SIZE: 320`, `DISPLAY_SIZE: 1600`, `FULL_SIZE: 2400`
- Accepted MIME types: `image/jpeg`, `image/png`, `image/webp`
- Max upload size constant: `20MB` (pre-resize target: `4MB`)
- `generateId()` returns a 21-char nanoid
- `generateSlug(title: string)` returns a URL-safe slug

**Complexity:** S

---

#### P1-T6: Tailwind Theme and Base Styles

**Description:** Configure Tailwind with a dark-first photography theme. Set up custom colors, typography, and base component styles.

**Files to modify:**
- `tailwind.config.ts`
- `src/app/globals.css`

**Dependencies:** P1-T1

**Acceptance Criteria:**
- Dark background (`#0a0a0a` or similar near-black) as default
- Light text for contrast against dark backgrounds
- Accent color defined for interactive elements
- Smooth transitions configured as Tailwind utilities
- Font stack configured (system fonts, no external font loading)
- Scrollbar styled to match dark theme

**Complexity:** S

---

#### P1-T7: Project Directory Structure

**Description:** Create the directory structure and placeholder files for all major modules.

**Files to create:**
- `src/app/admin/layout.tsx`
- `src/app/admin/page.tsx`
- `src/app/(public)/layout.tsx`
- `src/app/(public)/page.tsx`
- `src/components/ui/` (empty directory marker)
- `src/lib/actions/` (empty directory marker)
- `src/lib/queries/` (empty directory marker)
- `src/hooks/` (empty directory marker)

**Dependencies:** P1-T1

**Acceptance Criteria:**
- Admin routes live under `src/app/admin/`
- Public routes live under `src/app/(public)/`
- Route groups are used to separate admin and public layouts
- Each directory has at least a placeholder file so git tracks it

**Complexity:** S

---

#### P1-T8: Environment Variable Validation

**Description:** Create a runtime validation module that checks all required environment variables at startup and provides clear error messages for missing ones.

**Files to create:**
- `src/lib/env.ts`

**Dependencies:** P1-T1

**Acceptance Criteria:**
- Validates presence of: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`, `ADMIN_TOKEN`
- Throws a descriptive error at import time if any required variable is missing
- Exports typed env object: `env.TURSO_DATABASE_URL`, etc.
- `.env.local.example` contains all variables with placeholder values and comments

**Complexity:** S

---

### Phase 2: Image Pipeline

#### P2-T1: Sharp Image Processing Service

**Description:** Server-side module that takes a raw image buffer, produces three sized JPEG variants (thumb, display, full), generates a BlurHash, and strips EXIF GPS data while preserving other EXIF.

**Files to create:**
- `src/lib/images/process.ts`

**Dependencies:** P1-T4, P1-T5

**Acceptance Criteria:**
- `processImage(buffer: Buffer)` returns `{ thumb: Buffer, display: Buffer, full: Buffer, blurHash: string, width: number, height: number, aspectRatio: number }`
- Thumb variant: 320px on the short edge, JPEG quality 80
- Display variant: 1600px on the long edge, JPEG quality 85
- Full variant: 2400px on the long edge, JPEG quality 90
- If the original is smaller than a variant size, that variant uses the original dimensions (no upscaling)
- BlurHash is generated from a 32x32 downscaled version of the image
- All variants have EXIF GPS data stripped
- Output is always JPEG regardless of input format
- Processing a 6000x4000 JPEG completes in under 5 seconds

**Complexity:** M

---

#### P2-T2: EXIF Extraction Utility

**Description:** Server-side utility that extracts photographic EXIF data from an image buffer. Used during upload to populate photo metadata.

**Files to create:**
- `src/lib/images/exif.ts`

**Dependencies:** P1-T1

**Acceptance Criteria:**
- `extractExif(buffer: Buffer)` returns `{ camera, lens, iso, shutterSpeed, aperture, focalLength, dateTaken }` or null fields for missing data
- Camera is formatted as "Make Model" (e.g., "Canon EOS R5")
- Shutter speed is formatted as fraction (e.g., "1/250")
- Aperture is formatted with f-stop prefix (e.g., "f/2.8")
- Focal length includes "mm" suffix (e.g., "85mm")
- Date taken is ISO 8601 string
- Handles images with no EXIF data gracefully (returns object with all null fields)

**Complexity:** S

---

#### P2-T3: Upload API Endpoint

**Description:** Next.js API route that receives an image upload, validates it, processes it through the image pipeline, stores variants in R2, and creates the database record.

**Files to create:**
- `src/app/api/photos/upload/route.ts`

**Dependencies:** P2-T1, P2-T2, P1-T3, P1-T4

**Acceptance Criteria:**
- Accepts POST with `multipart/form-data` containing `file` (image) and `albumId` (string)
- Validates file is an accepted image MIME type
- Validates file size is under 20MB
- Validates albumId references an existing album
- Processes image via Sharp (P2-T1) and extracts EXIF (P2-T2)
- Uploads three variants to R2 with keys: `{albumId}/{photoId}/thumb.jpg`, `{albumId}/{photoId}/display.jpg`, `{albumId}/{photoId}/full.jpg`
- Creates photo record in database with all metadata
- Sets `sortOrder` to max existing order + 1 in the album
- Returns 201 with the created photo object
- Returns 400 for invalid input with descriptive error
- Returns 413 for oversized files
- Returns 500 for processing failures with generic error (no internal details)

**Complexity:** M

---

#### P2-T4: Client-Side Pre-Resize Module

**Description:** Browser-side module using `browser-image-compression` to resize images before upload. Reduces bandwidth and upload time.

**Files to create:**
- `src/lib/images/client-resize.ts`

**Dependencies:** P1-T1

**Acceptance Criteria:**
- `preResizeImage(file: File)` returns a compressed `File` object
- Target: max dimension 4096px, max file size 4MB, JPEG output
- Preserves EXIF orientation
- If the file is already under 4MB, returns it unchanged
- Works in all modern browsers (Chrome, Firefox, Safari)

**Complexity:** S

---

#### P2-T5: Client-Side EXIF Reader

**Description:** Browser-side EXIF reader using `exifr` to extract metadata before upload. Displayed in the upload UI for user confirmation.

**Files to create:**
- `src/lib/images/client-exif.ts`

**Dependencies:** P1-T1

**Acceptance Criteria:**
- `readClientExif(file: File)` returns the same shape as server-side EXIF extraction
- Runs in the browser without server round-trip
- Returns gracefully for images with no EXIF
- Extracts data in under 200ms for a typical photo

**Complexity:** S

---

#### P2-T6: Delete Photo API Endpoint

**Description:** API route to delete a single photo. Removes all R2 variants and the database record.

**Files to create:**
- `src/app/api/photos/[id]/route.ts`

**Dependencies:** P1-T3, P1-T4

**Acceptance Criteria:**
- Accepts DELETE request with photo ID in the URL
- Deletes all three R2 variants (thumb, display, full)
- Deletes the database record
- If the photo was the album cover, sets album `coverPhotoId` to null
- Returns 200 on success
- Returns 404 if photo not found
- R2 deletion failures are logged but do not block the database deletion (eventual consistency acceptable)

**Complexity:** S

---

#### P2-T7: Bulk Delete Photos API Endpoint

**Description:** API route to delete multiple photos at once. Used by the admin bulk-select feature.

**Files to create:**
- `src/app/api/photos/bulk-delete/route.ts`

**Dependencies:** P2-T6

**Acceptance Criteria:**
- Accepts POST with `{ photoIds: string[] }`
- Validates all photoIds exist
- Deletes all R2 variants for all photos
- Deletes all database records in a single transaction
- Updates album covers if any deleted photo was a cover
- Returns 200 with `{ deleted: number }` count
- Maximum 50 photos per request (returns 400 if exceeded)

**Complexity:** S

---

### Phase 3: Admin -- Album Management

#### P3-T1: Album CRUD API Routes

**Description:** API routes for creating, reading, updating, and deleting albums.

**Files to create:**
- `src/app/api/albums/route.ts` (GET list, POST create)
- `src/app/api/albums/[id]/route.ts` (GET single, PATCH update, DELETE)

**Dependencies:** P1-T3

**Acceptance Criteria:**
- POST `/api/albums` creates album with title, description, slug; returns 201 with album object
- GET `/api/albums` returns all albums ordered by `sortOrder`, including photo count and cover photo URL
- GET `/api/albums/[id]` returns single album with photos
- PATCH `/api/albums/[id]` updates title, description, slug, isHero
- DELETE `/api/albums/[id]` deletes album and all its photos (cascade), including R2 cleanup
- Slug auto-generates from title via `generateSlug()` if not provided
- Slug uniqueness is enforced; duplicate returns 409
- Setting `isHero: true` unsets any existing hero album in the same transaction

**Complexity:** M

---

#### P3-T2: Album Reorder API Route

**Description:** API route to update the sort order of all albums in a single request.

**Files to create:**
- `src/app/api/albums/reorder/route.ts`

**Dependencies:** P1-T3

**Acceptance Criteria:**
- Accepts PUT with `{ albumIds: string[] }` representing the desired order
- Updates `sortOrder` for all albums in a single transaction
- Returns 200 on success
- Returns 400 if the provided IDs don't match the existing album set

**Complexity:** S

---

#### P3-T3: Admin Album List Page

**Description:** Admin dashboard page showing all albums in a sortable list with drag-and-drop reordering.

**Files to create:**
- `src/app/admin/albums/page.tsx`
- `src/components/admin/AlbumList.tsx`
- `src/components/admin/AlbumCard.tsx`

**Dependencies:** P3-T1, P3-T2

**Acceptance Criteria:**
- Displays all albums in a vertical list, sorted by `sortOrder`
- Each album card shows: cover thumbnail (or placeholder), title, photo count, creation date, hero badge if applicable
- Drag-and-drop reordering (using `@dnd-kit/core`) persists to the server
- "Create Album" button opens the create/edit form
- Each card has Edit and Delete action buttons
- Delete shows a confirmation dialog before proceeding
- Loading state shows skeleton cards
- Empty state shows "No albums yet" with a create button

**Complexity:** M

---

#### P3-T4: Admin Album Create/Edit Form

**Description:** Form component for creating and editing albums. Used in both create and edit contexts.

**Files to create:**
- `src/app/admin/albums/new/page.tsx`
- `src/app/admin/albums/[id]/edit/page.tsx`
- `src/components/admin/AlbumForm.tsx`

**Dependencies:** P3-T1

**Acceptance Criteria:**
- Fields: title (required), description (optional textarea), slug (auto-generated, editable), hero toggle
- Real-time slug preview as title is typed
- Submit calls POST (create) or PATCH (edit) API
- Success redirects to album list with toast notification
- Validation errors display inline under each field
- Cancel button returns to album list without saving

**Complexity:** S

---

#### P3-T5: Album Server Actions and Queries

**Description:** Server actions and query functions for album operations, to be used by Server Components and client components alike.

**Files to create:**
- `src/lib/actions/albums.ts`
- `src/lib/queries/albums.ts`

**Dependencies:** P1-T3

**Acceptance Criteria:**
- `getAlbums()` returns all albums with photo count and cover URL, ordered by sortOrder
- `getAlbum(id: string)` returns a single album with its photos
- `getAlbumBySlug(slug: string)` returns album by slug (for public routes)
- `getHeroAlbum()` returns the hero album with its photos
- `createAlbum(data)`, `updateAlbum(id, data)`, `deleteAlbum(id)` server actions with revalidation
- All queries use Drizzle's relational query API
- All mutations call `revalidatePath` for affected routes

**Complexity:** S

---

### Phase 4: Admin -- Photo Management

#### P4-T1: Upload UI Component

**Description:** Drag-and-drop upload zone with multi-file support, individual progress tracking, and EXIF preview.

**Files to create:**
- `src/components/admin/PhotoUploader.tsx`
- `src/components/admin/UploadProgress.tsx`
- `src/hooks/usePhotoUpload.ts`

**Dependencies:** P2-T3, P2-T4, P2-T5

**Acceptance Criteria:**
- Drag-and-drop zone accepts image files; also supports click-to-browse
- Accepts multiple files at once
- Each file shows: filename, thumbnail preview, extracted EXIF summary, upload progress bar, status (pending/uploading/complete/error)
- Files are pre-resized client-side before upload (P2-T4)
- Upload queue processes one file at a time to avoid server overload
- Failed uploads show error message with retry button
- Upload progress updates in real-time (using XMLHttpRequest or fetch with ReadableStream)
- Completed uploads add the new photo to the album grid without page reload

**Complexity:** M

---

#### P4-T2: Admin Photo Grid

**Description:** Grid display of all photos in an album with drag-and-drop reordering.

**Files to create:**
- `src/components/admin/PhotoGrid.tsx`
- `src/components/admin/PhotoCard.tsx`

**Dependencies:** P3-T5

**Acceptance Criteria:**
- Displays all photos in the album as a grid of thumbnails
- Grid uses CSS Grid with auto-fill and consistent card sizes
- Each card shows: thumbnail, caption (or "Untitled"), selection checkbox
- Drag-and-drop reordering via `@dnd-kit/sortable`
- Reorder persists to server via API call
- Cards show subtle border/highlight when selected
- Responsive: 4 columns on desktop, 3 on tablet, 2 on mobile

**Complexity:** M

---

#### P4-T3: Photo Reorder API Route

**Description:** API route to update photo sort order within an album.

**Files to create:**
- `src/app/api/albums/[id]/photos/reorder/route.ts`

**Dependencies:** P1-T3

**Acceptance Criteria:**
- Accepts PUT with `{ photoIds: string[] }` for a given album
- Updates `sortOrder` for all photos in the album in a single transaction
- Returns 200 on success
- Returns 400 if photo IDs don't match the album's actual photos

**Complexity:** S

---

#### P4-T4: Set Cover Photo API

**Description:** API to designate a photo as an album's cover.

**Files to create or modify:**
- `src/app/api/albums/[id]/cover/route.ts`

**Dependencies:** P1-T3

**Acceptance Criteria:**
- Accepts PUT with `{ photoId: string }`
- Updates `albums.coverPhotoId` for the given album
- Returns 200 on success
- Returns 404 if album or photo not found
- Returns 400 if photo doesn't belong to the album

**Complexity:** S

---

#### P4-T5: Photo Caption Edit

**Description:** Inline editing for photo captions (title and description).

**Files to create:**
- `src/components/admin/PhotoEditModal.tsx`
- `src/app/api/photos/[id]/route.ts` (PATCH handler -- extend existing file from P2-T6)

**Dependencies:** P2-T6

**Acceptance Criteria:**
- Clicking a photo card's edit button opens a modal
- Modal shows: full thumbnail, editable title field, editable description textarea, EXIF data display (read-only)
- Save button updates via PATCH API and closes modal
- Cancel discards changes
- Changes reflect immediately in the grid without page reload

**Complexity:** S

---

#### P4-T6: Admin Album Detail Page

**Description:** The album management page combining the upload UI, photo grid, and bulk actions.

**Files to create:**
- `src/app/admin/albums/[id]/page.tsx`
- `src/components/admin/BulkActions.tsx`

**Dependencies:** P4-T1, P4-T2, P4-T3, P4-T4, P4-T5

**Acceptance Criteria:**
- Page header shows album title, edit link, photo count
- Upload zone at the top of the page
- Photo grid below the upload zone
- Bulk action bar appears when any photos are selected: "Delete Selected" (with count), "Deselect All"
- "Set as Cover" action appears in each photo card's context menu
- "Select All" / "Deselect All" toggle in the grid header
- Confirmation dialog before bulk delete
- After bulk delete, grid updates without page reload

**Complexity:** M

---

### Phase 5: Public Gallery

#### P5-T1: Landing Page

**Description:** Public landing page with hero image cycling, site title, and navigation to albums.

**Files to create:**
- `src/app/(public)/page.tsx`
- `src/components/public/HeroSection.tsx`
- `src/components/public/HeroCycler.tsx`

**Dependencies:** P3-T5 (needs hero album query)

**Acceptance Criteria:**
- Full-viewport hero section with the current hero photo filling the background (object-fit: cover)
- Photos from the hero album crossfade every 8 seconds (configurable via site settings)
- Site title and tagline overlaid on the hero with text-shadow for readability
- "View Albums" call-to-action button navigates to albums index
- If no hero album is set, hero section shows a solid dark background with the site title
- Hero images are preloaded (next image loads during current display)
- No visible flicker or layout shift during transitions

**Complexity:** M

---

#### P5-T2: Albums Index Page

**Description:** Public page listing all albums as visual cards.

**Files to create:**
- `src/app/(public)/albums/page.tsx`
- `src/components/public/AlbumGrid.tsx`
- `src/components/public/AlbumCard.tsx`

**Dependencies:** P3-T5

**Acceptance Criteria:**
- Displays all non-empty albums as cards in a responsive grid
- Each card shows: cover photo with BlurHash placeholder, album title, photo count, description excerpt (first 120 chars)
- Cards link to the album detail page (`/albums/[slug]`)
- Grid: 3 columns on desktop, 2 on tablet, 1 on mobile
- Albums ordered by `sortOrder`
- Hover effect: subtle zoom on cover photo, title highlight
- Empty state: "No albums to display" (only visible if literally no albums exist)

**Complexity:** S

---

#### P5-T3: Album Detail Page

**Description:** Public page showing all photos in an album in a justified/masonry layout.

**Files to create:**
- `src/app/(public)/albums/[slug]/page.tsx`
- `src/components/public/PhotoGrid.tsx`
- `src/components/public/PhotoTile.tsx`

**Dependencies:** P3-T5

**Acceptance Criteria:**
- Page title shows album name and description
- Photo grid uses justified layout (rows of photos with consistent row heights, varying widths based on aspect ratio)
- Each tile shows the display-size image with BlurHash placeholder during load
- Target row height: 280px on desktop, 200px on mobile
- Grid uses pre-calculated aspect ratios to prevent layout shift
- Clicking a photo opens the lightbox (P5-T4)
- "Back to Albums" link at the top
- Photo count displayed in page header
- Metadata: proper Open Graph tags for sharing (album title, cover photo)

**Complexity:** M

---

#### P5-T4: Lightbox Component

**Description:** Modal image viewer with navigation, captions, and EXIF display.

**Files to create:**
- `src/components/public/Lightbox.tsx`
- `src/components/public/LightboxControls.tsx`
- `src/hooks/useLightbox.ts`

**Dependencies:** P5-T3

**Acceptance Criteria:**
- Opens as a full-viewport modal overlay with dark backdrop
- Displays the display-size image centered and fit within the viewport
- Caption (title + description) displayed below the image
- EXIF data displayed in a subtle bar: camera, lens, settings (ISO, shutter, aperture, focal length)
- Left/Right navigation arrows on screen edges
- Arrow keys navigate between photos; Escape closes
- Swipe left/right on touch devices navigates; swipe down closes
- Preloads the next and previous images
- URL updates with photo index for deep-linking (`?photo=3`)
- BlurHash placeholder shown while the display image loads
- Close button in top-right corner
- Clicking the backdrop closes the lightbox

**Complexity:** L

---

#### P5-T5: Public Layout and Navigation

**Description:** Shared layout for all public pages with header navigation and footer.

**Files to create or modify:**
- `src/app/(public)/layout.tsx`
- `src/components/public/Header.tsx`
- `src/components/public/Footer.tsx`

**Dependencies:** P1-T7

**Acceptance Criteria:**
- Header: site title (links to home), "Albums" link, "Slideshows" link (placeholder until Phase 6)
- Header is semi-transparent over the hero, solid on other pages
- Footer: copyright line, "Admin" link (small, subtle)
- Navigation highlights the current page
- Header collapses to hamburger menu on mobile with slide-out drawer
- All navigation uses Next.js `<Link>` for client-side transitions

**Complexity:** S

---

#### P5-T6: BlurHash Rendering Component

**Description:** Reusable component that renders a BlurHash string as a placeholder while the actual image loads.

**Files to create:**
- `src/components/ui/BlurHashImage.tsx`

**Dependencies:** P1-T1

**Acceptance Criteria:**
- Accepts props: `blurHash`, `src`, `alt`, `width`, `height`, `className`
- Renders BlurHash as a canvas element, then fades to the loaded image
- Transition from BlurHash to image is a smooth 300ms crossfade
- If blurHash is null/undefined, renders a neutral dark placeholder
- Works with Next.js `<Image>` component for optimization
- Handles image load errors gracefully (keeps showing BlurHash with an error icon overlay)

**Complexity:** S

---

### Phase 6: Slideshow Engine

#### P6-T1: Slideshow Player Component

**Description:** Fullscreen slideshow player with photo display, transitions, and preloading.

**Files to create:**
- `src/components/slideshow/SlideshowPlayer.tsx`
- `src/components/slideshow/SlideshowImage.tsx`
- `src/hooks/useSlideshow.ts`

**Dependencies:** P5-T6

**Acceptance Criteria:**
- Enters fullscreen via Fullscreen API when launched
- Displays one photo at a time, centered and fit within the viewport (object-fit: contain, dark background)
- Crossfade transition between photos (CSS opacity transition, 1s duration)
- Auto-advances based on configured interval (default 5s)
- Preloads the next 2 photos in the background
- Uses full-size image variant
- Falls back to non-fullscreen modal if Fullscreen API is unavailable
- Handles reaching the end of the photo list: loops back to the beginning

**Complexity:** M

---

#### P6-T2: Ken Burns Effect

**Description:** Slow pan-and-zoom animation on the current slideshow photo for visual interest.

**Files to create:**
- `src/components/slideshow/KenBurnsLayer.tsx`

**Dependencies:** P6-T1

**Acceptance Criteria:**
- Each photo gets a random starting position/zoom and ending position/zoom
- Animation runs for the full display duration of the photo
- Zoom range: 1.0x to 1.15x (subtle, not distracting)
- Pan range: up to 5% of the image dimensions in any direction
- Smooth CSS animation (using `transform` for GPU acceleration)
- No visible jump at the start of each new photo
- Toggleable on/off; state persists in localStorage

**Complexity:** M

---

#### P6-T3: Slideshow Controls

**Description:** On-screen controls for the slideshow player.

**Files to create:**
- `src/components/slideshow/SlideshowControls.tsx`

**Dependencies:** P6-T1

**Acceptance Criteria:**
- Controls bar at the bottom of the screen: play/pause, previous, next, speed selector, Ken Burns toggle, exit
- Speed options: 3s, 5s, 8s, 12s (displayed as "Fast", "Normal", "Slow", "Very Slow")
- Controls auto-hide after 3 seconds of no mouse movement
- Controls reappear on any mouse movement or touch
- Current photo position indicator: "3 / 24"
- Controls have semi-transparent dark background for readability over any photo
- All controls have aria-labels for accessibility

**Complexity:** S

---

#### P6-T4: Slideshow Keyboard and Touch Controls

**Description:** Keyboard shortcuts and touch gestures for controlling the slideshow.

**Files to create or modify:**
- `src/hooks/useSlideshowControls.ts`

**Dependencies:** P6-T1

**Acceptance Criteria:**
- Space: toggle play/pause
- Left arrow: previous photo
- Right arrow: next photo
- Escape: exit slideshow (and exit fullscreen)
- F: toggle fullscreen
- K: toggle Ken Burns effect
- Touch: tap left 1/3 for previous, tap right 1/3 for next, tap center for play/pause
- Swipe left/right: next/previous
- Swipe up: exit slideshow
- All keyboard shortcuts work only when the slideshow is active (no conflict with page navigation)

**Complexity:** S

---

#### P6-T5: Playlist Model and API

**Description:** Database model and API routes for playlists (ordered collections of photos from any album).

**Files to create:**
- `src/app/api/playlists/route.ts` (GET list, POST create)
- `src/app/api/playlists/[id]/route.ts` (GET, PATCH, DELETE)
- `src/app/api/playlists/[id]/photos/route.ts` (PUT to set photos)
- `src/lib/actions/playlists.ts`
- `src/lib/queries/playlists.ts`

**Dependencies:** P1-T3

**Acceptance Criteria:**
- POST creates a playlist with title and description
- GET returns playlists with photo count
- GET `[id]` returns playlist with all photos in order, including photo URLs and metadata
- PUT `[id]/photos` accepts `{ photoIds: string[] }` to set the playlist's photo list and order
- DELETE removes the playlist (photos themselves are not deleted)
- PATCH updates title and description

**Complexity:** M

---

#### P6-T6: Playlist Admin UI

**Description:** Admin interface for creating, editing, and managing playlists.

**Files to create:**
- `src/app/admin/playlists/page.tsx`
- `src/app/admin/playlists/[id]/page.tsx`
- `src/components/admin/PlaylistEditor.tsx`
- `src/components/admin/PlaylistPhotoSelector.tsx`

**Dependencies:** P6-T5, P4-T2

**Acceptance Criteria:**
- Playlist list page shows all playlists with photo count and first 4 thumbnails as preview
- Create playlist: enter title and description
- Edit playlist page: left panel shows available photos grouped by album; right panel shows selected photos in order
- Photos can be added by clicking from the left panel; removed by clicking X in the right panel
- Right panel supports drag-and-drop reordering
- Filter/search in the left panel by album name
- "Select all from album" button for each album group
- Save persists the photo selection and order
- "Preview Slideshow" button launches the slideshow with the current playlist

**Complexity:** L

---

### Phase 7: Polish and Auth

#### P7-T1: Admin Auth Middleware

**Description:** Protect all `/admin` routes with authentication. Login via password validated against an environment variable.

**Files to create:**
- `src/middleware.ts`
- `src/app/admin/login/page.tsx`
- `src/components/admin/LoginForm.tsx`
- `src/lib/auth.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/logout/route.ts`

**Dependencies:** P1-T8

**Acceptance Criteria:**
- All routes under `/admin` (except `/admin/login`) require authentication
- All routes under `/api` (except `/api/auth/*`) require authentication
- Unauthenticated requests to admin pages redirect to `/admin/login`
- Unauthenticated API requests return 401
- Login form accepts a password; server action compares it against `ADMIN_TOKEN` env var using constant-time comparison
- On successful login, sets an HTTP-only, Secure, SameSite=Lax cookie containing a signed session token (HMAC with `ADMIN_TOKEN` as key)
- Cookie expires after 7 days
- Logout clears the cookie and redirects to `/admin/login`
- Middleware checks the cookie signature on every request; invalid/expired cookies redirect to login
- Login page shows error message for wrong password (generic: "Invalid password")

**Complexity:** M

---

#### P7-T2: Site Settings Page

**Description:** Admin page for editing global site settings.

**Files to create:**
- `src/app/admin/settings/page.tsx`
- `src/components/admin/SettingsForm.tsx`
- `src/lib/actions/settings.ts`
- `src/lib/queries/settings.ts`

**Dependencies:** P1-T3

**Acceptance Criteria:**
- Settings page shows editable fields: site title, site description, hero cycle interval (seconds), default slideshow duration (seconds)
- Default values are used when settings don't exist in the database
- Save button persists all settings and shows success toast
- Settings are read by public pages via `getSettings()` query
- `getSettings()` uses `unstable_cache` with a 60-second revalidation (or on-demand revalidation after save)
- Changing site title updates the page `<title>` across all pages

**Complexity:** S

---

#### P7-T3: Loading States

**Description:** Add loading UI (skeleton screens) for all pages.

**Files to create:**
- `src/app/(public)/loading.tsx`
- `src/app/(public)/albums/loading.tsx`
- `src/app/(public)/albums/[slug]/loading.tsx`
- `src/app/admin/loading.tsx`
- `src/app/admin/albums/loading.tsx`
- `src/app/admin/albums/[id]/loading.tsx`
- `src/app/admin/playlists/loading.tsx`
- `src/components/ui/Skeleton.tsx`

**Dependencies:** P5-T1, P5-T2, P5-T3, P4-T6, P6-T6

**Acceptance Criteria:**
- Every page has a `loading.tsx` that shows skeleton placeholders matching the page layout
- Skeleton components pulse with a subtle animation
- Skeleton matches the rough shape of actual content (image rectangles, text lines)
- No layout shift when content replaces skeletons
- Loading states appear within 100ms of navigation

**Complexity:** S

---

#### P7-T4: Error States

**Description:** Add error boundaries for all route segments.

**Files to create:**
- `src/app/(public)/error.tsx`
- `src/app/(public)/albums/[slug]/not-found.tsx`
- `src/app/admin/error.tsx`
- `src/components/ui/ErrorDisplay.tsx`

**Dependencies:** P5-T1

**Acceptance Criteria:**
- Error boundary displays a friendly message with "Try Again" button that calls `reset()`
- Public error: "Something went wrong. Please try again."
- Admin error: "Something went wrong" with error details in development mode
- `not-found.tsx` for album pages shows "Album not found" with link back to albums
- Error boundaries do not leak stack traces or internal details in production
- Errors are logged to the server console

**Complexity:** S

---

#### P7-T5: Empty States

**Description:** Add meaningful empty states for all list views.

**Files to modify:**
- `src/components/admin/AlbumList.tsx`
- `src/components/admin/PhotoGrid.tsx`
- `src/components/admin/PlaylistEditor.tsx`
- `src/components/public/AlbumGrid.tsx`
- `src/components/public/PhotoGrid.tsx`

**Dependencies:** P3-T3, P4-T2, P5-T2, P5-T3, P6-T6

**Acceptance Criteria:**
- Admin album list empty: "No albums yet. Create your first album to get started." with create button
- Admin photo grid empty: "No photos in this album. Drag and drop photos above to upload." with arrow pointing to upload zone
- Admin playlist editor (no playlists): "No playlists yet. Create one to build custom slideshows."
- Public albums index empty: "No albums to display."
- Public album detail empty: (should not occur -- empty albums are hidden from public)
- All empty states are centered, with muted text, and include an actionable next step where applicable

**Complexity:** S

---

#### P7-T6: Responsive Polish

**Description:** Final responsive design pass across all pages.

**Files to modify:** (multiple component files)

**Dependencies:** All UI components from Phases 3-6

**Acceptance Criteria:**
- All pages render without horizontal scroll on viewports from 320px to 2560px wide
- Touch targets are at least 44x44px on mobile
- Admin sidebar/navigation collapses to a bottom bar or hamburger on mobile
- Photo grids adjust column count smoothly across breakpoints
- Lightbox and slideshow are fully functional on mobile
- Upload drag-and-drop falls back gracefully on mobile (tap to select files)
- Text remains readable (minimum 16px body text on mobile)
- No overlapping elements at any viewport width

**Complexity:** M

---

#### P7-T7: Admin Navigation and Layout

**Description:** Admin shell layout with sidebar navigation and consistent page structure.

**Files to create or modify:**
- `src/app/admin/layout.tsx`
- `src/components/admin/AdminSidebar.tsx`
- `src/components/admin/AdminHeader.tsx`
- `src/components/ui/Toast.tsx`
- `src/hooks/useToast.ts`

**Dependencies:** P1-T7

**Acceptance Criteria:**
- Admin layout has a fixed sidebar with: logo/site name, Albums link, Playlists link, Settings link, Logout button
- Active link is highlighted
- Sidebar collapses to a top bar on mobile
- Toast notification system for success/error messages (auto-dismiss after 5s)
- Page header area for page title and primary action buttons
- Consistent padding and max-width for admin content area

**Complexity:** M

---

### Phase 8: Deployment

#### P8-T1: Vercel Project Setup

**Description:** Create Vercel project, configure build settings, and link to git repository.

**Dependencies:** Phase 7 complete

**Acceptance Criteria:**
- Vercel project created and linked to the git repository
- Build command: `npm run build`
- Output directory: auto-detected by Vercel (`.next`)
- Node.js version: 20.x
- Framework preset: Next.js

**Complexity:** S

---

#### P8-T2: Environment Variables Configuration

**Description:** Set all required environment variables in Vercel dashboard.

**Dependencies:** P8-T1

**Acceptance Criteria:**
- All variables from `.env.local.example` are set in Vercel project settings
- Variables are set for Production environment only (no preview/development leakage)
- `ADMIN_TOKEN` is set to a strong random value (32+ chars)
- `NEXT_PUBLIC_SITE_URL` is set to the production domain

**Complexity:** S

---

#### P8-T3: Production Turso Database

**Description:** Create production Turso database and push schema.

**Dependencies:** P1-T3

**Acceptance Criteria:**
- Production database created in Turso dashboard (separate from development)
- Schema pushed via `drizzle-kit push` against production database
- Database URL and auth token recorded in Vercel env vars
- Database is in a region close to the Vercel deployment (e.g., `us-east-1`)

**Complexity:** S

---

#### P8-T4: Production R2 Bucket

**Description:** Create production R2 bucket with appropriate configuration.

**Dependencies:** P1-T4

**Acceptance Criteria:**
- Production R2 bucket created in Cloudflare dashboard
- Public access enabled via custom domain or R2.dev subdomain
- CORS policy allows requests from the production domain
- API credentials created with scoped permissions (read/write to the specific bucket only)
- Credentials recorded in Vercel env vars

**Complexity:** S

---

#### P8-T5: Domain Configuration

**Description:** Configure custom domain to point to Vercel deployment.

**Dependencies:** P8-T1

**Acceptance Criteria:**
- Custom domain added to Vercel project
- DNS records configured (CNAME or Vercel nameservers)
- HTTPS certificate provisioned and active
- Redirect from www to non-www (or vice versa) configured
- Domain resolves to the deployed application

**Complexity:** S

---

#### P8-T6: Smoke Test

**Description:** End-to-end manual smoke test of all critical paths on production.

**Dependencies:** P8-T1 through P8-T5

**Acceptance Criteria:**
- [ ] Can access the public landing page
- [ ] Hero section displays (or shows fallback if no hero album)
- [ ] Can navigate to albums index
- [ ] Can navigate to `/admin/login`
- [ ] Can log in with the admin token
- [ ] Can create a new album
- [ ] Can upload 3 photos to the album
- [ ] Photos process correctly (three variants visible)
- [ ] Can set album as hero
- [ ] Can reorder photos
- [ ] Can set a cover photo
- [ ] Public album page shows the photos in justified grid
- [ ] Lightbox opens and navigates between photos
- [ ] Can launch slideshow from an album
- [ ] Slideshow transitions and controls work
- [ ] Can create a playlist and add photos
- [ ] Can launch slideshow from a playlist
- [ ] Can delete a photo (R2 objects also removed)
- [ ] Can delete an album (cascade deletes photos)
- [ ] Can log out
- [ ] Cannot access admin pages when logged out

**Complexity:** S

---

## 3. File Manifest

```
poor-mans-flicker/
|
|-- package.json                          # Project dependencies and scripts
|-- next.config.ts                        # Next.js configuration
|-- tsconfig.json                         # TypeScript configuration (strict)
|-- tailwind.config.ts                    # Tailwind theme and dark palette
|-- postcss.config.mjs                    # PostCSS for Tailwind
|-- drizzle.config.ts                     # Drizzle Kit configuration for Turso
|-- .gitignore                            # Git ignore rules
|-- .env.local.example                    # Environment variable template with comments
|
|-- src/
|   |
|   |-- middleware.ts                     # Auth middleware for /admin and /api routes
|   |
|   |-- app/
|   |   |-- layout.tsx                    # Root layout (html, body, fonts, metadata)
|   |   |-- globals.css                   # Tailwind directives + base dark theme styles
|   |   |
|   |   |-- (public)/
|   |   |   |-- layout.tsx               # Public layout with header and footer
|   |   |   |-- page.tsx                 # Landing page with hero cycling
|   |   |   |-- loading.tsx              # Landing page skeleton
|   |   |   |-- error.tsx                # Public error boundary
|   |   |   |
|   |   |   |-- albums/
|   |   |   |   |-- page.tsx             # Albums index page
|   |   |   |   |-- loading.tsx          # Albums index skeleton
|   |   |   |   |
|   |   |   |   |-- [slug]/
|   |   |   |       |-- page.tsx         # Album detail with photo grid
|   |   |   |       |-- loading.tsx      # Album detail skeleton
|   |   |   |       |-- not-found.tsx    # Album not found page
|   |   |
|   |   |-- admin/
|   |   |   |-- layout.tsx               # Admin shell with sidebar and header
|   |   |   |-- page.tsx                 # Admin dashboard (redirect to albums)
|   |   |   |-- loading.tsx              # Admin loading skeleton
|   |   |   |-- error.tsx                # Admin error boundary
|   |   |   |
|   |   |   |-- login/
|   |   |   |   |-- page.tsx             # Login page
|   |   |   |
|   |   |   |-- albums/
|   |   |   |   |-- page.tsx             # Album list with reorder
|   |   |   |   |-- loading.tsx          # Album list skeleton
|   |   |   |   |
|   |   |   |   |-- new/
|   |   |   |   |   |-- page.tsx         # Create album form
|   |   |   |   |
|   |   |   |   |-- [id]/
|   |   |   |       |-- page.tsx         # Album detail: upload + photo grid + bulk actions
|   |   |   |       |-- loading.tsx      # Album detail skeleton
|   |   |   |       |
|   |   |   |       |-- edit/
|   |   |   |           |-- page.tsx     # Edit album form
|   |   |   |
|   |   |   |-- playlists/
|   |   |   |   |-- page.tsx             # Playlist list
|   |   |   |   |-- loading.tsx          # Playlist list skeleton
|   |   |   |   |
|   |   |   |   |-- [id]/
|   |   |   |       |-- page.tsx         # Playlist editor
|   |   |   |
|   |   |   |-- settings/
|   |   |       |-- page.tsx             # Site settings form
|   |   |
|   |   |-- api/
|   |       |
|   |       |-- auth/
|   |       |   |-- login/
|   |       |   |   |-- route.ts         # POST login (validate token, set cookie)
|   |       |   |-- logout/
|   |       |       |-- route.ts         # POST logout (clear cookie)
|   |       |
|   |       |-- albums/
|   |       |   |-- route.ts             # GET list, POST create album
|   |       |   |-- reorder/
|   |       |   |   |-- route.ts         # PUT reorder albums
|   |       |   |-- [id]/
|   |       |       |-- route.ts         # GET, PATCH, DELETE album
|   |       |       |-- cover/
|   |       |       |   |-- route.ts     # PUT set cover photo
|   |       |       |-- photos/
|   |       |           |-- reorder/
|   |       |               |-- route.ts # PUT reorder photos in album
|   |       |
|   |       |-- photos/
|   |       |   |-- upload/
|   |       |   |   |-- route.ts         # POST upload photo
|   |       |   |-- bulk-delete/
|   |       |   |   |-- route.ts         # POST bulk delete photos
|   |       |   |-- [id]/
|   |       |       |-- route.ts         # PATCH update, DELETE photo
|   |       |
|   |       |-- playlists/
|   |           |-- route.ts             # GET list, POST create playlist
|   |           |-- [id]/
|   |               |-- route.ts         # GET, PATCH, DELETE playlist
|   |               |-- photos/
|   |                   |-- route.ts     # PUT set playlist photos
|   |
|   |-- components/
|   |   |
|   |   |-- ui/
|   |   |   |-- BlurHashImage.tsx        # BlurHash placeholder + image crossfade
|   |   |   |-- Skeleton.tsx             # Skeleton loading primitive
|   |   |   |-- ErrorDisplay.tsx         # Reusable error display with retry
|   |   |   |-- Toast.tsx               # Toast notification component
|   |   |
|   |   |-- public/
|   |   |   |-- Header.tsx              # Public site header and navigation
|   |   |   |-- Footer.tsx              # Public site footer
|   |   |   |-- HeroSection.tsx         # Hero image container and overlay
|   |   |   |-- HeroCycler.tsx          # Hero image crossfade logic
|   |   |   |-- AlbumGrid.tsx           # Public albums index grid
|   |   |   |-- AlbumCard.tsx           # Public album card with cover
|   |   |   |-- PhotoGrid.tsx           # Justified photo grid for album detail
|   |   |   |-- PhotoTile.tsx           # Single photo tile in the grid
|   |   |   |-- Lightbox.tsx            # Fullscreen image viewer modal
|   |   |   |-- LightboxControls.tsx    # Lightbox navigation and info
|   |   |
|   |   |-- admin/
|   |   |   |-- AdminSidebar.tsx        # Admin navigation sidebar
|   |   |   |-- AdminHeader.tsx         # Admin page header
|   |   |   |-- LoginForm.tsx           # Login form
|   |   |   |-- AlbumList.tsx           # Sortable album list
|   |   |   |-- AlbumCard.tsx           # Admin album card
|   |   |   |-- AlbumForm.tsx           # Create/edit album form
|   |   |   |-- PhotoUploader.tsx       # Drag-drop upload zone
|   |   |   |-- UploadProgress.tsx      # Per-file upload progress
|   |   |   |-- PhotoGrid.tsx           # Admin photo grid with reorder
|   |   |   |-- PhotoCard.tsx           # Admin photo card with actions
|   |   |   |-- PhotoEditModal.tsx      # Photo caption/details editor
|   |   |   |-- BulkActions.tsx         # Bulk select/delete bar
|   |   |   |-- PlaylistEditor.tsx      # Playlist photo selector + orderer
|   |   |   |-- PlaylistPhotoSelector.tsx # Album-grouped photo picker
|   |   |   |-- SettingsForm.tsx        # Site settings form
|   |   |
|   |   |-- slideshow/
|   |       |-- SlideshowPlayer.tsx     # Main slideshow container
|   |       |-- SlideshowImage.tsx      # Single slideshow image display
|   |       |-- SlideshowControls.tsx   # Play/pause/speed/exit controls
|   |       |-- KenBurnsLayer.tsx       # Pan-zoom animation layer
|   |
|   |-- lib/
|   |   |
|   |   |-- env.ts                      # Environment variable validation
|   |   |-- types.ts                    # Shared TypeScript types
|   |   |-- constants.ts                # Image sizes, MIME types, limits
|   |   |-- utils.ts                    # nanoid, slugify, formatters
|   |   |-- auth.ts                     # Session token signing/verification
|   |   |
|   |   |-- db/
|   |   |   |-- index.ts               # Drizzle client singleton
|   |   |   |-- schema.ts              # All table definitions
|   |   |
|   |   |-- storage/
|   |   |   |-- r2.ts                  # R2 upload/delete/URL abstraction
|   |   |
|   |   |-- images/
|   |   |   |-- process.ts             # Sharp processing (variants + BlurHash)
|   |   |   |-- exif.ts                # Server-side EXIF extraction
|   |   |   |-- client-resize.ts       # Browser-side pre-resize
|   |   |   |-- client-exif.ts         # Browser-side EXIF reader
|   |   |
|   |   |-- actions/
|   |   |   |-- albums.ts              # Album server actions
|   |   |   |-- playlists.ts           # Playlist server actions
|   |   |   |-- settings.ts            # Settings server actions
|   |   |
|   |   |-- queries/
|   |       |-- albums.ts              # Album query functions
|   |       |-- playlists.ts           # Playlist query functions
|   |       |-- settings.ts            # Settings query functions
|   |
|   |-- hooks/
|       |-- usePhotoUpload.ts          # Upload queue + progress tracking
|       |-- useLightbox.ts             # Lightbox state and navigation
|       |-- useSlideshow.ts            # Slideshow state machine
|       |-- useSlideshowControls.ts    # Keyboard/touch slideshow controls
|       |-- useToast.ts               # Toast notification state
```

**Total files: 89**

---

## 4. Dependency Graph

### Phase-Level Dependencies

```
Phase 1 (Scaffold)
  |
  +---> Phase 2 (Image Pipeline)
  |       |
  |       +---> Phase 4 (Photo Management) <--- Phase 3
  |                |
  +---> Phase 3 (Album Management)            |
          |                                    |
          +------------------------------------+
                    |
                    v
              Phase 5 (Public Gallery)
                    |
                    v
              Phase 6 (Slideshow Engine)
                    |
                    v
              Phase 7 (Polish & Auth)
                    |
                    v
              Phase 8 (Deployment)
```

### Critical Path

```
P1-T1 -> P1-T2 -> P1-T3 -> P2-T1 -> P2-T3 -> P4-T1 -> P4-T6 -> P5-T3 -> P5-T4 -> P6-T1 -> P6-T5 -> P6-T6 -> P7-T1 -> P8-T6
```

This is the longest chain of sequential dependencies. Any delay on this path delays the entire project.

### Parallelization Opportunities

**Within Phase 1:**
- P1-T4 (R2), P1-T5 (Types), P1-T6 (Tailwind), P1-T7 (Structure), P1-T8 (Env) can all run in parallel after P1-T1
- P1-T3 (Schema) depends on P1-T2 (Turso setup) only

**Within Phase 2:**
- P2-T1 (Sharp) and P2-T2 (EXIF) can run in parallel
- P2-T4 (Client resize) and P2-T5 (Client EXIF) can run in parallel, independent of server-side tasks
- P2-T6 and P2-T7 (Delete endpoints) can run in parallel with P2-T3 (Upload endpoint)

**Phase 2 and Phase 3 can run in parallel** (both depend only on Phase 1)

**Within Phase 5:**
- P5-T5 (Layout) and P5-T6 (BlurHash component) can start immediately
- P5-T1 (Landing), P5-T2 (Albums index), P5-T3 (Album detail) can run in parallel

**Within Phase 6:**
- P6-T2 (Ken Burns), P6-T3 (Controls), P6-T4 (Input) can run in parallel after P6-T1
- P6-T5 (Playlist API) can start independently of P6-T1

**Within Phase 7:**
- P7-T1 (Auth), P7-T2 (Settings), P7-T7 (Admin nav) can all run in parallel
- P7-T3 (Loading), P7-T4 (Error), P7-T5 (Empty) can run in parallel

### Task Dependency Matrix

| Task | Depends On |
|------|------------|
| P1-T1 | -- |
| P1-T2 | P1-T1 |
| P1-T3 | P1-T2 |
| P1-T4 | P1-T1 |
| P1-T5 | P1-T1 |
| P1-T6 | P1-T1 |
| P1-T7 | P1-T1 |
| P1-T8 | P1-T1 |
| P2-T1 | P1-T4, P1-T5 |
| P2-T2 | P1-T1 |
| P2-T3 | P2-T1, P2-T2, P1-T3, P1-T4 |
| P2-T4 | P1-T1 |
| P2-T5 | P1-T1 |
| P2-T6 | P1-T3, P1-T4 |
| P2-T7 | P2-T6 |
| P3-T1 | P1-T3 |
| P3-T2 | P1-T3 |
| P3-T3 | P3-T1, P3-T2 |
| P3-T4 | P3-T1 |
| P3-T5 | P1-T3 |
| P4-T1 | P2-T3, P2-T4, P2-T5 |
| P4-T2 | P3-T5 |
| P4-T3 | P1-T3 |
| P4-T4 | P1-T3 |
| P4-T5 | P2-T6 |
| P4-T6 | P4-T1, P4-T2, P4-T3, P4-T4, P4-T5 |
| P5-T1 | P3-T5 |
| P5-T2 | P3-T5 |
| P5-T3 | P3-T5 |
| P5-T4 | P5-T3 |
| P5-T5 | P1-T7 |
| P5-T6 | P1-T1 |
| P6-T1 | P5-T6 |
| P6-T2 | P6-T1 |
| P6-T3 | P6-T1 |
| P6-T4 | P6-T1 |
| P6-T5 | P1-T3 |
| P6-T6 | P6-T5, P4-T2 |
| P7-T1 | P1-T8 |
| P7-T2 | P1-T3 |
| P7-T3 | P5-T1, P5-T2, P5-T3, P4-T6, P6-T6 |
| P7-T4 | P5-T1 |
| P7-T5 | P3-T3, P4-T2, P5-T2, P5-T3, P6-T6 |
| P7-T6 | All UI components |
| P7-T7 | P1-T7 |
| P8-T1 | Phase 7 |
| P8-T2 | P8-T1 |
| P8-T3 | P1-T3 |
| P8-T4 | P1-T4 |
| P8-T5 | P8-T1 |
| P8-T6 | P8-T1 through P8-T5 |

---

## 5. Risk Register

| # | Risk | Impact | Likelihood | Mitigation |
|---|------|--------|------------|------------|
| R1 | **Sharp binary incompatibility on Vercel** -- Sharp requires native binaries that may not match Vercel's serverless runtime. | High -- image processing is core to the app. | Medium -- Vercel has improved Sharp support but edge cases remain. | Pin Sharp version known to work on Vercel. Use `next.config.ts` `experimental.serverComponentsExternalPackages: ['sharp']`. Test deployment early (end of Phase 2, not Phase 8). |
| R2 | **Vercel serverless function timeout on large uploads** -- Free tier has 10s function timeout. Processing a large image through Sharp + R2 upload may exceed this. | High -- uploads would fail silently or partially. | High -- a 20MB image through 3 resize operations + 3 R2 uploads is substantial. | Client-side pre-resize reduces server load (target 4MB). Consider chunked processing: resize and upload each variant sequentially, not in parallel. If still tight, switch to Vercel Pro (26s timeout) or offload to a background job via Vercel Cron + queue. |
| R3 | **R2 public URL caching and invalidation** -- R2 doesn't have built-in CDN cache invalidation. Replacing a photo could serve stale versions. | Low -- photos are immutable (delete + re-upload, not replace). | Low -- design avoids the problem. | Use unique photo IDs in R2 keys so each upload gets a unique URL. No cache invalidation needed. |
| R4 | **Turso free tier limits** -- 500 databases, 9GB storage, 25M row reads/month. | Medium -- could hit row read limits with heavy slideshow use (each photo load queries metadata). | Low -- a personal portfolio will not hit these limits. | Monitor usage in Turso dashboard. Cache query results aggressively with `unstable_cache`. If needed, upgrade to Turso Scaler ($29/mo). |
| R5 | **Drag-and-drop library bundle size** -- `@dnd-kit` adds to the client bundle, potentially hurting Lighthouse score. | Low -- only affects admin pages, not public pages. | Medium -- admin pages load the library. | Dynamic import `@dnd-kit` only on admin pages. Public pages never load it. Tree-shaking should handle this, but verify with bundle analyzer. |
| R6 | **Fullscreen API inconsistency** -- Safari and iOS have limited/different Fullscreen API support. | Medium -- slideshow is a key feature. | High -- iOS Safari does not support Fullscreen API at all. | Implement fallback: fixed-position full-viewport overlay when Fullscreen API is unavailable. Test on iOS Safari specifically during Phase 6. |
| R7 | **BlurHash generation performance** -- Generating BlurHash server-side adds processing time to uploads. | Low -- one-time cost per photo. | Low -- BlurHash from a 32x32 thumbnail is nearly instant. | Generate BlurHash from the already-downscaled thumbnail buffer, not the original image. |
| R8 | **EXIF stripping removes desired metadata** -- Sharp's metadata stripping might remove data the photographer wants preserved in the full-size variant. | Medium -- photographers care about embedded metadata. | Medium -- Sharp's `withMetadata()` behavior varies. | Use `sharp.withMetadata()` on the full-size variant to preserve non-GPS EXIF. Explicitly strip only GPS via `withMetadata({ orientation: undefined })` and manual GPS removal. Test with real camera files from the photographer. |
| R9 | **Concurrent admin sessions conflicting** -- Two browser tabs reordering the same album could create conflicts. | Low -- single-user admin. | Low -- only one admin user expected. | Last-write-wins is acceptable for v1. The sort order API replaces all orders atomically, so partial corruption is impossible. |
| R10 | **Next.js App Router caching surprises** -- App Router's aggressive caching can serve stale data after mutations. | Medium -- admin could upload a photo and not see it. | High -- this is a known pain point with App Router. | Use `revalidatePath()` and `revalidateTag()` after every mutation. Use `dynamic = 'force-dynamic'` on admin pages. Test cache behavior explicitly in each phase. |

---

## 6. Definition of Done

The project is complete and ready for the photographer to use when ALL of the following are true:

### Functional Completeness
- [ ] An admin can log in with a password, and all admin functionality is inaccessible without authentication
- [ ] An admin can create, edit, delete, and reorder albums
- [ ] An admin can upload photos via drag-and-drop with visible progress; photos are processed into three size variants and stored in R2
- [ ] An admin can reorder photos within an album, set a cover photo, edit captions, and bulk-delete photos
- [ ] An admin can designate one album as the hero album
- [ ] An admin can create playlists by selecting photos from any album and ordering them
- [ ] An admin can edit site settings (title, description, hero interval, slideshow duration)
- [ ] A visitor sees the landing page with hero photos cycling at the configured interval
- [ ] A visitor can browse all albums and view photos in a justified grid
- [ ] A visitor can open a lightbox to view individual photos with captions and EXIF data
- [ ] A visitor can navigate the lightbox with keyboard, mouse, and touch
- [ ] A visitor can launch a fullscreen slideshow from any album or playlist
- [ ] The slideshow supports crossfade transitions, Ken Burns effect, and configurable speed
- [ ] The slideshow has full keyboard, mouse, and touch controls

### Quality
- [ ] All pages load without layout shift (CLS < 0.1)
- [ ] BlurHash placeholders are visible during image loading on all photo displays
- [ ] Every page has a loading skeleton, error boundary, and empty state
- [ ] All admin functions work on mobile (375px viewport) without horizontal scroll
- [ ] Lighthouse performance score >= 90 on the public landing page with populated data
- [ ] TypeScript strict mode with zero type errors
- [ ] No console errors or warnings in production build

### Deployment
- [ ] App is deployed to Vercel and accessible via custom domain with HTTPS
- [ ] Production Turso database and R2 bucket are provisioned and operational
- [ ] All environment variables are configured in Vercel
- [ ] The full smoke test checklist (P8-T6) passes on production

### Data Integrity
- [ ] Deleting a photo removes all three R2 variants
- [ ] Deleting an album cascade-deletes all its photos and their R2 variants
- [ ] EXIF GPS data is stripped from all stored image variants
- [ ] No orphaned R2 objects remain after any delete operation (verified by smoke test)

---

*End of development plan.*

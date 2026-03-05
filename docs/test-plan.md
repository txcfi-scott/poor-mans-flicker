# Poor Man's Flickr - Comprehensive Test Plan

**Version:** 1.0
**Last Updated:** 2026-03-05
**Author:** QA Engineering

---

## Table of Contents

1. [Test Strategy](#1-test-strategy)
2. [Unit Tests](#2-unit-tests)
3. [Integration Tests](#3-integration-tests)
4. [E2E Tests (Playwright)](#4-e2e-tests-playwright)
5. [Visual/Responsive Tests](#5-visualresponsive-tests)
6. [Performance Tests](#6-performance-tests)
7. [Edge Cases and Error Scenarios](#7-edge-cases-and-error-scenarios)
8. [Accessibility Tests](#8-accessibility-tests)
9. [Security Tests](#9-security-tests)
10. [Test Data](#10-test-data)

---

## 1. Test Strategy

### Testing Pyramid

| Layer       | Proportion | Tool       | Target Run Time |
|-------------|-----------|------------|-----------------|
| Unit        | 70%       | Vitest     | < 30 seconds    |
| Integration | 20%       | Vitest     | < 2 minutes     |
| E2E         | 10%       | Playwright | < 5 minutes     |

### Tools and Frameworks

- **Unit and Integration:** Vitest with `@testing-library/react` for component tests
- **E2E:** Playwright (Chromium, Firefox, WebKit)
- **Visual regression:** Playwright screenshot comparison
- **Coverage:** Vitest native coverage via `v8`
- **Mocking:** Vitest built-in mocks, `msw` for HTTP interception where needed

### Test Environment

| Concern         | Production        | Test Environment              |
|-----------------|-------------------|-------------------------------|
| Database        | Turso (SQLite/HTTP) | Local SQLite file via `better-sqlite3` |
| Object Storage  | Cloudflare R2     | Local filesystem (`/tmp/test-storage/`) |
| Image Processing| Sharp             | Sharp (real -- fast enough locally)     |
| Auth            | Admin token       | Hardcoded test token                    |

**Rationale:** Using local SQLite and filesystem eliminates network latency and external service dependencies. Sharp runs locally with acceptable speed. This keeps the full unit + integration suite under 2 minutes.

### CI Integration (GitHub Actions)

```
on: [push, pull_request]

jobs:
  test:
    - Checkout
    - Setup Node 20
    - Install dependencies (npm ci)
    - Lint (eslint, tsc --noEmit)
    - Unit + Integration tests (vitest run --coverage)
    - Build (next build)
    - E2E tests (playwright test)
    - Upload coverage report and Playwright traces as artifacts
```

**Branch rules:** All tests must pass before merge to `main`. Coverage must not decrease.

### What to Mock vs. What to Test for Real

| Component              | Mock?  | Rationale                                                |
|------------------------|--------|----------------------------------------------------------|
| Drizzle ORM queries    | No     | Test against real local SQLite for accurate SQL behavior  |
| Sharp image processing | No     | Fast enough locally; catches real encoding issues         |
| R2 storage client      | Yes    | Replace with filesystem adapter via storage abstraction   |
| Turso HTTP client      | Yes    | Replace with local SQLite driver                         |
| `fetch` calls          | Yes    | Use `msw` for any external HTTP                          |
| Auth middleware         | No     | Test the real middleware with test tokens                 |
| Next.js routing        | No     | E2E tests exercise real routing; unit tests mock `next/navigation` |
| BlurHash encoding      | No     | Deterministic and fast                                   |

---

## 2. Unit Tests

### 2.1 Database Layer (Drizzle Queries)

Each test uses a fresh in-memory SQLite database with migrations applied in `beforeEach`.

#### Album CRUD

| # | Test Case | Setup | Action | Expected Result |
|---|-----------|-------|--------|-----------------|
| DB-A01 | Create album with valid data | Empty database | `createAlbum({ title: "Landscapes", slug: "landscapes", description: "Mountain photos" })` | Returns album object with auto-generated `id`, `createdAt`, `updatedAt` timestamps. `isHero` defaults to `false`, `sortOrder` defaults to `0`. |
| DB-A02 | Read album by ID | One album in DB | `getAlbumById(id)` | Returns the album with all fields matching what was inserted. |
| DB-A03 | Read album by slug | One album with slug `"landscapes"` | `getAlbumBySlug("landscapes")` | Returns the matching album. |
| DB-A04 | Read album by slug - not found | One album with slug `"landscapes"` | `getAlbumBySlug("portraits")` | Returns `null` or `undefined`. |
| DB-A05 | List all albums | Three albums in DB | `listAlbums()` | Returns array of 3 albums sorted by `sortOrder` ascending. |
| DB-A06 | Update album title | One album in DB | `updateAlbum(id, { title: "New Title" })` | Returns updated album. `title` changed, `updatedAt` updated, all other fields unchanged. |
| DB-A07 | Update album description | One album in DB | `updateAlbum(id, { description: "Updated desc" })` | `description` field updated. |
| DB-A08 | Delete album | One album in DB, no photos | `deleteAlbum(id)` | Album no longer returned by `getAlbumById`. `listAlbums()` returns empty array. |
| DB-A09 | Delete nonexistent album | Empty database | `deleteAlbum("nonexistent-id")` | Returns `false` or throws a "not found" error (document whichever convention is chosen). No side effects. |
| DB-A10 | Create album with duplicate slug | Album with slug `"landscapes"` exists | `createAlbum({ title: "Other", slug: "landscapes" })` | Throws unique constraint violation error. |

#### Photo CRUD

| # | Test Case | Setup | Action | Expected Result |
|---|-----------|-------|--------|-----------------|
| DB-P01 | Create photo with valid data | One album in DB | `createPhoto({ albumId, filename: "sunset.jpg", storageKey: "albums/1/sunset", width: 4000, height: 3000, blurHash: "LEHV6nWB2y...", exif: { camera: "Sony A7III" } })` | Returns photo with auto-generated `id`, `createdAt`. `caption` defaults to `null`, `sortOrder` defaults to `0`. |
| DB-P02 | Read photo by ID | One photo in DB | `getPhotoById(id)` | Returns the photo with all fields. |
| DB-P03 | List photos by album | Album with 5 photos | `listPhotosByAlbum(albumId)` | Returns 5 photos sorted by `sortOrder` ascending. |
| DB-P04 | List photos for empty album | Album with 0 photos | `listPhotosByAlbum(albumId)` | Returns empty array. |
| DB-P05 | Update photo caption | One photo in DB | `updatePhoto(id, { caption: "Golden hour at Yosemite" })` | Caption updated. `updatedAt` refreshed. |
| DB-P06 | Delete photo | One photo in DB | `deletePhoto(id)` | Photo no longer returned by `getPhotoById`. |
| DB-P07 | Photo references valid album | No albums in DB | `createPhoto({ albumId: "nonexistent", ... })` | Throws foreign key constraint error. |

#### Cascading Deletes

| # | Test Case | Setup | Action | Expected Result |
|---|-----------|-------|--------|-----------------|
| DB-C01 | Delete album cascades to photos | Album with 5 photos | `deleteAlbum(albumId)` | Album deleted. `listPhotosByAlbum(albumId)` returns empty array. All 5 photo records gone. |
| DB-C02 | Delete album with no photos | Album with 0 photos | `deleteAlbum(albumId)` | Album deleted. No errors. |

#### Unique Constraint Enforcement

| # | Test Case | Setup | Action | Expected Result |
|---|-----------|-------|--------|-----------------|
| DB-U01 | Album slug must be unique | Album `slug: "travel"` exists | Insert another album with `slug: "travel"` | Unique constraint error thrown. |
| DB-U02 | Different albums can share title | Album `title: "Travel"` exists | Insert album with `title: "Travel"`, `slug: "travel-2"` | Succeeds. Both albums exist. |

#### Sort Order Management

| # | Test Case | Setup | Action | Expected Result |
|---|-----------|-------|--------|-----------------|
| DB-S01 | New album gets next sort order | Albums with sortOrder 0, 1, 2 | `createAlbum(...)` | New album gets `sortOrder: 3`. |
| DB-S02 | Reorder albums | Albums A(0), B(1), C(2) | `reorderAlbums([C.id, A.id, B.id])` | C.sortOrder=0, A.sortOrder=1, B.sortOrder=2. |
| DB-S03 | Reorder photos within album | Photos P1(0), P2(1), P3(2) | `reorderPhotos(albumId, [P3.id, P1.id, P2.id])` | P3.sortOrder=0, P1.sortOrder=1, P2.sortOrder=2. |
| DB-S04 | Reorder with invalid IDs | Photos P1, P2 in album | `reorderPhotos(albumId, [P1.id, "bogus"])` | Throws error. Original order unchanged. |

#### SiteConfig Operations

| # | Test Case | Setup | Action | Expected Result |
|---|-----------|-------|--------|-----------------|
| DB-SC01 | Get default config | Empty config table | `getSiteConfig()` | Returns defaults: `{ siteTitle: "Poor Man's Flickr", siteDescription: "", ownerName: "" }` (or whatever defaults are defined). |
| DB-SC02 | Update site title | Default config | `updateSiteConfig({ siteTitle: "Jane's Photography" })` | Config updated. `getSiteConfig()` returns new title. |
| DB-SC03 | Update multiple fields | Default config | `updateSiteConfig({ siteTitle: "Jane's Photos", siteDescription: "Landscapes and portraits" })` | Both fields updated. |
| DB-SC04 | Partial update preserves other fields | Config with custom title and description | `updateSiteConfig({ siteTitle: "New Title" })` | Title changes. Description remains unchanged. |

---

### 2.2 Image Processing (Sharp Pipeline)

Test fixtures: include small sample images (< 100KB each) in `test/fixtures/images/`.

#### Variant Generation

| # | Test Case | Setup | Action | Expected Result |
|---|-----------|-------|--------|-----------------|
| IMG-V01 | Generates thumbnail variant | 4000x3000 JPEG input | `processImage(buffer)` | Output includes `thumb` variant at 400px on longest side. |
| IMG-V02 | Generates display variant | 4000x3000 JPEG input | `processImage(buffer)` | Output includes `display` variant at 1600px on longest side. |
| IMG-V03 | Generates full variant | 4000x3000 JPEG input | `processImage(buffer)` | Output includes `full` variant at 2400px on longest side. |
| IMG-V04 | Small image not upscaled | 300x200 JPEG input | `processImage(buffer)` | `thumb` variant is 300x200 (not upscaled to 400px). `display` and `full` are also 300x200. |
| IMG-V05 | Portrait orientation handled | 3000x4000 (portrait) JPEG | `processImage(buffer)` | Thumbnail is 300x400 (400px on longest side, which is height). Aspect ratio preserved. |

#### Output Format

| # | Test Case | Setup | Action | Expected Result |
|---|-----------|-------|--------|-----------------|
| IMG-F01 | All variants output as WebP | JPEG input | `processImage(buffer)` | All variant buffers start with WebP magic bytes (`RIFF....WEBP`). |
| IMG-F02 | WebP quality is reasonable | JPEG input | `processImage(buffer)` | Output file size is smaller than input. Visual quality is acceptable (no automated check -- just verify no corruption by loading with Sharp). |

#### Aspect Ratio Preservation

| # | Test Case | Setup | Action | Expected Result |
|---|-----------|-------|--------|-----------------|
| IMG-AR01 | 4:3 landscape preserved | 4000x3000 input | Generate `display` (1600px longest) | Output dimensions: 1600x1200. Ratio 4:3 preserved. |
| IMG-AR02 | 16:9 landscape preserved | 3840x2160 input | Generate `display` (1600px longest) | Output dimensions: 1600x900. |
| IMG-AR03 | 1:1 square preserved | 4000x4000 input | Generate `thumb` (400px longest) | Output dimensions: 400x400. |
| IMG-AR04 | Panoramic preserved | 8000x2000 input | Generate `display` (1600px longest) | Output dimensions: 1600x400. |

#### Input Format Handling

| # | Test Case | Setup | Action | Expected Result |
|---|-----------|-------|--------|-----------------|
| IMG-IF01 | Process JPEG input | JPEG buffer | `processImage(buffer)` | Success. Three WebP variants returned. |
| IMG-IF02 | Process PNG input | PNG buffer | `processImage(buffer)` | Success. Three WebP variants returned. |
| IMG-IF03 | Process WebP input | WebP buffer | `processImage(buffer)` | Success. Three WebP variants returned. |
| IMG-IF04 | Process HEIC input | HEIC buffer | `processImage(buffer)` | Success. Three WebP variants returned. (Requires Sharp built with HEIC support.) |
| IMG-IF05 | Reject unsupported format | BMP buffer | `processImage(buffer)` | Throws descriptive error: "Unsupported image format". |

#### EXIF Extraction

| # | Test Case | Setup | Action | Expected Result |
|---|-----------|-------|--------|-----------------|
| IMG-EX01 | Extract camera model | JPEG with EXIF | `extractExif(buffer)` | Returns object containing `{ camera: "Canon EOS R5" }` (or whatever the fixture contains). |
| IMG-EX02 | Extract lens info | JPEG with EXIF | `extractExif(buffer)` | Returns `{ lens: "RF 24-70mm F2.8L" }`. |
| IMG-EX03 | Extract exposure settings | JPEG with EXIF | `extractExif(buffer)` | Returns `{ iso: 400, aperture: "f/2.8", shutterSpeed: "1/250" }`. |
| IMG-EX04 | Extract date taken | JPEG with EXIF | `extractExif(buffer)` | Returns `{ dateTaken: "2025-06-15T14:30:00" }` as ISO string. |
| IMG-EX05 | Extract GPS coordinates | JPEG with GPS EXIF | `extractExif(buffer)` | Returns `{ lat: 37.7749, lng: -122.4194 }`. |
| IMG-EX06 | Handle image with no EXIF | PNG with no EXIF | `extractExif(buffer)` | Returns empty object `{}` or object with all fields `null`. No error thrown. |
| IMG-EX07 | Handle image with partial EXIF | JPEG with only camera model | `extractExif(buffer)` | Returns `{ camera: "..." }` with other fields `null` or absent. |

#### BlurHash Generation

| # | Test Case | Setup | Action | Expected Result |
|---|-----------|-------|--------|-----------------|
| IMG-BH01 | Generates valid BlurHash | 400x300 JPEG | `generateBlurHash(buffer)` | Returns string matching BlurHash format: 6-30 characters, only `[0-9A-Za-z#$%*+,-./:;=?@[]^_{|}~]`. |
| IMG-BH02 | BlurHash is deterministic | Same image buffer | Call `generateBlurHash` twice | Both calls return identical string. |
| IMG-BH03 | BlurHash from different images differs | Two different images | Generate BlurHash for each | Hashes are different. |

#### Error Handling

| # | Test Case | Setup | Action | Expected Result |
|---|-----------|-------|--------|-----------------|
| IMG-ERR01 | Corrupt file | Random bytes buffer | `processImage(buffer)` | Throws error with message indicating invalid/corrupt image. Does not crash process. |
| IMG-ERR02 | Truncated JPEG | First 1KB of a valid JPEG | `processImage(buffer)` | Throws error. Does not hang or crash. |
| IMG-ERR03 | Zero-byte buffer | `Buffer.alloc(0)` | `processImage(buffer)` | Throws error: "Empty file" or similar. |

---

### 2.3 Storage Abstraction

Tests run against the filesystem-based storage adapter (same interface as R2 adapter).

| # | Test Case | Setup | Action | Expected Result |
|---|-----------|-------|--------|-----------------|
| STR-01 | Upload file to correct path | Clean storage dir | `storage.upload("albums/1/sunset-thumb.webp", buffer)` | File exists at `{storageRoot}/albums/1/sunset-thumb.webp`. File contents match buffer. |
| STR-02 | Upload creates intermediate directories | Clean storage dir | `storage.upload("albums/99/deep/path/photo.webp", buffer)` | All directories created. File written successfully. |
| STR-03 | Delete single file | One file uploaded | `storage.delete("albums/1/sunset-thumb.webp")` | File no longer exists on disk. |
| STR-04 | Delete all variants of a photo | Three variants uploaded: `-thumb.webp`, `-display.webp`, `-full.webp` | `storage.deleteAllVariants("albums/1/sunset")` | All three files deleted. |
| STR-05 | Delete nonexistent file | Clean storage dir | `storage.delete("nonexistent.webp")` | No error thrown (idempotent delete). |
| STR-06 | Generate correct public URL | N/A | `storage.getPublicUrl("albums/1/sunset-thumb.webp")` | Returns URL matching expected pattern (e.g., `https://cdn.example.com/albums/1/sunset-thumb.webp`). |
| STR-07 | Upload failure: cleanup partial write | Mock filesystem to fail mid-write | `storage.upload(key, largeBuffer)` | Error thrown. No partial file left on disk at the target path. |
| STR-08 | Reject path traversal | N/A | `storage.upload("../../../etc/passwd", buffer)` | Throws error. File not written outside storage root. |

---

### 2.4 API Route Handlers

Each test creates a mock `NextRequest` and calls the route handler directly (no HTTP server needed).

#### Album Endpoints

| # | Endpoint | Test Case | Setup | Action | Expected Result |
|---|----------|-----------|-------|--------|-----------------|
| API-A01 | `POST /api/albums` | Happy path | Auth token in header | Create album with `{ title, slug, description }` | 201 response. Body contains created album with `id`. |
| API-A02 | `POST /api/albums` | Missing required field | Auth token | Send `{ slug: "test" }` (no title) | 400 response. Body: `{ error: "title is required" }`. |
| API-A03 | `POST /api/albums` | Duplicate slug | Existing album with slug `"test"` | Create album with `slug: "test"` | 409 response. Body: `{ error: "slug already exists" }`. |
| API-A04 | `POST /api/albums` | No auth token | No auth header | Create album | 401 response. Body: `{ error: "Unauthorized" }`. |
| API-A05 | `GET /api/albums` | List albums | 3 albums in DB | GET request | 200 response. Body is array of 3 albums. |
| API-A06 | `GET /api/albums/[slug]` | Get album by slug | Album with slug `"landscapes"` | GET with slug param | 200 response. Body contains album and its photos. |
| API-A07 | `GET /api/albums/[slug]` | Album not found | Empty DB | GET with slug `"nonexistent"` | 404 response. |
| API-A08 | `PUT /api/albums/[id]` | Update album | Existing album, auth token | Send `{ title: "New Name" }` | 200 response. Album updated. |
| API-A09 | `DELETE /api/albums/[id]` | Delete album | Existing album, auth token | DELETE request | 200 response. Album and associated photos deleted. |
| API-A10 | `PUT /api/albums/[id]` | No auth | Existing album, no token | Update request | 401 response. |

#### Photo Endpoints

| # | Endpoint | Test Case | Setup | Action | Expected Result |
|---|----------|-----------|-------|--------|-----------------|
| API-P01 | `POST /api/albums/[id]/photos` | Upload single photo | Album exists, auth token, multipart form with JPEG | POST with form data | 201 response. Photo record created with variants stored. Response includes photo ID, dimensions, blurHash. |
| API-P02 | `POST /api/albums/[id]/photos` | Upload to nonexistent album | No album, auth token | POST with form data | 404 response. |
| API-P03 | `POST /api/albums/[id]/photos` | Invalid file type | Album exists, auth token, PDF file | POST with form data | 400 response. Body: `{ error: "Invalid file type" }`. |
| API-P04 | `POST /api/albums/[id]/photos` | No file in request | Album exists, auth token, empty form | POST with form data | 400 response. Body: `{ error: "No file provided" }`. |
| API-P05 | `DELETE /api/photos/[id]` | Delete photo | Photo exists, auth token | DELETE request | 200 response. Photo record deleted. Storage variants deleted. |
| API-P06 | `PUT /api/photos/[id]` | Update caption | Photo exists, auth token | Send `{ caption: "New caption" }` | 200 response. Caption updated. |
| API-P07 | `PUT /api/albums/[id]/photos/reorder` | Reorder photos | Album with 3 photos, auth token | Send `{ photoIds: [id3, id1, id2] }` | 200 response. Sort order updated. |

#### Bulk Operations

| # | Endpoint | Test Case | Setup | Action | Expected Result |
|---|----------|-----------|-------|--------|-----------------|
| API-B01 | `POST /api/photos/bulk-delete` | Delete multiple photos | 5 photos exist, auth token | Send `{ photoIds: [id1, id3, id5] }` | 200 response. 3 photos deleted. 2 remain. Storage cleaned up for all 3. |
| API-B02 | `POST /api/photos/bulk-delete` | Empty array | Auth token | Send `{ photoIds: [] }` | 200 response. No changes. |
| API-B03 | `POST /api/photos/bulk-delete` | Some IDs invalid | 2 photos exist, auth token | Send `{ photoIds: [id1, "bogus"] }` | 200 response with partial success, or 400 with error. (Document chosen behavior.) |

#### Site Config Endpoints

| # | Endpoint | Test Case | Setup | Action | Expected Result |
|---|----------|-----------|-------|--------|-----------------|
| API-SC01 | `GET /api/config` | Get config | Default config | GET request (no auth needed) | 200 response with config object. |
| API-SC02 | `PUT /api/config` | Update config | Auth token | Send `{ siteTitle: "New Title" }` | 200 response. Config updated. |
| API-SC03 | `PUT /api/config` | No auth | No token | Update request | 401 response. |

---

## 3. Integration Tests

These tests exercise multiple components working together. They use real local SQLite and filesystem storage but do not start an HTTP server.

| # | Test Case | Setup | Action | Expected Result |
|---|-----------|-------|--------|-----------------|
| INT-01 | Full upload pipeline | Album in DB, test JPEG file | Call upload handler with real file | 1) Sharp processes image into 3 variants. 2) All 3 variants written to storage at correct paths. 3) DB record created with correct `width`, `height`, `blurHash`, `storageKey`, `exif` data. 4) Returned photo object matches DB record. |
| INT-02 | Delete photo cleans up storage | Photo with 3 variants stored | Call delete photo handler | 1) DB record removed. 2) All 3 variant files deleted from storage. 3) `getPhotoById` returns null. |
| INT-03 | Delete album cascades fully | Album with 3 photos (9 variant files total) | Call delete album handler | 1) Album record removed. 2) All 3 photo records removed. 3) All 9 variant files deleted from storage. 4) No orphaned files remain. |
| INT-04 | Reorder maintains consistency | Album with photos at sortOrder 0, 1, 2 | Reorder to [2, 0, 1] | `listPhotosByAlbum` returns photos in new order. sortOrder values are 0, 1, 2 (re-normalized, no gaps). |
| INT-05 | Hero album toggle: only one at a time | Two albums, neither is hero | Set album A as hero, then set album B as hero | After first call: A.isHero=true, B.isHero=false. After second call: A.isHero=false, B.isHero=true. Only one hero at any time. |
| INT-06 | Hero album toggle: unset hero | One album marked as hero | Set the same album's isHero to false | No albums are hero. Landing page query returns no hero album. |
| INT-07 | Upload preserves EXIF in DB | Test JPEG with known EXIF data | Upload through full pipeline | DB record's `exif` field contains expected camera, lens, ISO, aperture, shutter speed values. |
| INT-08 | Set cover photo | Album with 3 photos | `setAlbumCover(albumId, photoId)` | Album record's `coverPhotoId` points to the specified photo. |
| INT-09 | Upload multiple photos sequentially | Album exists | Upload 3 photos in sequence | All 3 photos created with sortOrder 0, 1, 2. All 9 variants stored. |
| INT-10 | Client pre-resize integration | 6000x4000 JPEG | Simulate client resize to 2400px, then upload | Server receives smaller file. Processing still generates all 3 variants. DB dimensions reflect processed dimensions (not original). |

---

## 4. E2E Tests (Playwright)

All E2E tests run against a local Next.js dev server with seeded test data.

### 4.1 Public Visitor Flows

#### E2E-PUB-01: Landing Page and Album Navigation

```
Steps:
1. Navigate to "/"
2. Assert: page title matches site config title
3. Assert: hero section is visible with cycling images (wait for at least one transition)
4. Assert: album grid is visible with all public albums
5. Click on first album card
6. Assert: URL changes to "/albums/[slug]"
7. Assert: album title and description are visible
8. Assert: photo grid loads with correct number of thumbnails
9. Assert: thumbnails use WebP format (check src attribute)
10. Assert: BlurHash placeholders visible before images load (throttle network in test)
```

#### E2E-PUB-02: Lightbox Navigation

```
Steps:
1. Navigate to album page with 5+ photos
2. Click on the 3rd photo thumbnail
3. Assert: lightbox overlay opens
4. Assert: display-size image is shown (not thumbnail)
5. Assert: photo caption is displayed (if present)
6. Assert: current position indicator shows "3 / N"
7. Press ArrowRight key
8. Assert: advances to photo 4
9. Press ArrowLeft key
10. Assert: returns to photo 3
11. Press Escape key
12. Assert: lightbox closes
13. Assert: focus returns to the photo grid
```

#### E2E-PUB-03: Lightbox Edge Navigation

```
Steps:
1. Open lightbox on the LAST photo in an album
2. Press ArrowRight
3. Assert: wraps to first photo OR shows "end of album" (document chosen behavior)
4. Open lightbox on the FIRST photo
5. Press ArrowLeft
6. Assert: wraps to last photo OR shows "beginning of album"
```

#### E2E-PUB-04: Slideshow Mode

```
Steps:
1. Navigate to album page
2. Click "Slideshow" button (or enter slideshow from lightbox)
3. Assert: first photo displays fullscreen
4. Assert: controls (play/pause, prev, next) are visible
5. Wait 5 seconds (or configured interval)
6. Assert: auto-advances to second photo
7. Click pause button
8. Wait 5 seconds
9. Assert: still showing second photo (paused)
10. Click next button
11. Assert: advances to third photo
12. Click play button
13. Assert: auto-advance resumes
14. Press Escape
15. Assert: exits slideshow, returns to album page
```

#### E2E-PUB-05: Playlist Mode (Multi-Album Slideshow)

```
Steps:
1. Navigate to landing page
2. Queue album A for playlist (via UI mechanism -- button, checkbox, etc.)
3. Queue album B for playlist
4. Start playlist
5. Assert: plays through all photos in album A
6. Assert: seamlessly transitions to first photo of album B
7. Assert: progress indicator shows current album name
8. Let it reach last photo of album B
9. Assert: loops back to album A OR stops (document chosen behavior)
```

#### E2E-PUB-06: Mobile Swipe in Lightbox

```
Config: Use Playwright mobile viewport (e.g., iPhone 14 -- 390x844)

Steps:
1. Open lightbox on a photo
2. Perform swipe-left gesture (touch start at x=300, move to x=50)
3. Assert: advances to next photo
4. Perform swipe-right gesture
5. Assert: returns to previous photo
```

#### E2E-PUB-07: Mobile Swipe in Slideshow

```
Config: Mobile viewport

Steps:
1. Enter slideshow
2. Swipe left
3. Assert: advances to next photo
4. Swipe right
5. Assert: goes to previous photo
```

### 4.2 Admin Flows

All admin tests begin by authenticating with the test admin token.

#### E2E-ADM-01: Admin Login

```
Steps:
1. Navigate to "/admin"
2. Assert: login form is displayed
3. Enter invalid token "wrong-token"
4. Click "Log In"
5. Assert: error message "Invalid credentials" displayed
6. Enter valid test token
7. Click "Log In"
8. Assert: redirected to admin dashboard
9. Assert: album list is visible
```

#### E2E-ADM-02: Create New Album

```
Steps:
1. Log in as admin
2. Click "New Album" button
3. Fill in title: "Test Album E2E"
4. Assert: slug auto-generates as "test-album-e2e"
5. Fill in description: "Created by Playwright"
6. Click "Create"
7. Assert: success notification shown
8. Assert: new album appears in album list
9. Navigate to "/albums/test-album-e2e"
10. Assert: public album page loads with correct title
11. Assert: empty state message shown (no photos yet)
```

#### E2E-ADM-03: Upload Photos to Album

```
Steps:
1. Log in, navigate to album management page
2. Assert: upload area is visible
3. Use Playwright's setInputFiles to select 3 test JPEG files
4. Assert: upload progress indicators appear for each file
5. Assert: all 3 uploads complete (progress reaches 100%)
6. Assert: photo grid now shows 3 thumbnails
7. Assert: each thumbnail loads a valid image (naturalWidth > 0)
```

#### E2E-ADM-04: Drag-and-Drop File Upload

```
Steps:
1. Log in, navigate to album management page
2. Simulate drag-and-drop of 2 image files onto the upload zone
3. Assert: drop zone highlights on dragover
4. Assert: uploads begin on drop
5. Assert: both photos appear in grid after upload completes
```

#### E2E-ADM-05: Reorder Photos via Drag-and-Drop

```
Steps:
1. Log in, navigate to album with 3 photos
2. Note the order: [Photo A, Photo B, Photo C]
3. Drag Photo C to the first position
4. Assert: grid now shows [Photo C, Photo A, Photo B]
5. Refresh page
6. Assert: order persists as [Photo C, Photo A, Photo B]
```

#### E2E-ADM-06: Set Album Cover Photo

```
Steps:
1. Log in, navigate to album with 3 photos
2. Click "Set as Cover" on the 2nd photo
3. Assert: cover badge appears on 2nd photo
4. Navigate to album list
5. Assert: album thumbnail shows the 2nd photo
```

#### E2E-ADM-07: Edit Photo Caption

```
Steps:
1. Log in, navigate to album with photos
2. Click on a photo to open its edit panel
3. Enter caption: "Sunset at Half Dome"
4. Click "Save"
5. Assert: caption saved (UI confirms)
6. Navigate to public album page
7. Open lightbox on that photo
8. Assert: caption "Sunset at Half Dome" is displayed
```

#### E2E-ADM-08: Bulk Select and Delete Photos

```
Steps:
1. Log in, navigate to album with 5 photos
2. Enter selection mode (checkbox UI or shift-click)
3. Select photos 1, 3, and 5
4. Assert: "3 selected" indicator visible
5. Click "Delete Selected"
6. Assert: confirmation dialog appears
7. Confirm deletion
8. Assert: grid now shows 2 photos
9. Refresh page
10. Assert: still 2 photos (deletion persisted)
```

#### E2E-ADM-09: Delete Album

```
Steps:
1. Log in, navigate to album list
2. Note: album "Test Album" has 3 photos
3. Click "Delete" on "Test Album"
4. Assert: confirmation dialog warns about 3 photos being deleted
5. Confirm
6. Assert: album removed from list
7. Navigate to "/albums/test-album"
8. Assert: 404 page shown
```

#### E2E-ADM-10: Mark Album as Hero

```
Steps:
1. Log in, ensure two albums exist: A and B
2. Toggle album A as hero
3. Assert: album A shows hero badge
4. Navigate to "/" (public landing page)
5. Assert: hero section displays photos from album A
6. Return to admin, toggle album B as hero
7. Assert: album B shows hero badge, album A does NOT
8. Navigate to "/"
9. Assert: hero section now displays photos from album B
```

#### E2E-ADM-11: Update Site Settings

```
Steps:
1. Log in, navigate to site settings
2. Change site title to "Jane's Gallery"
3. Change site description to "Fine art photography"
4. Click "Save"
5. Assert: success notification
6. Navigate to "/" (public landing page)
7. Assert: page title (document.title or <h1>) contains "Jane's Gallery"
8. Assert: description/subtitle shows "Fine art photography"
```

---

## 5. Visual/Responsive Tests

Use Playwright's screenshot comparison with threshold-based matching.

| # | Test Case | Viewport | Steps | Assertion |
|---|-----------|----------|-------|-----------|
| VIS-01 | Photo grid at mobile width | 375x667 (iPhone SE) | Load album with 8 photos | Grid renders as single column. Screenshots match baseline within 1% threshold. |
| VIS-02 | Photo grid at tablet width | 768x1024 (iPad) | Load album with 8 photos | Grid renders as 2-3 columns. No overflow or horizontal scroll. |
| VIS-03 | Photo grid at desktop width | 1440x900 | Load album with 8 photos | Grid renders as 3-4 columns. Generous whitespace. |
| VIS-04 | Lightbox on mobile | 375x667 | Open lightbox | Image fills viewport width. Controls are visible and have minimum 44px touch targets. |
| VIS-05 | Lightbox on desktop | 1440x900 | Open lightbox | Image centered with padding. Close button and navigation arrows visible. |
| VIS-06 | Admin upload on mobile | 375x667 | Navigate to upload area | Upload button and progress indicators usable. No elements overflow viewport. |
| VIS-07 | Slideshow controls auto-hide | 1440x900 | Enter slideshow, wait 3 seconds (no interaction) | Controls fade out. Move mouse. Controls fade back in. |
| VIS-08 | BlurHash placeholder rendering | 1440x900 | Throttle network to Slow 3G. Load album page. | BlurHash placeholders visible in grid cells before real images load. Placeholders are colored (not grey/white). |
| VIS-09 | Empty album state | 1440x900 | Navigate to album with 0 photos | Friendly empty state message. No broken grid layout. |
| VIS-10 | Hero section on landing page | 1440x900 | Load landing page with hero album | Hero images display edge-to-edge or within defined bounds. Transition between images is smooth. |

---

## 6. Performance Tests

### Page Load

| # | Test Case | Conditions | Target | How to Measure |
|---|-----------|-----------|--------|----------------|
| PERF-01 | Album page with 100 photos - LCP | Simulated 3G (Playwright network throttling) | < 2.0 seconds | Playwright `page.evaluate` reading `PerformanceObserver` for LCP. |
| PERF-02 | Landing page - LCP | Simulated 3G | < 2.5 seconds | Same as above. |
| PERF-03 | Album page - Total page weight | No throttling | < 500KB initial load (before lazy images) | Sum of all transferred resources via `page.on('response')`. |

### Lazy Loading

| # | Test Case | Setup | Steps | Assertion |
|---|-----------|-------|-------|-----------|
| PERF-04 | Only visible images load initially | Album with 50 photos | Load page. Immediately count network requests for images. | Only images in the viewport + 1 row below have loaded. Remaining images have NOT been requested. |
| PERF-05 | Scroll triggers lazy load | Album with 50 photos | Load page. Scroll down 2 viewport heights. | Additional image requests fire for newly visible rows. |

### Slideshow Preloading

| # | Test Case | Setup | Steps | Assertion |
|---|-----------|-------|-------|-----------|
| PERF-06 | Preloads next 2 images | Album with 10 photos, slideshow started | On photo 1, intercept network requests. | Requests fired for photos 2 and 3 (display-size variants). |
| PERF-07 | Preloads on advance | Move to photo 2 in slideshow | Check network requests. | Photo 4 begins loading (staying 2 ahead). |

### Upload Pipeline

| # | Test Case | Setup | Steps | Target |
|---|-----------|-------|-------|--------|
| PERF-08 | 10-photo batch upload | 10 JPEG files at ~3MB each | Upload all 10 via admin UI | All 10 complete within 30 seconds on broadband (simulated 50 Mbps). |
| PERF-09 | Client pre-resize performance | One 50MB RAW-quality JPEG (8000x6000) | Upload via admin UI | Client-side resize completes in < 3 seconds. Uploaded file is < 5MB. |

### Database Performance

| # | Test Case | Setup | Steps | Target |
|---|-----------|-------|-------|--------|
| PERF-10 | List albums with counts | 20 albums, 1000 photos total | `GET /api/albums` (with photo counts) | Response time < 50ms. |
| PERF-11 | List photos in large album | Album with 200 photos | `GET /api/albums/[slug]` | Response time < 100ms. |
| PERF-12 | Reorder in large album | Album with 200 photos | `PUT /api/albums/[id]/photos/reorder` with all 200 IDs | Response time < 200ms. |

---

## 7. Edge Cases and Error Scenarios

### File Upload Edge Cases

| # | Test Case | Setup | Action | Expected Result |
|---|-----------|-------|--------|-----------------|
| EDGE-01 | Upload 0-byte file | Auth, album exists | Upload empty file | 400 response: "File is empty". No DB record created. No storage artifacts. |
| EDGE-02 | Upload non-image file (PDF) | Auth, album exists | Upload `test.pdf` with `application/pdf` MIME type | 400 response: "Invalid file type. Accepted: JPEG, PNG, WebP, HEIC". |
| EDGE-03 | Upload non-image with spoofed MIME | Auth, album exists | Upload text file with MIME set to `image/jpeg` | 400 response. Server validates file magic bytes, not just MIME header. |
| EDGE-04 | Upload extremely large image (50MB+) | Auth, album exists | Upload 50MB JPEG | Either: succeeds with client pre-resize reducing size before upload, OR returns 413 "File too large" if server-side limit hit. Define max upload size (e.g., 20MB after client resize). |
| EDGE-05 | Network interruption mid-upload | Auth, album exists | Start upload, kill connection at 50% | No partial DB record created. No orphaned files in storage. Client shows error with retry option. |
| EDGE-06 | Duplicate filenames in same album | Auth, album with `sunset.jpg` | Upload another `sunset.jpg` | Succeeds. Storage key is unique (e.g., UUID-based). Both photos coexist. |
| EDGE-07 | Concurrent uploads to same album | Auth, album exists | Upload 5 photos simultaneously (parallel requests) | All 5 succeed. All have unique sortOrder values. No race conditions in sort order assignment. |

### Album Edge Cases

| # | Test Case | Setup | Action | Expected Result |
|---|-----------|-------|--------|-----------------|
| EDGE-08 | Album with 0 photos - public view | Album exists, no photos | Navigate to `/albums/[slug]` | Page renders with empty state: "No photos in this album yet" or similar. No errors. No broken grid. |
| EDGE-09 | Album slug collision | Album `"travel"` exists | Create album, manually set slug to `"travel"` | 409 error returned. Alternatively, auto-append suffix: `"travel-2"`. |
| EDGE-10 | Delete cover photo of album | Album with coverPhotoId set to photo X | Delete photo X | Album's `coverPhotoId` set to `null` or auto-set to first remaining photo. No dangling reference. |
| EDGE-11 | Delete only photo in hero album | Hero album with 1 photo | Delete that photo | Hero album becomes empty. Landing page handles gracefully (no broken image, shows fallback or hides hero section). |
| EDGE-12 | Album title with special characters | Auth | Create album with title `"Caf & 'Friends' <2025>"` | Title stored and displayed correctly. No XSS. Slug auto-generated safely (e.g., `cafe-friends-2025`). |

### Navigation Edge Cases

| # | Test Case | Setup | Action | Expected Result |
|---|-----------|-------|--------|-----------------|
| EDGE-13 | Browser back during slideshow | In slideshow mode, 3 photos deep | Press browser back button | Exits slideshow, returns to album page (not 3 pages back). Uses `history.pushState` or `popstate` handler. |
| EDGE-14 | Browser forward after leaving slideshow | Exited slideshow via back button | Press browser forward button | Returns to slideshow at the same photo (or re-enters slideshow). No broken state. |
| EDGE-15 | Direct URL to album that doesn't exist | N/A | Navigate to `/albums/nonexistent-slug` | 404 page with friendly message. Not a server error (500). |
| EDGE-16 | Fullscreen API blocked | Browser has fullscreen disabled | Enter slideshow | Slideshow works in non-fullscreen mode. No unhandled error. UI does not show fullscreen button (or shows it greyed out). |

---

## 8. Accessibility Tests

Use a combination of automated tooling (`axe-core` via `@axe-core/playwright`) and manual Playwright assertions.

### Keyboard Navigation

| # | Test Case | Steps | Assertion |
|---|-----------|-------|-----------|
| A11Y-01 | Tab through album grid | Press Tab repeatedly on album page | Focus moves to each photo thumbnail in order. Focus ring is visible. |
| A11Y-02 | Enter opens lightbox | Focus on a thumbnail, press Enter | Lightbox opens showing that photo. |
| A11Y-03 | Lightbox keyboard controls | Open lightbox | ArrowLeft/Right navigates. Escape closes. Tab cycles through close button and controls only (focus trapped). |
| A11Y-04 | Slideshow keyboard controls | Enter slideshow | Space toggles play/pause. ArrowLeft/Right navigates. Escape exits. |
| A11Y-05 | Admin forms keyboard accessible | Navigate to admin create album form | Tab through all fields. Submit with Enter. Error messages associated with fields. |
| A11Y-06 | Skip to main content | Load any page, press Tab once | "Skip to main content" link appears and is functional. |

### Focus Management

| # | Test Case | Steps | Assertion |
|---|-----------|-------|-----------|
| A11Y-07 | Focus trapped in lightbox | Open lightbox, press Tab repeatedly | Focus cycles through lightbox controls only. Cannot Tab to elements behind the overlay. |
| A11Y-08 | Focus restored on lightbox close | Open lightbox from 3rd thumbnail, close it | Focus returns to the 3rd thumbnail (the trigger element). |
| A11Y-09 | Focus trapped in slideshow | Enter slideshow, press Tab | Focus stays within slideshow controls. |

### Screen Reader Support

| # | Test Case | Steps | Assertion |
|---|-----------|-------|-----------|
| A11Y-10 | Photo thumbnails have alt text | Inspect photo `<img>` elements | Every `<img>` has `alt` attribute. If photo has a caption, `alt` matches caption. If no caption, `alt` is descriptive (e.g., "Photo 3 in Landscapes album"). |
| A11Y-11 | Lightbox announces content | Open lightbox | `aria-label` or `role="dialog"` with `aria-labelledby` on lightbox container. Live region announces photo change. |
| A11Y-12 | Slideshow announces transitions | Advance in slideshow | `aria-live="polite"` region announces "Photo 3 of 15" or similar. |
| A11Y-13 | Upload progress announced | Upload a photo | Progress percentage announced via `aria-live` or `role="progressbar"` with `aria-valuenow`. |

### Standards Compliance

| # | Test Case | Steps | Assertion |
|---|-----------|-------|-----------|
| A11Y-14 | axe-core scan: landing page | Run `axe.run()` on landing page | Zero violations at WCAG AA level. |
| A11Y-15 | axe-core scan: album page | Run `axe.run()` on album page | Zero violations. |
| A11Y-16 | axe-core scan: admin dashboard | Run `axe.run()` on admin dashboard | Zero violations. |
| A11Y-17 | Color contrast | Inspect all text elements | All text meets WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text). |
| A11Y-18 | Reduced motion | Set `prefers-reduced-motion: reduce` in Playwright | Hero image cycling is disabled (static image). Slideshow does not auto-advance (or uses crossfade instead of slide animation). Lightbox transitions are instant. |

---

## 9. Security Tests

### Authentication and Authorization

| # | Test Case | Action | Expected Result |
|---|-----------|--------|-----------------|
| SEC-01 | Admin routes require auth | `GET /api/admin/*` with no token | All admin API routes return 401. |
| SEC-02 | Upload requires auth | `POST /api/albums/[id]/photos` with no token | 401 response. No file processed or stored. |
| SEC-03 | Delete album requires auth | `DELETE /api/albums/[id]` with no token | 401 response. Album unchanged. |
| SEC-04 | Delete photo requires auth | `DELETE /api/photos/[id]` with no token | 401 response. Photo unchanged. |
| SEC-05 | Reorder requires auth | `PUT /api/albums/[id]/photos/reorder` with no token | 401 response. |
| SEC-06 | Config update requires auth | `PUT /api/config` with no token | 401 response. |
| SEC-07 | Invalid token rejected | `POST /api/albums` with `Authorization: Bearer wrong-token` | 401 response. |
| SEC-08 | Public routes accessible without auth | `GET /api/albums`, `GET /api/albums/[slug]`, `GET /api/config` | 200 responses without auth token. |

### File Upload Security

| # | Test Case | Action | Expected Result |
|---|-----------|--------|-----------------|
| SEC-09 | Rejects non-image MIME types | Upload file with `Content-Type: application/javascript` | 400 response. File not stored. |
| SEC-10 | Validates file magic bytes | Upload `.js` file renamed to `.jpg` with `image/jpeg` MIME | 400 response. Server checks actual file content, not just headers. |
| SEC-11 | No path traversal in storage keys | Upload with filename `"../../../etc/passwd"` | Storage key is sanitized. File stored safely within designated storage path. |
| SEC-12 | No path traversal in album slug | Create album with slug `"../../admin"` | Slug is sanitized or rejected. Cannot create route collision. |
| SEC-13 | File size limit enforced | Upload 100MB file | 413 response. Server does not OOM. Connection closed gracefully. |

### XSS Prevention

| # | Test Case | Action | Expected Result |
|---|-----------|--------|-----------------|
| SEC-14 | XSS in album title | Create album with title `<script>alert('xss')</script>` | Title stored as text. Rendered as escaped HTML on page. No script execution. |
| SEC-15 | XSS in album description | Set description to `<img src=x onerror=alert(1)>` | Rendered as text. No `<img>` tag injected in DOM. |
| SEC-16 | XSS in photo caption | Set caption to `"><script>alert(1)</script>` | Caption displayed as literal text. No script execution. |
| SEC-17 | XSS in site title | Set site title to `<script>document.cookie</script>` | Rendered safely as text in all locations (title tag, page header). |

### CSRF Protection

| # | Test Case | Action | Expected Result |
|---|-----------|--------|-----------------|
| SEC-18 | Mutation endpoints reject missing content-type | `POST /api/albums` with no `Content-Type` header | 400 response. |
| SEC-19 | API routes use proper CORS headers | `OPTIONS` preflight request from foreign origin | Response does not include `Access-Control-Allow-Origin: *` for mutation endpoints. |

---

## 10. Test Data

### Fixture Images

Store in `test/fixtures/images/`:

| Filename | Format | Dimensions | Size | Notes |
|----------|--------|-----------|------|-------|
| `landscape-4k.jpg` | JPEG | 4000x3000 | ~2MB | Standard landscape with full EXIF data (camera, lens, GPS, exposure) |
| `portrait-4k.jpg` | JPEG | 3000x4000 | ~2MB | Portrait orientation |
| `square.jpg` | JPEG | 2000x2000 | ~1MB | Square crop |
| `panoramic.jpg` | JPEG | 6000x2000 | ~2MB | Ultra-wide aspect ratio |
| `small-image.jpg` | JPEG | 300x200 | ~30KB | Below thumbnail size (tests no-upscale behavior) |
| `transparent.png` | PNG | 1000x1000 | ~500KB | PNG with alpha channel |
| `modern.webp` | WebP | 2000x1500 | ~200KB | WebP input format |
| `iphone.heic` | HEIC | 4032x3024 | ~3MB | iPhone HEIC capture |
| `no-exif.jpg` | JPEG | 1000x1000 | ~100KB | JPEG with all EXIF stripped |
| `corrupt.jpg` | - | - | ~1KB | Invalid file with .jpg extension |
| `zero-byte.jpg` | - | 0x0 | 0 bytes | Empty file |
| `not-an-image.pdf` | PDF | - | ~50KB | PDF file for rejection testing |
| `large-image.jpg` | JPEG | 8000x6000 | ~15MB | Large file for client pre-resize testing |
| `special-chars.jpg` | JPEG | 1000x1000 | ~100KB | Filename with spaces and unicode for sanitization testing |

### Seed Data Script

Location: `test/seed.ts`

```typescript
// Pseudo-code for seed script
export async function seedTestData(db: Database) {
  // Clear all existing data
  await db.delete(photos);
  await db.delete(albums);
  await db.delete(siteConfig);

  // Seed site config
  await db.insert(siteConfig).values({
    siteTitle: "Test Gallery",
    siteDescription: "A test photography portfolio",
    ownerName: "Test Photographer",
  });

  // Seed albums
  const landscapeAlbum = await db.insert(albums).values({
    title: "Landscapes",
    slug: "landscapes",
    description: "Mountain and nature photography",
    isHero: true,
    sortOrder: 0,
  }).returning();

  const portraitAlbum = await db.insert(albums).values({
    title: "Portraits",
    slug: "portraits",
    description: "Portrait photography",
    isHero: false,
    sortOrder: 1,
  }).returning();

  const emptyAlbum = await db.insert(albums).values({
    title: "Empty Album",
    slug: "empty-album",
    description: "Album with no photos for edge case testing",
    isHero: false,
    sortOrder: 2,
  }).returning();

  // Seed photos for landscapes (8 photos)
  for (let i = 0; i < 8; i++) {
    await db.insert(photos).values({
      albumId: landscapeAlbum[0].id,
      filename: `landscape-${i + 1}.jpg`,
      storageKey: `albums/${landscapeAlbum[0].id}/landscape-${i + 1}`,
      width: 4000,
      height: 3000,
      blurHash: "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
      caption: i === 0 ? "Yosemite Valley at Sunrise" : null,
      sortOrder: i,
      exif: {
        camera: "Sony A7III",
        lens: "24-70mm f/2.8",
        iso: 200,
        aperture: "f/8",
        shutterSpeed: "1/250",
      },
    });
  }

  // Seed photos for portraits (5 photos)
  for (let i = 0; i < 5; i++) {
    await db.insert(photos).values({
      albumId: portraitAlbum[0].id,
      filename: `portrait-${i + 1}.jpg`,
      storageKey: `albums/${portraitAlbum[0].id}/portrait-${i + 1}`,
      width: 3000,
      height: 4000,
      blurHash: "LKO2?U%2Tw=w]~RBVZRi};RPxuwH",
      caption: null,
      sortOrder: i,
      exif: {
        camera: "Canon EOS R5",
        lens: "85mm f/1.4",
        iso: 400,
        aperture: "f/1.4",
        shutterSpeed: "1/500",
      },
    });
  }

  // Set cover photos
  // (Would query first photo of each album and set as cover)
}
```

### Test State Reset

**Between E2E test files:**
- Each test file calls `seedTestData()` in its `beforeAll` hook via an API endpoint or direct DB access.
- Storage directory is wiped and re-populated with fixture images mapped to seed photo storage keys.

**Between individual E2E tests:**
- Tests that modify data (admin CRUD) run in serial within their file.
- Read-only tests (public visitor flows) run in parallel.
- Tests that create albums or photos clean up after themselves in `afterEach` if they don't rely on the full re-seed.

**Reset endpoint (dev/test only):**
```
POST /api/test/reset
```
- Protected by `NODE_ENV === 'test'` check.
- Drops and re-seeds all data.
- Returns 200 when complete.

### Environment Variables for Test

```env
# .env.test
DATABASE_URL="file:./test.db"
STORAGE_ADAPTER="filesystem"
STORAGE_ROOT="/tmp/pmf-test-storage"
ADMIN_TOKEN="test-admin-token-12345"
SITE_URL="http://localhost:3000"
NODE_ENV="test"
```

---

## Appendix: Test File Organization

```
test/
  fixtures/
    images/              # Test image files (see table above)
  helpers/
    setup.ts             # Global test setup (DB init, storage init)
    factories.ts         # Factory functions for creating test data
    auth.ts              # Helper to create authenticated requests
    storage-mock.ts      # Filesystem storage adapter for tests
  unit/
    db/
      albums.test.ts
      photos.test.ts
      site-config.test.ts
      sort-order.test.ts
    image/
      processing.test.ts
      exif.test.ts
      blurhash.test.ts
    storage/
      storage.test.ts
    api/
      albums.test.ts
      photos.test.ts
      config.test.ts
      bulk-operations.test.ts
  integration/
    upload-pipeline.test.ts
    delete-cascade.test.ts
    hero-album.test.ts
    cover-photo.test.ts
  e2e/
    public/
      landing.spec.ts
      album-view.spec.ts
      lightbox.spec.ts
      slideshow.spec.ts
      playlist.spec.ts
    admin/
      login.spec.ts
      album-crud.spec.ts
      photo-upload.spec.ts
      photo-management.spec.ts
      site-settings.spec.ts
    visual/
      responsive.spec.ts
      animations.spec.ts
    accessibility/
      keyboard-nav.spec.ts
      screen-reader.spec.ts
      axe-scan.spec.ts
    performance/
      page-load.spec.ts
      lazy-loading.spec.ts
      upload-speed.spec.ts
    security/
      auth.spec.ts
      file-upload.spec.ts
      xss.spec.ts
  seed.ts                # Seed script (see above)
```

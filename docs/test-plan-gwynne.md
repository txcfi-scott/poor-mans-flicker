# Poor Man's Flickr -- QA Test Plan

**Author:** Gwynne (QA Manager)
**Version:** 1.0
**Date:** 2026-03-05
**Covers:** Phases 1-5 (Scaffold through Public Gallery)

---

## Table of Contents

1. [Smoke Tests](#1-smoke-tests)
2. [Regression Test Cases](#2-regression-test-cases)
   - [Image Pipeline](#21-image-pipeline)
   - [Album Management](#22-album-management)
   - [Photo Management](#23-photo-management)
   - [Public Gallery (Phase 5)](#24-public-gallery-phase-5)
   - [Auth & Middleware](#25-auth--middleware)
   - [API Endpoints](#26-api-endpoints)
3. [Test Automation Strategy](#3-test-automation-strategy)

---

## 1. Smoke Tests

These run after every deploy. If any fail, roll back immediately via Vercel dashboard.

| ID | Check | Method | Pass Criteria |
|----|-------|--------|---------------|
| SMOKE-01 | Home page loads | GET `/` | HTTP 200, renders without JS errors, hero section visible |
| SMOKE-02 | Albums page loads | GET `/albums` | HTTP 200, album grid renders (or empty state if no albums) |
| SMOKE-03 | Album detail loads | GET `/albums/{known-slug}` | HTTP 200, photo grid renders with at least one photo |
| SMOKE-04 | Admin login page loads | GET `/login` | HTTP 200, login form renders |
| SMOKE-05 | Admin login works | POST `/api/auth/login` with valid token | Returns session cookie, redirects to `/admin` |
| SMOKE-06 | Admin dashboard loads (authed) | GET `/admin` with valid session | HTTP 200, dashboard renders |
| SMOKE-07 | Albums API responds | GET `/api/albums` | HTTP 200, returns JSON array |
| SMOKE-08 | Config API responds | GET `/api/config` | HTTP 200, returns JSON with `siteTitle` |
| SMOKE-09 | Photo upload works | POST `/api/albums/{id}/photos` with small JPEG | HTTP 200, returns photo object with `blurhash` |
| SMOKE-10 | R2 images accessible | GET `{R2_PUBLIC_URL}/{known-storage-key}/thumb.webp` | HTTP 200, content-type `image/webp` |

**How to run:** A simple shell script or Playwright test suite that hits each endpoint sequentially. Target: under 30 seconds.

---

## 2. Regression Test Cases

### 2.1 Image Pipeline

#### Upload & Processing

| ID | Description | Steps | Expected Result | Priority |
|----|-------------|-------|-----------------|----------|
| IMG-001 | Upload single JPEG photo | 1. Auth as admin 2. POST multipart to `/api/albums/{id}/photos` with a 4000x3000 JPEG 3. Check response | Returns photo object with `id`, `width: 4000`, `height: 3000`, `blurhash` (non-empty string), `storageKey` matching `albums/{albumId}/{photoId}` | P0 |
| IMG-002 | Three WebP variants created in R2 | 1. Upload a photo 2. List R2 objects under `{storageKey}/` | Three keys: `thumb.webp`, `display.webp`, `full.webp`. All have content-type `image/webp`. | P0 |
| IMG-003 | Thumbnail is max 400px wide | 1. Upload a landscape photo 2. Download `thumb.webp` 3. Read dimensions with Sharp | Width is 400px (or original width if smaller). Aspect ratio preserved. | P0 |
| IMG-004 | Display variant is max 1600px wide | 1. Upload a landscape photo 2. Download `display.webp` 3. Read dimensions | Width is 1600px. Aspect ratio preserved. | P0 |
| IMG-005 | Full variant is max 2400px wide | 1. Upload a photo 2. Download `full.webp` 3. Read dimensions | Width is 2400px. Aspect ratio preserved. | P1 |
| IMG-006 | Portrait orientation handled | 1. Upload a 3000x4000 portrait photo | All variants have correct portrait dimensions. Height is the constrained axis. | P0 |
| IMG-007 | Small image not upscaled | 1. Upload a 300x200 image | All three variants are 300x200 (not enlarged). | P1 |
| IMG-008 | PNG input accepted | 1. Upload a PNG file | Succeeds. Three WebP variants created. | P1 |
| IMG-009 | WebP input accepted | 1. Upload a WebP file | Succeeds. Three WebP variants created. | P1 |
| IMG-010 | HEIC input accepted | 1. Upload a HEIC file (iPhone photo) | Succeeds. Three WebP variants created. | P1 |
| IMG-011 | Unsupported format rejected | 1. Upload a BMP or GIF file | HTTP 400 with descriptive error. | P1 |
| IMG-012 | File over 20MB rejected | 1. Upload a file larger than 20MB | HTTP 400 with `MAX_UPLOAD_SIZE` error. | P0 |
| IMG-013 | More than 10 files rejected | 1. Upload 11 files in one request | HTTP 400 with `MAX_FILES_PER_UPLOAD` error. | P1 |

#### BlurHash Generation

| ID | Description | Steps | Expected Result | Priority |
|----|-------------|-------|-----------------|----------|
| IMG-020 | BlurHash generated on upload | 1. Upload a photo 2. Check response `blurhash` field | Non-empty string, valid BlurHash format (starts with alphanumeric, reasonable length 20-40 chars) | P0 |
| IMG-021 | BlurHash is deterministic | 1. Upload the same image twice to different albums | Both photos have identical `blurhash` values. | P2 |
| IMG-022 | BlurHash renders as placeholder | 1. Load album page 2. Observe image loading behavior | BlurHash placeholder appears before image loads (manual/visual check). | P1 |

#### EXIF Extraction

| ID | Description | Steps | Expected Result | Priority |
|----|-------------|-------|-----------------|----------|
| IMG-030 | EXIF extracted from JPEG | 1. Upload a JPEG with EXIF data 2. Check `exifJson` in response | JSON string containing camera model, lens, ISO, aperture, shutter speed (whichever are present in the file). | P1 |
| IMG-031 | EXIF-less image handled | 1. Upload a PNG with no EXIF | `exifJson` is null or empty object. No error. | P1 |
| IMG-032 | EXIF displayed in photo edit modal | 1. Upload JPEG with EXIF 2. Open photo edit modal in admin | Camera, lens, and exposure info displayed. | P2 |

#### Deletion & R2 Cleanup

| ID | Description | Steps | Expected Result | Priority |
|----|-------------|-------|-----------------|----------|
| IMG-040 | Single photo delete removes R2 objects | 1. Upload a photo, note storageKey 2. DELETE `/api/photos/{id}` 3. List R2 objects under storageKey | HTTP 204. No objects remain in R2 under that prefix. DB record gone. | P0 |
| IMG-041 | Album delete removes all R2 objects | 1. Create album, upload 3 photos 2. DELETE `/api/albums/{id}` 3. List R2 objects for all three storageKeys | HTTP 204. All R2 objects for all three photos removed. All DB records gone. | P0 |
| IMG-042 | R2 failure does not block DB delete | 1. Upload a photo 2. Make R2 unreachable (or manually delete R2 objects first) 3. DELETE `/api/photos/{id}` | HTTP 204. DB record deleted even though R2 cleanup failed (logged as error). | P1 |

---

### 2.2 Album Management

#### CRUD Operations

| ID | Description | Steps | Expected Result | Priority |
|----|-------------|-------|-----------------|----------|
| ALB-001 | Create album | 1. POST `/api/albums` with `{ title: "Landscapes" }` | HTTP 200. Returns album with `id`, `slug: "landscapes"`, `isPublic: true`, `isHero: false`, `sortOrder` assigned. | P0 |
| ALB-002 | Create album generates unique slug | 1. Create album "My Trip" 2. Create album "My Trip" again | Second album gets a unique slug (e.g., `my-trip-1` or error if duplicate). | P0 |
| ALB-003 | Get album by ID | 1. Create album 2. GET `/api/albums/{id}` | Returns album with all fields and photos array. | P0 |
| ALB-004 | Get nonexistent album | 1. GET `/api/albums/nonexistent-id` | HTTP 404 with `ALBUM_NOT_FOUND` error code. | P1 |
| ALB-005 | Update album title | 1. Create album 2. PATCH `/api/albums/{id}` with `{ title: "New Title" }` | Title updated. Slug regenerated from new title. `updatedAt` changed. | P0 |
| ALB-006 | Update album description | 1. PATCH album with `{ description: "Beautiful scenery" }` | Description updated. Other fields unchanged. | P1 |
| ALB-007 | Toggle album public/private | 1. PATCH album with `{ isPublic: false }` 2. GET `/api/albums` (public) | Album no longer appears in public album list. | P0 |
| ALB-008 | Delete album | 1. Create album with photos 2. DELETE `/api/albums/{id}` | HTTP 204. Album gone. All photos cascade-deleted from DB. R2 objects cleaned up. | P0 |
| ALB-009 | Delete nonexistent album | 1. DELETE `/api/albums/nonexistent` | HTTP 404. | P1 |
| ALB-010 | Title validation -- empty | 1. POST `/api/albums` with `{ title: "" }` | HTTP 400 with validation error. | P1 |
| ALB-011 | Title validation -- too long | 1. POST `/api/albums` with title > 200 chars | HTTP 400 with `INVALID_TITLE` error. | P2 |

#### Reordering

| ID | Description | Steps | Expected Result | Priority |
|----|-------------|-------|-----------------|----------|
| ALB-020 | Reorder albums | 1. Create albums A, B, C (sortOrder 0, 1, 2) 2. PUT `/api/albums/reorder` with `[C.id, A.id, B.id]` | C.sortOrder=0, A.sortOrder=1, B.sortOrder=2. GET `/api/albums` returns in new order. | P0 |
| ALB-021 | Reorder persists across requests | 1. Reorder albums 2. Reload admin page | Albums display in the reordered sequence. | P1 |

#### Cover Photo

| ID | Description | Steps | Expected Result | Priority |
|----|-------------|-------|-----------------|----------|
| ALB-030 | Set cover photo | 1. Upload photo to album 2. PUT `/api/albums/{id}/cover` with `{ photoId }` | Album's `coverPhotoId` set. Album card on public page shows that photo. | P0 |
| ALB-031 | Cover photo cleared on photo delete | 1. Set cover photo 2. Delete that photo | Album's `coverPhotoId` is null. | P0 |
| ALB-032 | Cover photo cleared on bulk delete | 1. Set cover photo 2. Bulk delete including that photo | Album's `coverPhotoId` is null. | P1 |

#### Hero Carousel

| ID | Description | Steps | Expected Result | Priority |
|----|-------------|-------|-----------------|----------|
| ALB-040 | Set album as hero | 1. PATCH album with `{ isHero: true }` | Album's `isHero` is true. Previous hero album (if any) is set to false. | P0 |
| ALB-041 | Only one hero album at a time | 1. Set album A as hero 2. Set album B as hero | A.isHero=false, B.isHero=true. | P0 |
| ALB-042 | Hero API returns hero photos | 1. Set an album as hero with photos 2. GET `/api/hero` | Returns photos from the hero album. | P0 |

---

### 2.3 Photo Management

#### Upload UI

| ID | Description | Steps | Expected Result | Priority |
|----|-------------|-------|-----------------|----------|
| PHO-001 | Drag-and-drop upload | 1. Navigate to admin album detail 2. Drag 3 JPEG files onto upload zone | Upload progress shown for each file. All three appear in photo grid after completion. | P0 |
| PHO-002 | Click-to-select upload | 1. Click upload zone 2. Select files via file picker | Same result as drag-and-drop. | P0 |
| PHO-003 | Client-side resize before upload | 1. Upload a 6000x4000 JPEG (>4MB) 2. Inspect network request size | Uploaded file is resized to max 4096px dimension and under 4MB. | P1 |
| PHO-004 | Upload progress indicators | 1. Upload a large file | Progress bar or percentage shown during upload. Transitions to completion state. | P1 |
| PHO-005 | Upload error handling | 1. Upload an invalid file type | Error message displayed. Other valid files in the batch still succeed. | P1 |

#### Caption Editing

| ID | Description | Steps | Expected Result | Priority |
|----|-------------|-------|-----------------|----------|
| PHO-010 | Edit photo caption | 1. Click photo in admin grid 2. Edit caption in modal 3. Save | PATCH `/api/photos/{id}` called. Caption updated in DB. Modal reflects new caption. | P0 |
| PHO-011 | Clear photo caption | 1. Set caption to empty string 2. Save | Caption set to null/empty. No error. | P1 |
| PHO-012 | Caption with special characters | 1. Set caption to `"Sunset & Sunrise <2024>"` | Caption saved and displayed correctly, HTML-safe. | P2 |

#### Reordering

| ID | Description | Steps | Expected Result | Priority |
|----|-------------|-------|-----------------|----------|
| PHO-020 | Drag-and-drop reorder photos | 1. Album with 5 photos 2. Drag photo from position 1 to position 4 | PUT `/api/albums/{id}/photos/reorder` called. Photos render in new order. | P0 |
| PHO-021 | Reorder persists on page reload | 1. Reorder photos 2. Reload page | Photos remain in reordered sequence. | P1 |
| PHO-022 | Reorder reflected on public page | 1. Reorder photos in admin 2. View public album page | Photos display in the admin-set order. | P1 |

#### Bulk Operations

| ID | Description | Steps | Expected Result | Priority |
|----|-------------|-------|-----------------|----------|
| PHO-030 | Select multiple photos | 1. Click select mode 2. Click 3 photos | 3 photos highlighted. Bulk action bar appears with count. | P0 |
| PHO-031 | Bulk delete with confirmation | 1. Select 3 photos 2. Click delete 3. Confirm in dialog | All 3 photos deleted from DB and R2. Grid updates to show remaining photos. | P0 |
| PHO-032 | Bulk delete respects max limit | 1. Try to bulk delete > 50 photos | Error message: maximum 50 per request. | P1 |
| PHO-033 | Cancel bulk delete | 1. Select photos 2. Click delete 3. Cancel in confirmation dialog | No photos deleted. Selection remains. | P1 |
| PHO-034 | Deselect all | 1. Select some photos 2. Click "deselect all" or exit select mode | All photos deselected. Bulk action bar hidden. | P2 |

---

### 2.4 Public Gallery (Phase 5)

#### Hero Carousel

| ID | Description | Steps | Expected Result | Priority |
|----|-------------|-------|-----------------|----------|
| GAL-001 | Hero carousel renders on home page | 1. Set an album as hero with 3+ photos 2. Load home page | Hero section visible with a photo displayed. | P0 |
| GAL-002 | Hero carousel auto-cycles | 1. Load home page 2. Wait for `heroIntervalMs` (default 5000ms) | Image transitions to next photo. Cycles through all hero photos. | P0 |
| GAL-003 | Hero carousel with single photo | 1. Hero album has 1 photo | Displays the single photo. No cycling animation (or cycles to itself gracefully). | P1 |
| GAL-004 | Hero carousel with no hero album | 1. No album marked as hero | Home page renders gracefully -- either fallback content or empty hero section. No JS errors. | P0 |
| GAL-005 | Hero carousel crossfade transition | 1. Observe carousel cycling | Smooth crossfade between images (visual check). No flash of empty space. | P2 |

#### Album Listing Page

| ID | Description | Steps | Expected Result | Priority |
|----|-------------|-------|-----------------|----------|
| GAL-010 | Albums page shows public albums | 1. Create 3 public albums, 1 private 2. Load `/albums` | 3 album cards shown. Private album not visible. | P0 |
| GAL-011 | Album card shows cover photo | 1. Album has cover photo set 2. Load `/albums` | Card displays cover photo as thumbnail with BlurHash placeholder during load. | P0 |
| GAL-012 | Album card shows title and description | 1. Album has title and description | Both visible on the card. | P1 |
| GAL-013 | Album card without cover photo | 1. Album with photos but no cover set | Shows first photo or a placeholder. No broken image. | P1 |
| GAL-014 | Empty albums page | 1. No public albums exist | Renders empty state message. No error. | P1 |
| GAL-015 | Albums sorted by sortOrder | 1. Create albums with specific sortOrder 2. Load `/albums` | Albums appear in sortOrder sequence. | P0 |
| GAL-016 | Album card links to detail page | 1. Click an album card | Navigates to `/albums/{slug}`. | P0 |

#### Album Detail / Photo Grid

| ID | Description | Steps | Expected Result | Priority |
|----|-------------|-------|-----------------|----------|
| GAL-020 | Album detail page loads | 1. Navigate to `/albums/{slug}` | Page renders with album title, description, and photo grid. | P0 |
| GAL-021 | Photo grid displays all photos | 1. Album has 10 photos | All 10 photos visible in grid layout. | P0 |
| GAL-022 | Photo grid uses display variant | 1. Inspect image src in grid | Images load from `{storageKey}/display.webp` (or `thumb.webp` for grid). | P1 |
| GAL-023 | BlurHash placeholders shown during load | 1. Throttle network 2. Load album page | BlurHash color placeholders visible before images load. Images replace placeholders smoothly. | P1 |
| GAL-024 | Responsive grid layout -- mobile | 1. View on 375px viewport | Grid adjusts to 1-2 columns. Photos not cropped or overflowing. | P0 |
| GAL-025 | Responsive grid layout -- tablet | 1. View on 768px viewport | Grid adjusts to 2-3 columns. | P1 |
| GAL-026 | Responsive grid layout -- desktop | 1. View on 1440px viewport | Grid uses 3-4+ columns. Good use of space. | P1 |
| GAL-027 | Empty album page | 1. Navigate to public album with 0 photos | Shows empty state message. No broken layout. | P1 |
| GAL-028 | Nonexistent album slug | 1. Navigate to `/albums/does-not-exist` | 404 page displayed. | P0 |
| GAL-029 | Private album not accessible | 1. Navigate to `/albums/{private-album-slug}` | 404 page (or not found). Album should not be exposed publicly. | P0 |

#### Lightbox

| ID | Description | Steps | Expected Result | Priority |
|----|-------------|-------|-----------------|----------|
| GAL-030 | Click photo opens lightbox | 1. Click a photo in the album grid | Lightbox overlay opens with full-size image. Background dimmed. | P0 |
| GAL-031 | Lightbox shows full variant | 1. Open lightbox 2. Inspect image src | Image loaded from `{storageKey}/full.webp` (or `display.webp`). | P1 |
| GAL-032 | Navigate to next photo (click) | 1. Open lightbox 2. Click right arrow / next button | Next photo in album displayed. | P0 |
| GAL-033 | Navigate to previous photo (click) | 1. Open lightbox (not on first photo) 2. Click left arrow / prev button | Previous photo displayed. | P0 |
| GAL-034 | Navigate with keyboard -- ArrowRight | 1. Open lightbox 2. Press ArrowRight | Next photo displayed. | P0 |
| GAL-035 | Navigate with keyboard -- ArrowLeft | 1. Open lightbox 2. Press ArrowLeft | Previous photo displayed. | P0 |
| GAL-036 | Close lightbox -- Escape key | 1. Open lightbox 2. Press Escape | Lightbox closes. Album grid visible. | P0 |
| GAL-037 | Close lightbox -- click backdrop | 1. Open lightbox 2. Click outside the image (on backdrop) | Lightbox closes. | P0 |
| GAL-038 | Close lightbox -- close button | 1. Open lightbox 2. Click X / close button | Lightbox closes. | P1 |
| GAL-039 | Lightbox wraps at end | 1. Open lightbox on last photo 2. Press ArrowRight | Wraps to first photo (or next button disabled -- document which behavior). | P1 |
| GAL-040 | Lightbox wraps at beginning | 1. Open lightbox on first photo 2. Press ArrowLeft | Wraps to last photo (or prev button disabled). | P1 |
| GAL-041 | Lightbox shows caption | 1. Open lightbox on photo with caption | Caption displayed below or over the image. | P2 |
| GAL-042 | Lightbox touch swipe -- mobile | 1. On mobile device 2. Open lightbox 3. Swipe left | Next photo displayed. | P1 |
| GAL-043 | Lightbox touch swipe right -- mobile | 1. Swipe right in lightbox | Previous photo displayed. | P1 |
| GAL-044 | Lightbox preloads adjacent images | 1. Open lightbox 2. Inspect network tab | Next and previous images are preloaded (or begin loading). | P2 |
| GAL-045 | Body scroll locked in lightbox | 1. Open lightbox 2. Try scrolling | Background page does not scroll while lightbox is open. | P1 |

#### Layout Components

| ID | Description | Steps | Expected Result | Priority |
|----|-------------|-------|-----------------|----------|
| GAL-050 | Header renders on all public pages | 1. Visit home, albums, album detail | Header with site title and navigation visible on all pages. | P0 |
| GAL-051 | Footer renders on all public pages | 1. Visit home, albums, album detail | Footer visible at bottom of all pages. | P1 |
| GAL-052 | Navigation links work | 1. Click "Albums" in header from home page | Navigates to `/albums`. | P0 |
| GAL-053 | Active nav state | 1. On `/albums` page | Albums nav link shows active/highlighted state. | P2 |
| GAL-054 | Site title from config | 1. Update site title in admin settings 2. Load public page | Header shows updated site title. | P1 |

---

### 2.5 Auth & Middleware

| ID | Description | Steps | Expected Result | Priority |
|----|-------------|-------|-----------------|----------|
| AUTH-001 | Login with correct token | 1. POST `/api/auth/login` with correct `ADMIN_TOKEN` | Returns success. Sets session cookie. | P0 |
| AUTH-002 | Login with wrong token | 1. POST `/api/auth/login` with wrong token | HTTP 401. No cookie set. | P0 |
| AUTH-003 | Login with empty token | 1. POST `/api/auth/login` with empty string | HTTP 401. | P1 |
| AUTH-004 | Admin pages redirect without auth | 1. Clear cookies 2. Navigate to `/admin` | Redirected to `/login`. | P0 |
| AUTH-005 | Admin API rejects without auth | 1. POST `/api/albums` without session cookie | HTTP 401. | P0 |
| AUTH-006 | Admin API rejects expired session | 1. Use an expired/invalid cookie 2. POST `/api/albums` | HTTP 401. | P1 |
| AUTH-007 | Public pages accessible without auth | 1. No cookies 2. GET `/`, `/albums`, `/albums/{slug}` | All return HTTP 200. | P0 |
| AUTH-008 | Public API accessible without auth | 1. No cookies 2. GET `/api/albums`, `/api/hero`, `/api/config` | All return HTTP 200. | P0 |
| AUTH-009 | Logout clears session | 1. Log in 2. Log out (clear session) 3. Try admin page | Redirected to login. | P1 |

---

### 2.6 API Endpoints

#### Albums API

| ID | Description | Steps | Expected Result | Priority |
|----|-------------|-------|-----------------|----------|
| API-001 | GET `/api/albums` -- public list | 1. GET without auth | Returns array of public albums, sorted by sortOrder. Private albums excluded. | P0 |
| API-002 | GET `/api/albums` with `includePrivate` (authed) | 1. GET with auth and `?includePrivate=true` | Returns all albums including private ones. | P1 |
| API-003 | POST `/api/albums` -- create | 1. POST with auth, `{ title: "New Album" }` | HTTP 200. Album created with auto-generated slug and ID. | P0 |
| API-004 | POST `/api/albums` -- no auth | 1. POST without auth | HTTP 401. | P0 |
| API-005 | PATCH `/api/albums/{id}` -- update | 1. PATCH with auth and valid body | HTTP 200. Fields updated. | P0 |
| API-006 | DELETE `/api/albums/{id}` -- delete | 1. DELETE with auth | HTTP 204. Album and photos gone. | P0 |
| API-007 | PUT `/api/albums/reorder` -- reorder | 1. PUT with auth and array of IDs | HTTP 200. Sort orders updated. | P0 |
| API-008 | PUT `/api/albums/{id}/cover` -- set cover | 1. PUT with auth and `{ photoId }` | HTTP 200. Cover photo set. | P1 |

#### Photos API

| ID | Description | Steps | Expected Result | Priority |
|----|-------------|-------|-----------------|----------|
| API-010 | POST `/api/albums/{id}/photos` -- upload | 1. POST multipart with auth | HTTP 200. Photo created, variants generated. | P0 |
| API-011 | PUT `/api/albums/{id}/photos/reorder` | 1. PUT with auth and ordered array | HTTP 200. Sort orders updated. | P1 |
| API-012 | PATCH `/api/photos/{id}` -- update caption | 1. PATCH with auth and `{ caption }` | HTTP 200. Caption updated. | P1 |
| API-013 | DELETE `/api/photos/{id}` -- single delete | 1. DELETE with auth | HTTP 204. Photo gone from DB and R2. | P0 |
| API-014 | POST `/api/photos/bulk-delete` | 1. POST with auth and `{ photoIds: [...] }` | HTTP 200. All listed photos deleted. | P0 |
| API-015 | POST `/api/photos/bulk-delete` -- empty array | 1. POST with `{ photoIds: [] }` | HTTP 400 with `INVALID_INPUT`. | P1 |
| API-016 | POST `/api/photos/bulk-delete` -- over limit | 1. POST with 51 IDs | HTTP 400 with `TOO_MANY_PHOTOS`. | P1 |

#### Other APIs

| ID | Description | Steps | Expected Result | Priority |
|----|-------------|-------|-----------------|----------|
| API-020 | GET `/api/hero` | 1. GET (no auth needed) | Returns photos from hero album, or empty array if no hero set. | P0 |
| API-021 | GET `/api/config` | 1. GET (no auth needed) | Returns site config object with all fields. | P0 |
| API-022 | PATCH `/api/config` -- update (authed) | 1. PATCH with auth and `{ siteTitle: "New Name" }` | HTTP 200. Config updated. | P1 |
| API-023 | PATCH `/api/config` -- no auth | 1. PATCH without auth | HTTP 401. | P1 |
| API-024 | POST `/api/auth/login` -- valid | 1. POST with correct token | Returns success with session info. | P0 |
| API-025 | POST `/api/auth/login` -- invalid | 1. POST with wrong token | HTTP 401. | P0 |

#### Error Handling

| ID | Description | Steps | Expected Result | Priority |
|----|-------------|-------|-----------------|----------|
| API-030 | Invalid JSON body | 1. POST `/api/albums` with malformed JSON | HTTP 400, not HTTP 500. Descriptive error message. | P1 |
| API-031 | Missing required fields | 1. POST `/api/albums` with empty body `{}` | HTTP 400 with validation error. | P1 |
| API-032 | 404 for unknown routes | 1. GET `/api/nonexistent` | HTTP 404. | P2 |
| API-033 | CORS headers present | 1. OPTIONS request to any API endpoint | Appropriate CORS headers returned (if applicable). | P2 |

---

## 3. Test Automation Strategy

### What Can Be Automated

| Category | Framework | Coverage | Notes |
|----------|-----------|----------|-------|
| **Database queries** | Vitest | Full | Test against local SQLite. All CRUD, cascade deletes, sort order, constraints. Fast, deterministic. |
| **Image processing** | Vitest | Full | Sharp pipeline with fixture images. Verify variant dimensions, WebP output, BlurHash generation, EXIF extraction. |
| **API routes** | Vitest + `next/test` or Playwright API testing | Full | Test each endpoint: success, validation errors, auth enforcement, 404s. Mock storage provider with local filesystem adapter. |
| **Auth flow** | Playwright | Full | Login, logout, protected route redirects, API auth enforcement. |
| **Public pages render** | Playwright | Full | Page loads, correct content, navigation, responsive layouts. |
| **Lightbox navigation** | Playwright | Full | Open, close, keyboard nav, click nav. Touch swipe requires mobile emulation. |
| **Hero carousel** | Playwright | Partial | Verify initial render and auto-cycling. Timing-dependent tests can be flaky. |
| **Drag-and-drop reorder** | Playwright | Partial | DnD is notoriously difficult to test in E2E. Test the API endpoint directly; verify UI updates via page reload. |
| **BlurHash placeholder** | Manual | Visual | Requires network throttling and visual inspection. Screenshot comparison can catch regressions. |
| **Responsive layout** | Playwright | Full | Use viewport presets (375, 768, 1440). Screenshot comparison for layout regressions. |

### What Needs Manual Verification

- **Visual quality of processed images** -- automated tests verify dimensions and format, but visual quality (artifacts, color accuracy) needs a human eye on first implementation and after Sharp version upgrades.
- **BlurHash visual fidelity** -- does the placeholder look like a blurred version of the image? Automated tests can verify it is generated, not that it looks right.
- **Carousel transition smoothness** -- CSS animations and timing are hard to assert in E2E.
- **Touch gestures on real devices** -- emulation gets close, but real iOS/Android testing is needed for production confidence.
- **Print layout** -- if relevant.

### Recommended Test Setup

#### 1. Install Dependencies

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
npm install -D @playwright/test
npm install -D better-sqlite3 @types/better-sqlite3
npx playwright install
```

#### 2. Vitest Configuration (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**', 'src/app/api/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
```

#### 3. Test Setup (`test/setup.ts`)

```typescript
import { beforeEach } from 'vitest';
// Reset test database before each test
// Use local filesystem storage provider
// Set ADMIN_TOKEN to a known test value
```

#### 4. Playwright Configuration (`playwright.config.ts`)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
  },
});
```

#### 5. Directory Structure

```
test/
  fixtures/
    images/
      landscape-4000x3000.jpg    # Standard test image with EXIF
      portrait-3000x4000.jpg     # Portrait orientation
      small-300x200.png          # Below variant threshold
      no-exif.png                # No metadata
      large-8000x2000.jpg        # Panoramic
      square-4000x4000.webp      # Square format
      sample.heic                # iPhone format
  unit/
    db/
      albums.test.ts
      photos.test.ts
      config.test.ts
    images/
      process.test.ts
      blurhash.test.ts
      exif.test.ts
    utils/
      slug.test.ts
      id.test.ts
  integration/
    api/
      albums.test.ts
      photos.test.ts
      auth.test.ts
      config.test.ts
  setup.ts
e2e/
  smoke.spec.ts                  # Smoke tests (SMOKE-01 through SMOKE-10)
  public-gallery.spec.ts         # GAL-001 through GAL-054
  lightbox.spec.ts               # GAL-030 through GAL-045
  admin-albums.spec.ts           # ALB-001 through ALB-042
  admin-photos.spec.ts           # PHO-001 through PHO-034
  auth.spec.ts                   # AUTH-001 through AUTH-009
```

#### 6. CI Pipeline (GitHub Actions)

```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npx vitest run --coverage
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: |
            coverage/
            playwright-report/
            test-results/
```

### Priority Execution Order

When time is limited, run tests in this order:

1. **P0 Smoke tests** (30 seconds) -- catches deploy-breaking issues
2. **P0 API tests** (unit/integration, 1-2 minutes) -- catches data corruption risks
3. **P0 E2E tests** (2-3 minutes) -- catches user-facing regressions
4. **P1 tests** -- run in CI, review on failure
5. **P2 tests** -- run weekly or before major releases

### Test Data Seeding

Create a seed script (`test/seed.ts`) that populates:
- 3 public albums (5, 3, and 1 photo each)
- 1 private album (2 photos)
- 1 hero album (referencing one of the public albums)
- Cover photos set on 2 albums
- Captions on some photos
- Site config with custom values

This seed data supports all E2E tests without manual setup.

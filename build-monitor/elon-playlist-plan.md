# Playlist Feature -- Execution Plan

**PM:** Elon
**Date:** 2026-03-06
**Status:** Ready for execution
**Priority:** P2 (was P3, promoted by Scott)

---

## Executive Summary

Playlists let the photographer curate cross-album photo sequences and play them as slideshows. The existing SlideshowPlayer already handles photo arrays -- playlists just provide a different array. This is a 3-phase build with a clean critical path.

---

## Phase 1: Schema + Queries + API (Backend)

**Goal:** Playlist data model exists, CRUD API works, zero UI yet.

**Scope:**
- Two new tables: `playlists` and `playlist_photos`
- Query functions for all playlist operations
- API routes for CRUD + photo management + playback data

### Schema Design

**`playlists` table:**

| Column      | Type      | Notes                          |
|-------------|-----------|--------------------------------|
| id          | text PK   | nanoid via generateId()        |
| title       | text      | not null, max 200 chars        |
| slug        | text      | not null, unique               |
| description | text      | nullable                       |
| sortOrder   | integer   | default 0                      |
| isPublic    | boolean   | default true                   |
| createdAt   | timestamp | auto-set                       |
| updatedAt   | timestamp | auto-set                       |

**`playlist_photos` table (junction):**

| Column     | Type    | Notes                                        |
|------------|---------|----------------------------------------------|
| id         | text PK | nanoid                                       |
| playlistId | text FK | references playlists.id, cascade delete       |
| photoId    | text FK | references photos.id, cascade delete          |
| sortOrder  | integer | not null, default 0                          |

Indexes:
- `playlist_slug_idx` unique on `playlists.slug`
- `playlist_sort_order_idx` on `playlists.sortOrder`
- `playlist_is_public_idx` on `playlists.isPublic`
- `playlist_photo_playlist_idx` on `playlist_photos.playlistId, playlist_photos.sortOrder`
- `playlist_photo_unique_idx` unique on `playlist_photos.playlistId, playlist_photos.photoId` (prevent duplicates)

**Why no `deletedAt` / soft delete?** Playlists are cheap metadata. Hard delete is fine. If a photo gets deleted from an album, cascade delete removes it from all playlists automatically.

### API Routes

| Method | Path                                | Auth | Description                        |
|--------|-------------------------------------|------|------------------------------------|
| GET    | /api/playlists                      | No*  | List playlists (*includePrivate needs auth) |
| POST   | /api/playlists                      | Yes  | Create playlist                    |
| GET    | /api/playlists/[id]                 | No   | Get playlist with photos for playback |
| PATCH  | /api/playlists/[id]                 | Yes  | Update title/description/isPublic  |
| DELETE | /api/playlists/[id]                 | Yes  | Delete playlist                    |
| PUT    | /api/playlists/[id]/photos          | Yes  | Set photo list + order (full replace) |
| PUT    | /api/playlists/reorder              | Yes  | Reorder playlists                  |

The `GET /api/playlists/[id]` endpoint returns the full photo array in SlideshowPhoto format -- this is what the playback page consumes.

### File Ownership

| File | Owner |
|------|-------|
| `src/lib/db/schema.ts` (append playlist tables) | Phase 1 agent |
| `src/lib/db/queries/playlists.ts` (new) | Phase 1 agent |
| `src/app/api/playlists/route.ts` (new) | Phase 1 agent |
| `src/app/api/playlists/[id]/route.ts` (new) | Phase 1 agent |
| `src/app/api/playlists/[id]/photos/route.ts` (new) | Phase 1 agent |
| `src/app/api/playlists/reorder/route.ts` (new) | Phase 1 agent |

### Acceptance Criteria

1. `npx drizzle-kit push` creates both tables without error
2. POST `/api/playlists` creates a playlist, returns it with id/slug
3. GET `/api/playlists` returns list with photo count per playlist
4. GET `/api/playlists/[id]` returns playlist + ordered photos with URLs, dimensions, blurhash
5. PUT `/api/playlists/[id]/photos` with `{ photoIds: ["id1", "id2"] }` sets photos in order
6. DELETE removes playlist, photos table entries cascade
7. PATCH updates title/description/isPublic
8. Duplicate photoId in same playlist is rejected (unique constraint)
9. `npm run build` passes with zero type errors

### Agent Assignment

- **Model:** Sonnet (implementation with reasoning)
- **Background:** Yes
- **Estimated time:** 20-30 minutes

### Gate

Phase 1 is done when all 9 acceptance criteria pass and `npm run build` succeeds.

---

## Phase 2: Admin UI

**Goal:** Admin can create, edit, delete playlists and pick/order photos from any album.

**Dependencies:** Phase 1 complete (API must exist)

### Pages

1. **Playlist list page** (`/admin/playlists`) -- shows all playlists with photo count, first 4 thumbnails as preview, create button
2. **Playlist editor page** (`/admin/playlists/[id]`) -- title/description form + photo picker + ordered photo list

### Photo Picker Design

Left-right split layout (stacked on mobile):
- **Left panel:** Albums accordion/list. Each album expandable to show its photos as a thumbnail grid. Click photo to add. "Add all" button per album. Search/filter by album name.
- **Right panel:** Selected photos in order. Drag-and-drop reordering. Click X to remove. Photo count shown.

This mirrors the original P6-T6 spec but keeps it lean -- no modal dialogs, no multi-step wizard. One page does it all.

### Sidebar Update

Add "Playlists" nav item to AdminSidebar between "Albums" and "Trash". Icon: a stacked-rectangles/list icon.

### File Ownership

| File | Owner |
|------|-------|
| `src/app/admin/playlists/page.tsx` (new) | Phase 2 agent |
| `src/app/admin/playlists/[id]/page.tsx` (new) | Phase 2 agent |
| `src/app/admin/playlists/loading.tsx` (new) | Phase 2 agent |
| `src/components/admin/PlaylistList.tsx` (new) | Phase 2 agent |
| `src/components/admin/PlaylistEditor.tsx` (new) | Phase 2 agent |
| `src/components/admin/PlaylistPhotoSelector.tsx` (new) | Phase 2 agent |
| `src/components/admin/AdminSidebar.tsx` (edit -- add nav item only) | Phase 2 agent |

### Acceptance Criteria

1. `/admin/playlists` shows all playlists with photo count and thumbnail previews
2. "New Playlist" button creates a playlist and navigates to editor
3. Editor shows title/description fields that save on blur or button click
4. Photo picker shows albums with expandable photo grids
5. Clicking a photo adds it to the right panel; clicking X removes it
6. Right panel supports drag-and-drop reorder
7. Save persists photo selection and order via PUT API
8. Delete button with confirmation removes playlist
9. "Preview Slideshow" button exists (links to public playback page)
10. Sidebar shows Playlists link, active state works
11. `npm run build` passes

### Agent Assignment

- **Model:** Sonnet (complex UI with state management)
- **Background:** Yes
- **Estimated time:** 40-60 minutes (largest phase)

### Gate

Phase 2 is done when all 11 acceptance criteria pass and `npm run build` succeeds.

---

## Phase 3: Public Playback + Integration

**Goal:** Visitors can view and play playlists. SlideshowPlayer works with playlist data.

**Dependencies:** Phase 1 complete (Phase 2 not required -- playback only needs API)

### Changes

1. **Playlist playback page** at `/playlists/[slug]/slideshow` -- server component that fetches playlist photos via query function, maps to SlideshowPhoto[], passes to existing SlideshowPlayer
2. **Playlist listing page** at `/playlists` (optional, lean) -- simple grid of public playlists with cover thumbnail (first photo)
3. **SlideshowPlayer modification** -- the `albumSlug` prop needs to become a generic `backUrl` prop so the exit button can navigate back to either `/albums/[slug]` or `/playlists/[slug]`. This is the ONE existing component that changes.
4. **Update slideshow page** for albums to pass `backUrl` instead of `albumSlug`

### File Ownership

| File | Owner |
|------|-------|
| `src/app/(public)/playlists/page.tsx` (new) | Phase 3 agent |
| `src/app/(public)/playlists/[slug]/page.tsx` (new) | Phase 3 agent |
| `src/app/(public)/playlists/[slug]/slideshow/page.tsx` (new) | Phase 3 agent |
| `src/components/gallery/slideshow.tsx` (edit -- rename albumSlug to backUrl) | Phase 3 agent |
| `src/app/(public)/albums/[slug]/slideshow/page.tsx` (edit -- pass backUrl) | Phase 3 agent |

### Acceptance Criteria

1. `/playlists` shows public playlists (respects isPublic flag)
2. `/playlists/[slug]` shows playlist info and photo grid
3. `/playlists/[slug]/slideshow` launches SlideshowPlayer with playlist photos in correct order
4. Exit button navigates back to `/playlists/[slug]` (not an album page)
5. All existing album slideshow functionality still works (no regression)
6. `npm run build` passes

### Agent Assignment

- **Model:** Sonnet
- **Background:** Yes
- **Estimated time:** 15-20 minutes

### Gate

Phase 3 is done when all 6 acceptance criteria pass, `npm run build` succeeds, and album slideshows still work.

---

## Parallelization

```
Phase 1 (backend) -----> Phase 2 (admin UI)
       \
        +---------------> Phase 3 (public playback)
```

Phase 2 and Phase 3 can run in parallel after Phase 1 completes. Phase 2 does not depend on Phase 3 and vice versa.

Phase 3 could technically start as soon as Phase 1 is done, even while Phase 2 is still running -- they touch completely different files.

---

## Scope Boundaries -- What's OUT

- No public playlist browsing from the homepage (no hero carousel integration)
- No sharing/embed URLs for playlists
- No playlist duplication or templating
- No photo captions override per-playlist (uses the photo's native caption)
- No playlist cover photo selection (auto-uses first photo)
- No analytics or view counts
- No collaborative playlist editing

If any of these come up during build, they get logged and deferred. Zero scope expansion without cutting something else.

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Drag-and-drop reorder complexity in Phase 2 | Medium | Medium | Reuse existing sortable-list pattern from album photo manager |
| SlideshowPlayer prop rename breaks album slideshow | Low | High | Phase 3 agent owns both files; tests both paths |
| Photo deletion cascading to playlist_photos | Low | Low | Schema handles via ON DELETE CASCADE; verified in Phase 1 |
| Large playlists (100+ photos) slow to load | Low | Medium | Defer pagination; same pattern as album detail already works |

---

## Summary

| Phase | Scope | Agent Model | Files Created | Files Modified | Est. Time |
|-------|-------|-------------|---------------|----------------|-----------|
| 1 | Schema + Queries + API | Sonnet | 5 | 1 | 20-30 min |
| 2 | Admin UI | Sonnet | 6 | 1 | 40-60 min |
| 3 | Public Playback | Sonnet | 3 | 2 | 15-20 min |
| **Total** | | | **14** | **4** | **75-110 min** |

Total new files: 14. Total modified files: 4 (schema.ts, AdminSidebar.tsx, slideshow.tsx, album slideshow page.tsx).

No file is touched by more than one phase. File ownership is clean.

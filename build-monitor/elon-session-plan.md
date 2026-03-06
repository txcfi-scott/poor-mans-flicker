# Session Execution Plan -- Poor Man's Flickr
## Elon's Build Plan -- Ship Everything

**Date:** 2026-03-06
**Goal:** Complete Phases 6-8 + P2 bug fixes + UI design implementation in one session
**Starting state:** Phases 1-5 complete, site live at chrishardingphotography.com, 18/18 tests passing, auth working, soft-delete working

---

## Scope Decision: Playlists are CUT

The original Phase 6 spec includes a full playlist system (P6-T5, P6-T6): database model, API routes, admin UI with drag-and-drop photo selector, cross-album playlist building. This is a **large feature** that touches schema, migrations, 5+ new API routes, and 4+ new admin pages.

**Decision: Cut playlists from this session.** The slideshow works perfectly well from a single album. Playlists are a P3 "nice to have" that can ship in a future build. Shipping a working slideshow, polished UI, and clean deployment is worth more than a half-finished playlist system.

What stays: Album-based slideshow with fullscreen player, transitions, controls, Ken Burns, keyboard/touch support.

---

## Phase Map

| # | Phase | Dependencies | Parallelizable With |
|---|-------|-------------|-------------------|
| W1 | P2 Bug Fixes | None | W2 |
| W2 | Slideshow Engine | None | W1 |
| W3 | Loading & Empty States | W1 done | W4 |
| W4 | Responsive Polish | W2 done | W3 |
| W5 | UI Design Implementation | W2, W3 done (needs Jony's report) | -- |
| W6 | Deployment Finalization | W1-W5 done | -- |
| W7 | Smoke Test | W6 done | -- |

```
Timeline:
W1 ──────┐
W2 ──────┤──> W3 ──────┐
         │    W4 ──────┤──> W5 ──> W6 ──> W7
         └─────────────┘
```

---

## W1: P2 Bug Fixes

**Agent:** Sonnet (implementation with reasoning)
**Scope:** Fix all 6 known P2 issues from Gwynne's review

### Tasks

#### W1-1: Slug collision on album update
**File:** `src/app/api/albums/[id]/route.ts`
**Bug:** PATCH handler regenerates slug from title but doesn't check for uniqueness. Two albums with similar titles will collide.
**Fix:** Before setting `updates.slug`, query for existing album with that slug (excluding current album ID). If collision, append `-2`, `-3`, etc. Also allow explicit slug override in the request body.
**Acceptance:** PATCH with duplicate-title album does NOT return 500. Slug gets a numeric suffix.

#### W1-2: Date serialization in admin AlbumCard
**File:** `src/components/admin/AlbumCard.tsx`
**Bug:** Line 109 calls `album.createdAt.toLocaleDateString()` but when data comes from API JSON, `createdAt` is a string, not a Date object. This will crash or show "Invalid Date".
**Fix:** Parse the date before formatting: `new Date(album.createdAt).toLocaleDateString()`. Also update the TypeScript interface to accept `string | Date` for date fields.
**Acceptance:** Admin album list renders dates correctly without runtime errors.

#### W1-3: globals.css img rule conflicts with gallery
**File:** `src/app/globals.css`
**Bug:** Lines 64-68 set `img { max-width: 100%; height: auto; display: block; }`. The `height: auto` rule overrides explicit height attributes on gallery images, which can cause layout shift in the photo grid and lightbox.
**Fix:** Scope the rule to exclude gallery images. Use `img:not([data-gallery])` or remove the global rule entirely and apply it only where needed via Tailwind classes.
**Acceptance:** Gallery images render at correct dimensions. No layout shift when images load.

#### W1-4: Dead code -- readClientExif
**File:** `src/lib/images/client-exif.ts`
**Investigation:** Check if `readClientExif` is imported anywhere. If not, remove the file. If it is imported, keep it.
**Acceptance:** No dead exports. If removed, build still passes.

#### W1-5: No pagination (assessment only)
**Scope:** Pagination is not needed for v1. Chris will have <20 albums and <500 total photos. Document as a future enhancement, do NOT implement now.
**Acceptance:** Add a comment in `src/lib/db/queries/albums.ts` and `photos.ts` noting pagination can be added when needed.

#### W1-6: Error boundary improvements
**File:** `src/app/error.tsx`
**Check:** Verify error boundary exists and works. Add `src/app/(public)/error.tsx` and `src/app/admin/error.tsx` if missing.
**Acceptance:** Both public and admin route groups have error boundaries.

### File Ownership
| File | Owner |
|------|-------|
| `src/app/api/albums/[id]/route.ts` | W1 |
| `src/components/admin/AlbumCard.tsx` | W1 |
| `src/app/globals.css` | W1 |
| `src/lib/images/client-exif.ts` | W1 |
| `src/lib/db/queries/albums.ts` | W1 (comment only) |
| `src/lib/db/queries/photos.ts` | W1 (comment only) |
| `src/app/(public)/error.tsx` | W1 (create) |
| `src/app/admin/error.tsx` | W1 (create) |

### Gate
- `npm run build` passes with zero errors
- All 6 items addressed (5 fixes + 1 documented deferral)

---

## W2: Slideshow Engine

**Agent:** Sonnet (implementation) -- this is the biggest wave, consider splitting into 2 sub-agents
**Scope:** Fullscreen slideshow player with crossfade transitions, Ken Burns effect, controls, keyboard/touch support

### Tasks

#### W2-1: useSlideshow hook
**File:** `src/hooks/use-slideshow.ts` (create)
**Spec:**
- Manages: currentIndex, isPlaying, intervalMs, kenBurnsEnabled, isFullscreen
- Auto-advances when playing (setInterval with cleanup)
- Loops at end of photo list
- Preloads next 2 images via `new Image()`
- Exposes: play, pause, toggle, next, prev, goTo, setInterval, toggleKenBurns, enterFullscreen, exitFullscreen
- Reads default interval from props (sourced from site_config.slideshowDefaultIntervalMs)
- Persists kenBurnsEnabled and intervalMs to localStorage
**Acceptance:** Hook returns correct state. Auto-advance works. Preloading fires.

#### W2-2: SlideshowPlayer component
**File:** `src/components/gallery/slideshow.tsx` (create)
**Spec:**
- Full-viewport component (100vw x 100vh, black background)
- Renders current photo centered with `object-fit: contain`
- Crossfade transition: two stacked image layers, opacity transition 1s
- Uses `useSlideshow` hook for state
- Requests Fullscreen API on mount, falls back to fixed positioning
- Shows BlurHash placeholder while current image loads
- Exit returns to album page
**Acceptance:** Photos display fullscreen. Crossfade transition is smooth. No flash between photos.

#### W2-3: Ken Burns effect layer
**File:** `src/components/gallery/ken-burns-layer.tsx` (create)
**Spec:**
- Wraps the slideshow image with a CSS transform animation
- Random start/end: scale 1.0-1.15, translate 0-5% in x/y
- Animation duration matches the slideshow interval
- CSS `will-change: transform` for GPU acceleration
- New random params on each photo change
- Toggleable via prop
**Acceptance:** Subtle zoom+pan animation. No visible jump on photo change. Can be toggled off.

#### W2-4: SlideshowControls component
**File:** `src/components/gallery/slideshow-controls.tsx` (create)
**Spec:**
- Bottom bar: play/pause, prev, next, speed selector (3s/5s/8s/12s), Ken Burns toggle, exit button
- Position counter: "3 / 24"
- Auto-hide after 3s of no mouse movement
- Reappears on mousemove or touch
- Semi-transparent dark background with backdrop-blur
- All buttons have aria-labels
**Acceptance:** Controls work. Auto-hide/show works. All buttons functional.

#### W2-5: Keyboard and touch controls
**Integrated into:** `src/components/gallery/slideshow.tsx` (useEffect in the player)
**Spec:**
- Space: toggle play/pause
- Left/Right arrows: prev/next
- Escape: exit slideshow
- F: toggle fullscreen
- K: toggle Ken Burns
- Touch: tap left 1/3 = prev, right 1/3 = next, center = toggle play
- Swipe left/right: next/prev
- Swipe up: exit
**Acceptance:** All keyboard shortcuts work. Touch gestures work on mobile.

#### W2-6: Slideshow page
**File:** `src/app/(public)/albums/[slug]/slideshow/page.tsx` (replace stub)
**Spec:**
- Server component that fetches album by slug
- Passes photo data (full URLs, dimensions, blurhash, captions) to SlideshowPlayer
- Fetches slideshowDefaultIntervalMs from site config
- 404 if album not found or not public
- Meta tags: noindex (don't want search engines indexing slideshow pages)
**Acceptance:** `/albums/[slug]/slideshow` loads and plays the slideshow.

### File Ownership
| File | Owner |
|------|-------|
| `src/hooks/use-slideshow.ts` | W2 |
| `src/components/gallery/slideshow.tsx` | W2 |
| `src/components/gallery/ken-burns-layer.tsx` | W2 |
| `src/components/gallery/slideshow-controls.tsx` | W2 |
| `src/app/(public)/albums/[slug]/slideshow/page.tsx` | W2 |

### Gate
- `npm run build` passes
- Slideshow page loads without errors
- Crossfade transition renders (manual verification needed)
- Controls bar appears and functions
- Keyboard shortcuts respond correctly

---

## W3: Loading States & Empty States

**Agent:** Haiku (mechanical work -- skeleton templates are repetitive)
**Scope:** Add loading.tsx skeletons for all route segments + polish empty states

### Tasks

#### W3-1: Skeleton component
**File:** `src/components/ui/skeleton.tsx` (create)
**Spec:** Reusable Skeleton primitive with pulse animation. Props: `className`, `variant` (text, circle, rect).

#### W3-2: Public loading states
**Files to create:**
- `src/app/(public)/loading.tsx` -- hero skeleton (full-height gradient shimmer)
- `src/app/(public)/albums/loading.tsx` -- grid of album card skeletons
- `src/app/(public)/albums/[slug]/loading.tsx` -- photo grid skeletons

#### W3-3: Admin loading states
**Files to create:**
- `src/app/admin/loading.tsx` -- dashboard skeleton
- `src/app/admin/albums/loading.tsx` -- album list skeletons
- `src/app/admin/albums/[id]/loading.tsx` -- album detail skeleton

#### W3-4: Empty state improvements
**Files to modify:**
- `src/components/admin/AlbumList.tsx` -- "No albums yet" with create button
- `src/components/admin/PhotoGrid.tsx` (admin) -- "No photos" with upload prompt

### File Ownership
| File | Owner |
|------|-------|
| `src/components/ui/skeleton.tsx` | W3 |
| `src/app/(public)/loading.tsx` | W3 |
| `src/app/(public)/albums/loading.tsx` | W3 |
| `src/app/(public)/albums/[slug]/loading.tsx` | W3 |
| `src/app/admin/loading.tsx` | W3 |
| `src/app/admin/albums/loading.tsx` | W3 |
| `src/app/admin/albums/[id]/loading.tsx` | W3 |
| `src/components/admin/AlbumList.tsx` | W3 (empty state only) |

### Gate
- `npm run build` passes
- Every route segment has a loading.tsx
- Skeleton components render with animation

---

## W4: Responsive Polish

**Agent:** Sonnet (needs judgment about breakpoints and layout)
**Scope:** Ensure all pages work from 320px to 2560px

### Tasks

#### W4-1: Header mobile menu
**File:** `src/components/layout/header.tsx`
**Spec:** Add hamburger menu for mobile. Slide-out drawer with nav links. Close on navigation or backdrop tap. Touch targets >= 44px.

#### W4-2: Admin sidebar mobile
**File:** `src/components/admin/AdminSidebar.tsx`
**Spec:** Collapse to bottom bar or hamburger on mobile (< 768px). All nav items accessible.

#### W4-3: Photo grid responsive
**Files:** `src/components/gallery/photo-grid.tsx`, `src/components/gallery/photo-card.tsx`
**Spec:** Verify column count adjusts: 4 cols desktop, 3 tablet, 2 mobile. No horizontal scroll at any width.

#### W4-4: Lightbox mobile
**File:** `src/components/gallery/lightbox.tsx`
**Spec:** Verify touch swipe works. Ensure controls don't overlap image. Close button reachable on mobile.

#### W4-5: Slideshow mobile
**File:** `src/components/gallery/slideshow.tsx` (coordinate with W2 -- W2 builds it, W4 polishes if needed)
**Spec:** Touch gestures functional. Controls bar usable on small screens.

### File Ownership
| File | Owner |
|------|-------|
| `src/components/layout/header.tsx` | W4 |
| `src/components/admin/AdminSidebar.tsx` | W4 |
| `src/components/gallery/photo-grid.tsx` | W4 |
| `src/components/gallery/photo-card.tsx` | W4 |
| `src/components/gallery/lightbox.tsx` | W4 |

### Gate
- `npm run build` passes
- No horizontal scroll at 320px viewport
- All touch targets >= 44px
- Admin sidebar accessible on mobile

---

## W5: UI Design Implementation

**Agent:** Sonnet (implementing Jony's design recommendations)
**Scope:** Apply design audit findings from Jony's report
**Dependency:** Jony's design audit must be complete (check `build-monitor/status/jony-design.json` and `build-monitor/jony-design.json` or similar deliverable)

### Tasks
This phase is defined reactively -- it implements whatever Jony recommends. Likely areas:

#### W5-1: Typography and spacing adjustments
**Likely files:** `src/app/globals.css`, various component files
**Scope:** Font sizes, line heights, letter spacing, margins, padding per Jony's spec

#### W5-2: Color refinements
**Likely files:** `src/app/globals.css`, component-level color overrides
**Scope:** Adjust background, text, accent, border colors per design audit

#### W5-3: Component visual polish
**Likely files:** Album cards, photo grid, lightbox, header, footer
**Scope:** Border radius, shadows, hover states, transitions per design audit

#### W5-4: Hero section and homepage polish
**Likely files:** `src/app/(public)/page.tsx`, `src/components/gallery/hero-carousel.tsx`
**Scope:** Hero overlay text treatment, CTA button styling, carousel transition refinement

### File Ownership
Determined after Jony's report arrives. **Critical rule:** W5 must not touch files still owned by W3 or W4. If there's overlap, W3/W4 must complete first.

### Gate
- `npm run build` passes
- Visual inspection confirms design improvements
- No regressions in functionality

---

## W6: Deployment Finalization

**Agent:** Haiku (mechanical -- CLI commands and config)
**Scope:** Install Vercel GitHub App, verify auto-deploy, verify all services

### Tasks

#### W6-1: Vercel GitHub App
**Action:** Install Vercel GitHub App on txcfi-scott GitHub account. Connect to `poor-mans-flicker` repo. Verify push-to-deploy works.
**Note:** This may require Scott's manual action (GitHub OAuth). If so, provide exact steps and mark as blocked.

#### W6-2: Verify deployment
**Action:** Push latest changes to main. Verify Vercel auto-deploys (or manual `vercel deploy --prod` if GitHub App isn't working).

#### W6-3: Production build verification
**Action:** Run `npm run build` locally to verify zero errors before deploying.

### Gate
- Production URL loads correctly
- Auto-deploy works (or manual deploy verified)
- Zero build errors

---

## W7: Smoke Test

**Agent:** Sonnet (judgment needed to evaluate results)
**Scope:** End-to-end verification of all critical paths on production

### Checklist
- [ ] Public landing page loads
- [ ] Hero carousel displays and cycles
- [ ] Albums index shows all public albums
- [ ] Album detail page shows photos in grid
- [ ] Lightbox opens, navigates, closes
- [ ] Slideshow launches from album page
- [ ] Slideshow controls work (play/pause/next/prev/speed/Ken Burns)
- [ ] Slideshow keyboard shortcuts work
- [ ] Login page accessible at /admin/login (redirects from /admin)
- [ ] Admin can log in with token
- [ ] Admin can create album
- [ ] Admin can upload photos
- [ ] Admin can reorder photos
- [ ] Admin can set cover photo
- [ ] Admin can edit album settings
- [ ] Admin can delete photo (soft delete)
- [ ] Admin can restore from trash
- [ ] Settings page saves correctly
- [ ] Site title updates across pages
- [ ] Logout works, admin pages inaccessible after logout
- [ ] 404 page displays for invalid URLs
- [ ] Error boundary catches errors gracefully

### Gate
- All checklist items pass
- No console errors on any page
- No broken images

---

## Agent Assignment Summary

| Wave | Task | Model | Estimated Effort |
|------|------|-------|-----------------|
| W1 | P2 Bug Fixes | Sonnet | 15 min |
| W2 | Slideshow Engine | Sonnet | 30 min |
| W3 | Loading/Empty States | Haiku | 10 min |
| W4 | Responsive Polish | Sonnet | 20 min |
| W5 | UI Design Implementation | Sonnet | 20 min (depends on Jony) |
| W6 | Deployment Finalization | Haiku | 5 min |
| W7 | Smoke Test | Sonnet | 10 min |

## Parallelization Plan

**Wave 1 (parallel):**
- W1: P2 Bug Fixes
- W2: Slideshow Engine
- Jony's design audit (already running separately)

**Wave 2 (after W1+W2 gate):**
- W3: Loading States (parallel)
- W4: Responsive Polish (parallel)

**Wave 3 (after W3+W4 + Jony report):**
- W5: UI Design Implementation

**Wave 4 (sequential):**
- W6: Deployment
- W7: Smoke Test

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Fullscreen API blocked by browser | Medium | Low | Fall back to fixed positioning; already in W2-2 spec |
| Jony's report not ready in time | Medium | Medium | W5 can be deferred; ship without design polish is acceptable |
| Vercel GitHub App requires manual OAuth | High | Low | Provide Scott exact steps; fall back to manual deploy |
| Ken Burns animation causes jank on mobile | Medium | Low | Disable by default on mobile; test on real device |
| Touch gesture conflicts with browser gestures | Medium | Medium | Use `touch-action: none` on slideshow container; test Safari |

---

## File Ownership Master Map

Every file that will be modified or created, and which wave owns it. **No two waves touch the same file.**

| File | Wave | Action |
|------|------|--------|
| `src/app/api/albums/[id]/route.ts` | W1 | modify |
| `src/components/admin/AlbumCard.tsx` | W1 | modify |
| `src/app/globals.css` | W1 | modify |
| `src/lib/images/client-exif.ts` | W1 | delete or keep |
| `src/lib/db/queries/albums.ts` | W1 | comment |
| `src/lib/db/queries/photos.ts` | W1 | comment |
| `src/app/(public)/error.tsx` | W1 | create |
| `src/app/admin/error.tsx` | W1 | create |
| `src/hooks/use-slideshow.ts` | W2 | create |
| `src/components/gallery/slideshow.tsx` | W2 | create |
| `src/components/gallery/ken-burns-layer.tsx` | W2 | create |
| `src/components/gallery/slideshow-controls.tsx` | W2 | create |
| `src/app/(public)/albums/[slug]/slideshow/page.tsx` | W2 | replace |
| `src/components/ui/skeleton.tsx` | W3 | create |
| `src/app/(public)/loading.tsx` | W3 | create |
| `src/app/(public)/albums/loading.tsx` | W3 | create |
| `src/app/(public)/albums/[slug]/loading.tsx` | W3 | create |
| `src/app/admin/loading.tsx` | W3 | create |
| `src/app/admin/albums/loading.tsx` | W3 | create |
| `src/app/admin/albums/[id]/loading.tsx` | W3 | create |
| `src/components/admin/AlbumList.tsx` | W3 | modify (empty state) |
| `src/components/layout/header.tsx` | W4 | modify |
| `src/components/admin/AdminSidebar.tsx` | W4 | modify |
| `src/components/gallery/photo-grid.tsx` | W4 | modify |
| `src/components/gallery/photo-card.tsx` | W4 | modify |
| `src/components/gallery/lightbox.tsx` | W4 | modify |
| W5 files | W5 | TBD from Jony |

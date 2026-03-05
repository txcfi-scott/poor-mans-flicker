# Poor Man's Flickr — Project Execution Plan

## 1. Project Overview

### Vision

Poor Man's Flickr is a lean, fast photo portfolio and gallery web application built for a photographer who shoots prolifically and wants a dead-simple way to organize albums, showcase work, and run fullscreen slideshows — all managed through the site itself, hosted for roughly a dollar a month, and maintained by Claude Code sessions on demand.

### Success Criteria

| # | Criterion | Measurement |
|---|-----------|-------------|
| 1 | Photographer can upload photos from any browser | Upload completes, thumbnail + display-size + original stored in R2 |
| 2 | Albums can be created, reordered, and deleted | CRUD operations work without data loss |
| 3 | Public gallery loads in under 2 seconds on 4G | Lighthouse performance score >= 90 |
| 4 | Hero images cycle across the site | Hero album selection works; images rotate on configurable interval |
| 5 | Fullscreen slideshow plays smoothly | Transitions render at 60fps, controls respond within 100ms |
| 6 | Monthly hosting cost <= $1 (excluding domain) | Vercel free tier + Turso free tier + R2 free tier |
| 7 | Zero-ops deployment | `git push` triggers full deploy via Vercel |
| 8 | Site is accessible | WCAG 2.1 AA on all public pages |

### Constraints

- **Budget:** ~$1/month hosting (Vercel free, Turso free, R2 free egress via Workers). Domain cost separate.
- **Timeline:** Built in one continuous push — no sprints, no calendar. Phases execute sequentially with parallelization where possible.
- **Team:** AI agents (Claude Code) orchestrated by Pepper. Scott reviews at gates. No other human developers.
- **Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, Drizzle ORM, Turso, Cloudflare R2, Sharp, Vercel.

### Assumptions

1. Scott has or will create accounts for Vercel, Turso, and Cloudflare (R2).
2. Domain DNS can be pointed to Vercel.
3. The photographer will access the site from modern browsers (Chrome, Safari, Firefox — latest two versions).
4. Photo volumes stay within free-tier limits initially (Turso: 9GB DB, R2: 10GB storage, 10M reads/month).
5. Auth is deferred — admin routes are unprotected in v1 (acceptable for soft-launch to one user).
6. Mobile upload from camera roll is a future enhancement, not v1 scope.

---

## 2. Phase Execution Plan

### Phase 1: Scaffold

**Goal:** Establish a buildable, deployable skeleton with database schema, storage abstraction, and project configuration — the foundation every subsequent phase builds on.

**Entry Criteria:** Project directory exists. Planning docs (architecture, UI design, project plan) are approved by Scott.

**Agent Assignments:**
| Agent | Model | Tasks |
|-------|-------|-------|
| scaffold-lead | Opus | Review architecture doc, make any final schema decisions, define file structure |
| scaffold-impl | Sonnet | Create Next.js project, install deps, configure Tailwind/TypeScript/ESLint, implement DB schema and storage abstraction |
| scaffold-config | Haiku | Create .env.example, .gitignore, Vercel config, README skeleton |

**Task Sequence:**
```
1.1 scaffold-lead: Finalize directory structure and file ownership map
     -> produces: docs/file-ownership.md
1.2 scaffold-config: Create .env.example, .gitignore, vercel.json [no dependency]
1.3 scaffold-impl: Initialize Next.js 15 project with App Router
     depends on: 1.1
1.4 scaffold-impl: Install dependencies (drizzle-orm, @libsql/client, @aws-sdk/client-s3, sharp, tailwindcss, etc.)
     depends on: 1.3
1.5 scaffold-impl: Configure Tailwind, TypeScript strict mode, ESLint, path aliases
     depends on: 1.4
1.6 scaffold-impl: Implement Drizzle schema (albums, photos, settings tables)
     depends on: 1.4
1.7 scaffold-impl: Implement storage abstraction (R2 client wrapper: upload, delete, getSignedUrl)
     depends on: 1.4
1.8 scaffold-impl: Create DB connection utility and migration script
     depends on: 1.6
1.9 scaffold-impl: Create shared types (Album, Photo, Settings, API response types)
     depends on: 1.6
1.10 scaffold-impl: Add layout shell (root layout with metadata, fonts, Tailwind globals)
      depends on: 1.5
```

**Quality Gate:**
- `npm run build` succeeds with zero errors
- `npx tsc --noEmit` passes
- DB schema can be pushed to a local/dev Turso instance
- Storage abstraction compiles (runtime test deferred to Phase 2)
- ESLint passes with zero warnings

**Exit Criteria:** A clean, buildable Next.js project with schema, storage abstraction, shared types, and layout shell. No runtime features yet.

**Deliverables:**
```
src/
  app/layout.tsx
  app/page.tsx (placeholder)
  db/schema.ts
  db/index.ts (connection)
  db/migrate.ts
  lib/storage.ts
  lib/types.ts
  lib/constants.ts
tailwind.config.ts
tsconfig.json
.eslintrc.json
.env.example
.gitignore
vercel.json
package.json
drizzle.config.ts
```

---

### Phase 2: Image Pipeline

**Goal:** Build the complete server-side image processing pipeline — upload, resize/optimize, store to R2, retrieve, and delete.

**Entry Criteria:** Phase 1 complete. `npm run build` passes. Schema and storage abstraction exist.

**Agent Assignments:**
| Agent | Model | Tasks |
|-------|-------|-------|
| pipeline-lead | Opus | Design processing strategy (sizes, formats, quality), define API contracts |
| pipeline-impl | Sonnet | Implement upload route, Sharp processing, R2 operations, delete route |
| pipeline-test | Sonnet | Write unit tests for image processing, integration tests for upload/delete flow |

**Task Sequence:**
```
2.1 pipeline-lead: Define image size variants, quality settings, naming conventions
     -> produces: docs/image-pipeline-spec.md (inline in working notes, not a separate doc)
2.2 pipeline-impl: Implement Sharp processing module (resize to variants, strip EXIF, optimize)
     depends on: 2.1
     -> produces: src/lib/image-processing.ts
2.3 pipeline-impl: Implement POST /api/photos/upload route
     depends on: 2.2
     -> produces: src/app/api/photos/upload/route.ts
2.4 pipeline-impl: Implement DELETE /api/photos/[id] route
     depends on: 2.3
     -> produces: src/app/api/photos/[id]/route.ts
2.5 pipeline-impl: Implement GET /api/photos/[id] route (metadata)
     depends on: 1.6 (schema)
     -> produces: (same file as 2.4)
2.6 pipeline-test: Unit tests for Sharp processing (correct dimensions, format, quality)
     depends on: 2.2
2.7 pipeline-test: Integration tests for upload/delete API routes
     depends on: 2.4
```

**Image Size Variants:**
| Variant | Max Dimension | Format | Quality | Use Case |
|---------|--------------|--------|---------|----------|
| thumbnail | 400px | WebP | 80 | Grid view, album covers |
| display | 1600px | WebP | 85 | Lightbox, slideshow |
| original | as-uploaded | original | original | Download, future-proof |

**Quality Gate:**
- Upload a test image via API: all three variants appear in R2
- Delete the test image: all variants removed from R2, DB record deleted
- Sharp processing produces correct dimensions
- Unit tests pass
- No TypeScript errors

**Exit Criteria:** A working image pipeline that accepts an upload, produces three size variants, stores them in R2, records metadata in Turso, and can delete all artifacts cleanly.

**Deliverables:**
```
src/lib/image-processing.ts
src/app/api/photos/upload/route.ts
src/app/api/photos/[id]/route.ts
src/app/api/albums/[id]/photos/route.ts
tests/unit/image-processing.test.ts
tests/integration/photo-upload.test.ts
```

---

### Phase 3: Admin Core

**Goal:** Build the admin interface for album management, photo upload, and photo organization — the photographer's primary workflow.

**Entry Criteria:** Phase 2 complete. Image pipeline works end-to-end.

**Agent Assignments:**
| Agent | Model | Tasks |
|-------|-------|-------|
| admin-lead | Opus | Review UI design doc, define component hierarchy, assign file ownership |
| admin-ui | Sonnet | Implement admin pages — album list, album detail, upload UI, photo management |
| admin-api | Sonnet | Implement remaining API routes — album CRUD, photo reorder, album cover selection |
| admin-components | Sonnet | Build shared UI components — drag-drop, modals, toasts, form elements |

**Task Sequence:**
```
3.1 admin-lead: Define component tree and page structure for admin section
3.2 admin-api: Implement album CRUD routes (POST, GET, PUT, DELETE /api/albums)
     depends on: 1.6
     -> produces: src/app/api/albums/route.ts, src/app/api/albums/[id]/route.ts
3.3 admin-components: Build shared UI components (Button, Modal, Toast, DragHandle, FileDropzone)
     depends on: 3.1
     -> produces: src/components/ui/*.tsx
3.4 admin-api: Implement photo reorder route (PUT /api/albums/[id]/photos/reorder)
     depends on: 3.2
3.5 admin-api: Implement album cover selection route
     depends on: 3.2
3.6 admin-api: Implement settings routes (GET/PUT /api/settings — hero album, site title)
     depends on: 1.6
3.7 admin-ui: Build admin layout with navigation sidebar
     depends on: 3.3
     -> produces: src/app/admin/layout.tsx
3.8 admin-ui: Build album list page (grid of albums, create new button)
     depends on: 3.2, 3.3, 3.7
     -> produces: src/app/admin/albums/page.tsx
3.9 admin-ui: Build album detail page (photo grid, upload zone, drag-to-reorder, delete)
     depends on: 3.4, 3.5, 3.8
     -> produces: src/app/admin/albums/[id]/page.tsx
3.10 admin-ui: Build upload experience (drag-drop zone, progress indicators, client-side pre-resize)
      depends on: 2.3, 3.3
      -> produces: src/components/admin/UploadZone.tsx
3.11 admin-ui: Build settings page (hero album picker, site title)
      depends on: 3.6, 3.7
      -> produces: src/app/admin/settings/page.tsx
```

**Quality Gate:**
- Create an album, upload 5+ photos, reorder them, set a cover, delete one — all via the UI
- Settings page saves and retrieves hero album selection
- No console errors in browser
- All API routes return proper status codes and error messages
- Build succeeds, TypeScript clean

**Exit Criteria:** A functional admin section where the photographer can manage albums, upload/delete/reorder photos, select covers, and configure site settings.

**Deliverables:**
```
src/app/admin/layout.tsx
src/app/admin/page.tsx (dashboard/redirect)
src/app/admin/albums/page.tsx
src/app/admin/albums/[id]/page.tsx
src/app/admin/settings/page.tsx
src/app/api/albums/route.ts
src/app/api/albums/[id]/route.ts
src/app/api/albums/[id]/photos/reorder/route.ts
src/app/api/settings/route.ts
src/components/ui/Button.tsx
src/components/ui/Modal.tsx
src/components/ui/Toast.tsx
src/components/admin/UploadZone.tsx
src/components/admin/AlbumCard.tsx
src/components/admin/PhotoGrid.tsx
```

---

### Phase 4: Public Gallery

**Goal:** Build the visitor-facing gallery — landing page with hero cycling, album browser, photo grid with lightbox.

**Entry Criteria:** Phase 3 complete. Albums and photos exist in the database. Admin UI works.

**Agent Assignments:**
| Agent | Model | Tasks |
|-------|-------|-------|
| gallery-lead | Opus | Review UI design doc for public pages, finalize layout and interaction patterns |
| gallery-pages | Sonnet | Implement landing page, album list page, album detail page |
| gallery-components | Sonnet | Build gallery components — hero banner, photo grid, lightbox, album cards |

**Task Sequence:**
```
4.1 gallery-lead: Finalize public page layouts, hero cycling behavior, responsive breakpoints
4.2 gallery-components: Build HeroBanner component (fullscreen, image cycling with crossfade)
     depends on: 4.1
     -> produces: src/components/gallery/HeroBanner.tsx
4.3 gallery-components: Build PhotoGrid component (masonry or uniform grid, lazy loading)
     depends on: 4.1
     -> produces: src/components/gallery/PhotoGrid.tsx
4.4 gallery-components: Build Lightbox component (overlay, prev/next, keyboard nav, swipe)
     depends on: 4.1
     -> produces: src/components/gallery/Lightbox.tsx
4.5 gallery-components: Build AlbumCard component (cover image, title, photo count)
     depends on: 4.1
     -> produces: src/components/gallery/AlbumCard.tsx
4.6 gallery-pages: Build landing page (hero banner + featured albums or recent photos)
     depends on: 4.2, 4.5
     -> produces: src/app/page.tsx (replaces placeholder)
4.7 gallery-pages: Build album list page (/albums)
     depends on: 4.5
     -> produces: src/app/albums/page.tsx
4.8 gallery-pages: Build album detail page (/albums/[slug] — photo grid + lightbox)
     depends on: 4.3, 4.4
     -> produces: src/app/albums/[slug]/page.tsx
4.9 gallery-pages: Implement Open Graph metadata for album sharing
     depends on: 4.8
```

**Quality Gate:**
- Landing page renders with hero cycling through designated album's photos
- Album list shows all public albums with covers
- Clicking an album shows photo grid; clicking a photo opens lightbox
- Lightbox supports keyboard navigation (left/right/escape)
- Lighthouse performance >= 90 on landing page
- Images lazy-load below the fold
- Build succeeds, no TypeScript errors

**Exit Criteria:** A polished public gallery that visitors can browse, with hero cycling, album views, and a smooth lightbox experience.

**Deliverables:**
```
src/app/page.tsx
src/app/albums/page.tsx
src/app/albums/[slug]/page.tsx
src/components/gallery/HeroBanner.tsx
src/components/gallery/PhotoGrid.tsx
src/components/gallery/Lightbox.tsx
src/components/gallery/AlbumCard.tsx
```

---

### Phase 5: Slideshow

**Goal:** Build a fullscreen slideshow player with smooth transitions, playback controls, and playlist mode (play through multiple albums sequentially).

**Entry Criteria:** Phase 4 complete. Gallery pages render correctly. Lightbox works.

**Agent Assignments:**
| Agent | Model | Tasks |
|-------|-------|-------|
| slideshow-impl | Sonnet | Implement slideshow page, player controls, transition engine, playlist logic |
| slideshow-polish | Haiku | CSS transitions, animation timing, keyboard shortcut overlay |

**Task Sequence:**
```
5.1 slideshow-impl: Build slideshow page route (/slideshow/[albumSlug])
     -> produces: src/app/slideshow/[slug]/page.tsx
5.2 slideshow-impl: Build SlideshowPlayer component (fullscreen, preload next image, crossfade transitions)
     depends on: 5.1
     -> produces: src/components/slideshow/SlideshowPlayer.tsx
5.3 slideshow-impl: Build playback controls (play/pause, prev/next, speed, fullscreen toggle)
     depends on: 5.2
     -> produces: src/components/slideshow/Controls.tsx
5.4 slideshow-impl: Implement playlist mode (/slideshow?albums=slug1,slug2,slug3)
     depends on: 5.2
     -> produces: src/app/slideshow/page.tsx
5.5 slideshow-polish: Refine transitions (crossfade, ken burns optional), auto-hide controls
     depends on: 5.3
5.6 slideshow-impl: Add slideshow launch buttons to album detail page and lightbox
     depends on: 5.1
```

**Quality Gate:**
- Slideshow plays through an album automatically with smooth crossfade
- Controls appear on mouse move, auto-hide after 3 seconds
- Keyboard shortcuts work (space=play/pause, left/right=prev/next, escape=exit, f=fullscreen)
- Playlist mode plays through multiple albums in sequence
- No visible jank or flicker during transitions
- Images preload to prevent loading delays

**Exit Criteria:** A polished fullscreen slideshow that the photographer can use to present work — single album or playlist mode.

**Deliverables:**
```
src/app/slideshow/page.tsx
src/app/slideshow/[slug]/page.tsx
src/components/slideshow/SlideshowPlayer.tsx
src/components/slideshow/Controls.tsx
src/components/slideshow/useSlideshow.ts (hook for state management)
```

---

### Phase 6: Polish

**Goal:** Harden the application with auth preparation, responsive design, loading states, error handling, empty states, and accessibility.

**Entry Criteria:** Phases 1-5 complete. All features functional.

**Agent Assignments:**
| Agent | Model | Tasks |
|-------|-------|-------|
| polish-lead | Opus | Audit all pages for gaps, define polish task list |
| polish-auth | Sonnet | Implement auth middleware stub (protect /admin routes, configurable on/off) |
| polish-ux | Sonnet | Loading skeletons, error boundaries, empty states, responsive fixes |
| polish-a11y | Sonnet | ARIA labels, focus management, color contrast, screen reader testing |
| polish-perf | Haiku | Image optimization audit, bundle size check, caching headers |

**Task Sequence:**
```
6.1 polish-lead: Full audit of all pages — list every missing state and edge case
6.2 polish-auth: Add auth middleware stub for /admin routes
     -> produces: src/middleware.ts
6.3 polish-ux: Add loading skeletons for gallery pages and admin pages
     depends on: 6.1
     -> produces: src/app/*/loading.tsx files
6.4 polish-ux: Add error boundaries for all route segments
     depends on: 6.1
     -> produces: src/app/*/error.tsx files
6.5 polish-ux: Add empty states (no albums, no photos, no hero album selected)
     depends on: 6.1
6.6 polish-ux: Responsive audit and fixes (mobile, tablet, desktop)
     depends on: 6.1
6.7 polish-a11y: ARIA labels, alt text generation, focus management in lightbox/slideshow
     depends on: 6.1
6.8 polish-a11y: Keyboard navigation audit across all interactive elements
     depends on: 6.7
6.9 polish-perf: Review bundle size, add dynamic imports where beneficial
     depends on: 6.1
6.10 polish-perf: Set caching headers for R2 images, add next/image optimization config
      depends on: 6.1
```

**Quality Gate:**
- Every page has a loading state, error boundary, and empty state
- Site is fully usable at 375px (mobile), 768px (tablet), 1440px (desktop)
- Lighthouse accessibility score >= 95 on all public pages
- Tab navigation works logically through all interactive elements
- Auth middleware blocks /admin when enabled, passes when disabled
- No unhandled promise rejections or uncaught errors in console

**Exit Criteria:** A production-quality application with no rough edges, proper error handling, responsive design, and accessibility compliance.

**Deliverables:**
```
src/middleware.ts
src/app/loading.tsx
src/app/albums/loading.tsx
src/app/albums/[slug]/loading.tsx
src/app/admin/loading.tsx
src/app/error.tsx
src/app/albums/error.tsx
src/app/not-found.tsx
(modifications to existing component files for a11y and responsive)
```

---

### Phase 7: Testing

**Goal:** Comprehensive test coverage — unit, integration, and E2E — ensuring the app works correctly and regressions are caught.

**Entry Criteria:** Phase 2 complete (testing starts in parallel with Phases 3-6 and continues after Phase 6).

**Agent Assignments:**
| Agent | Model | Tasks |
|-------|-------|-------|
| test-lead | Opus | Define test strategy, coverage targets, assign test files |
| test-unit | Sonnet | Unit tests for utilities, image processing, hooks |
| test-integration | Sonnet | Integration tests for API routes, database operations |
| test-e2e | Sonnet | E2E tests for critical user flows using Playwright |

**Task Sequence:**
```
7.1 test-lead: Define test plan — coverage targets, test file naming, what to mock
7.2 test-unit: Unit tests for lib/image-processing.ts
     can run parallel with Phase 3+
7.3 test-unit: Unit tests for lib/storage.ts (mocked R2 client)
7.4 test-unit: Unit tests for hooks (useSlideshow, etc.)
     depends on: Phase 5
7.5 test-integration: API route tests — album CRUD
     depends on: Phase 3 (3.2)
7.6 test-integration: API route tests — photo upload/delete
     depends on: Phase 2
7.7 test-integration: API route tests — settings
     depends on: Phase 3 (3.6)
7.8 test-e2e: Setup Playwright config
7.9 test-e2e: E2E — admin album management flow
     depends on: Phase 3
7.10 test-e2e: E2E — photo upload and gallery viewing flow
      depends on: Phase 4
7.11 test-e2e: E2E — slideshow playback flow
      depends on: Phase 5
7.12 test-e2e: E2E — responsive and accessibility checks
      depends on: Phase 6
```

**Coverage Targets:**
| Layer | Target | Notes |
|-------|--------|-------|
| Unit | 80%+ of lib/ | image-processing, storage, utilities |
| Integration | All API routes | Every route handler tested with mocked DB/storage |
| E2E | 4 critical flows | Admin management, upload, gallery browsing, slideshow |

**Quality Gate:**
- All unit tests pass
- All integration tests pass
- All E2E tests pass
- No flaky tests (run suite 3x to confirm)
- Coverage meets targets

**Exit Criteria:** A robust test suite that gives confidence for deployment and future changes.

**Deliverables:**
```
vitest.config.ts
playwright.config.ts
tests/unit/*.test.ts
tests/integration/*.test.ts
tests/e2e/*.spec.ts
tests/fixtures/ (test images, mock data)
tests/helpers/ (test utilities, factories)
```

---

### Phase 8: Deployment

**Goal:** Deploy to production on Vercel with Turso and R2 connected, domain configured, and smoke tests passing.

**Entry Criteria:** Phases 1-7 complete. All tests pass. Build succeeds.

**Agent Assignments:**
| Agent | Model | Tasks |
|-------|-------|-------|
| deploy-lead | Opus | Define deployment checklist, verify environment variables, coordinate with Scott for credentials |
| deploy-impl | Sonnet | Configure Vercel project, set env vars, run deployment, verify |
| deploy-verify | Haiku | Run smoke tests against production URL, verify images load, check response times |

**Task Sequence:**
```
8.1 deploy-lead: Create deployment checklist and gather required env vars from Scott
8.2 deploy-impl: Initialize git repo, create initial commit
     depends on: 8.1
8.3 deploy-impl: Create Vercel project (via CLI or guide Scott through dashboard)
     depends on: 8.2
8.4 deploy-impl: Configure environment variables on Vercel
     depends on: 8.3
     - TURSO_DATABASE_URL
     - TURSO_AUTH_TOKEN
     - R2_ACCOUNT_ID
     - R2_ACCESS_KEY_ID
     - R2_SECRET_ACCESS_KEY
     - R2_BUCKET_NAME
     - R2_PUBLIC_URL (if using custom domain or Workers for R2)
8.5 deploy-impl: Push to trigger Vercel deploy
     depends on: 8.4
8.6 deploy-impl: Run Drizzle migration against production Turso
     depends on: 8.5
8.7 deploy-impl: Configure custom domain on Vercel (if ready)
     depends on: 8.5
8.8 deploy-verify: Smoke test production — upload a photo, create album, view gallery, run slideshow
     depends on: 8.6
8.9 deploy-verify: Performance check — Lighthouse on production URL
     depends on: 8.8
8.10 deploy-impl: Write handoff README with setup, deploy, and maintenance instructions
      depends on: 8.8
```

**Quality Gate:**
- Production site loads at custom domain (or Vercel URL)
- Photo upload works end-to-end in production
- Gallery renders correctly with real photos
- Slideshow plays without errors
- Lighthouse performance >= 85 on production
- No console errors in production

**Exit Criteria:** The site is live, functional, and the photographer can start using it. README contains all instructions needed for future maintenance.

**Deliverables:**
```
README.md (complete with setup, deploy, maintenance instructions)
.env.example (updated with all required vars)
Production URL verified and shared with Scott
```

---

## 3. Agent Orchestration Strategy

### Dispatch Model

Pepper orchestrates all phases sequentially (with Phase 7 overlapping Phases 2-6). Within each phase, Pepper:

1. **Reads the phase plan** from this document
2. **Spawns the lead agent** (Opus) to make architectural decisions and produce task assignments
3. **Spawns implementation agents** (Sonnet) with specific file ownership and task descriptions
4. **Spawns mechanical agents** (Haiku) for config, formatting, and repetitive tasks
5. **Monitors status files** for completion and errors
6. **Runs the quality gate** checks
7. **Reports to Scott** at the gate with a summary and any decisions needed

### File Ownership Rules

**No two agents may modify the same file simultaneously.** Ownership is assigned per-task and tracked in status files.

| Ownership Domain | Files | Primary Owner |
|-----------------|-------|---------------|
| Database | src/db/* | scaffold-impl, then shared read-only |
| Storage | src/lib/storage.ts, src/lib/image-processing.ts | pipeline-impl |
| API routes | src/app/api/** | admin-api (Phase 3), then read-only |
| Admin pages | src/app/admin/** | admin-ui |
| Public pages | src/app/(public)/** or src/app/page.tsx, albums/** | gallery-pages |
| Slideshow | src/app/slideshow/**, src/components/slideshow/** | slideshow-impl |
| Gallery components | src/components/gallery/** | gallery-components |
| Admin components | src/components/admin/** | admin-ui, admin-components |
| Shared UI | src/components/ui/** | admin-components (Phase 3), then shared |
| Tests | tests/** | test-unit, test-integration, test-e2e (by subdirectory) |
| Config | root config files | scaffold-config, then deploy-impl |
| Middleware | src/middleware.ts | polish-auth |

When an agent needs to modify a file owned by another agent, it must:
1. Write the change request to its status file
2. Pepper reassigns ownership or sequences the work

### Status Reporting

Every agent writes to `build-monitor/status/{agent-name}.json`:

```json
{
  "agent": "pipeline-impl",
  "phase": 2,
  "task": "2.3",
  "status": "in-progress | complete | blocked | error",
  "files_modified": ["src/app/api/photos/upload/route.ts"],
  "notes": "Upload route working, need to test with large files",
  "timestamp": "2026-03-05T14:30:00Z"
}
```

Pepper polls these files to track progress and detect blockers.

### Inter-Agent Dependencies

Dependencies are handled by sequencing:
- Agents that produce interfaces (types, schemas, API contracts) run first
- Agents that consume interfaces run after producers complete
- Pepper verifies the interface contract (file exists, exports expected symbols) before spawning consumers

Example: `admin-ui` depends on `admin-api` for route contracts. Pepper:
1. Spawns `admin-api` to build routes
2. Waits for `admin-api` status = "complete"
3. Verifies API routes exist and export handlers
4. Spawns `admin-ui` with the API contract as context

### Parallelization Opportunities

| Phase | Parallel Work |
|-------|--------------|
| 1 | scaffold-config runs parallel to scaffold-impl after 1.1 |
| 2 | pipeline-test starts unit tests as soon as 2.2 completes |
| 3 | admin-api and admin-components run in parallel; admin-ui starts when both complete |
| 4 | gallery-components and gallery-pages can overlap (components slightly ahead) |
| 5 | slideshow-polish starts as soon as 5.2 produces the player |
| 6 | polish-auth, polish-ux, polish-a11y, polish-perf all run in parallel after 6.1 audit |
| 7 | test-unit and test-integration run parallel; E2E runs after relevant phases |
| 8 | deploy-verify starts immediately after deploy-impl confirms site is live |

---

## 4. Quality Gates

### Gate 1: Scaffold -> Image Pipeline
- [ ] `npm run build` exits 0
- [ ] `npx tsc --noEmit` exits 0
- [ ] ESLint passes with zero warnings
- [ ] DB schema can be pushed to Turso (or local SQLite)
- [ ] All files in deliverables list exist
- **Scott review:** Approve directory structure and schema design

### Gate 2: Image Pipeline -> Admin Core
- [ ] Upload test image via curl/API — three variants stored in R2
- [ ] Delete test image — all variants removed, DB record gone
- [ ] Unit tests pass for image processing
- [ ] Build succeeds
- **Scott review:** Verify image quality of processed variants

### Gate 3: Admin Core -> Public Gallery
- [ ] Create album, upload 5 photos, reorder, set cover, delete one — all via admin UI
- [ ] Settings save and load correctly
- [ ] No browser console errors
- [ ] Build succeeds
- **Scott review:** Use admin UI, confirm it feels right

### Gate 4: Public Gallery -> Slideshow
- [ ] Landing page renders with hero cycling
- [ ] Album list and detail pages work
- [ ] Lightbox opens, navigates, closes
- [ ] Lighthouse performance >= 90
- [ ] Images lazy-load
- [ ] Build succeeds
- **Scott review:** Browse gallery, check visual quality and feel

### Gate 5: Slideshow -> Polish
- [ ] Slideshow auto-plays with smooth transitions
- [ ] Controls work (keyboard and mouse)
- [ ] Playlist mode plays multiple albums
- [ ] No jank or flicker
- [ ] Build succeeds
- **Scott review:** Watch a slideshow, test playlist mode

### Gate 6: Polish -> Testing (final)
- [ ] Every page has loading, error, and empty states
- [ ] Responsive at 375px, 768px, 1440px
- [ ] Lighthouse accessibility >= 95
- [ ] Auth middleware functions correctly
- [ ] Build succeeds
- **Scott review:** Spot-check mobile and desktop, try breaking things

### Gate 7: Testing -> Deployment
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Test suite runs 3x without flakes
- **Scott review:** Review test coverage report

### Gate 8: Deployment -> Done
- [ ] Production site loads
- [ ] End-to-end smoke test passes on production
- [ ] Lighthouse performance >= 85 on production
- [ ] README is complete and accurate
- [ ] Domain configured (if ready)
- **Scott review:** Final walkthrough on production, approve handoff

---

## 5. Risk Management

| # | Risk | Impact | Probability | Mitigation | Owner |
|---|------|--------|-------------|------------|-------|
| 1 | R2 free tier exceeded by photo volume | Service cost jumps or images unavailable | Low | Monitor storage usage; add admin dashboard widget showing usage; aggressive image compression | deploy-lead |
| 2 | Turso free tier row/storage limits hit | Database errors | Low | Efficient schema (no bloat); monitor row count; pagination everywhere | scaffold-lead |
| 3 | Sharp processing fails on unusual image formats | Upload errors for user | Medium | Validate input format before processing; support JPEG, PNG, WebP, HEIC; clear error messages | pipeline-impl |
| 4 | Vercel serverless function timeout on large uploads | Upload fails silently | Medium | Client-side pre-resize before upload (max 4000px); chunked upload for very large files; 60s timeout config | pipeline-impl |
| 5 | Agent file ownership conflict | Corrupted files, lost work | Low | Strict ownership map enforced by Pepper; agents never edit unowned files | Pepper |
| 6 | Cross-browser lightbox/slideshow issues | Broken experience on Safari/Firefox | Medium | Test on all target browsers at Gate 4 and 5; use well-supported CSS/JS patterns | gallery-lead |
| 7 | Scope creep during polish phase | Phase 6 balloons, delays deployment | Medium | Polish lead defines finite task list at 6.1; Pepper enforces scope; defer nice-to-haves to post-launch | polish-lead |
| 8 | Missing environment variables in production | Deploy succeeds but app crashes | Medium | .env.example is comprehensive; deploy-lead creates explicit checklist; startup validation logs missing vars | deploy-lead |
| 9 | No auth in v1 means admin is open | Unauthorized access to admin | Low (limited audience) | Admin URL is obscure; auth middleware stub is ready to enable; add auth as first post-launch task | polish-auth |
| 10 | HEIC from iPhones not handled | iPhone photos fail to upload | Medium | Sharp supports HEIC with libvips; test with real iPhone photos at Gate 2 | pipeline-impl |

---

## 6. Communication Plan

### Pepper -> Scott Reporting

**At each quality gate**, Pepper posts a structured report:

```
## Gate [N] Report: [Phase Name] Complete

### Done
- [Bullet list of what was built/completed]

### Quality Checks
- [x] Build passes
- [x] Tests pass (N/N)
- [ ] Lighthouse >= 90 (actual: 87 — see notes)

### Decisions Needed
- [Any choices that require Scott's input]

### Next Phase
- [What Phase N+1 will do]
- [Estimated agent count and duration]

### Blockers
- [None / list any]
```

### Mid-Phase Updates

For phases lasting more than ~30 minutes of agent time, Pepper provides a brief mid-phase update:

```
Phase [N] in progress — [X/Y] tasks complete. No blockers.
```

### Escalation Protocol

If an agent is blocked or encounters an unexpected issue:
1. Agent writes `"status": "blocked"` to its status file with details
2. Pepper attempts to resolve (reassign, resequence, provide context)
3. If Pepper cannot resolve, Pepper escalates to Scott with the specific question and recommended options

---

## 7. Definition of Done

### Functional Requirements
- [ ] Photo upload works (drag-drop and file picker) with progress indication
- [ ] Photos are processed into thumbnail, display, and original variants
- [ ] Albums can be created, renamed, reordered, and deleted
- [ ] Photos can be added to albums, reordered within albums, and deleted
- [ ] Album covers can be set manually
- [ ] Hero album can be designated in settings
- [ ] Landing page displays hero images with crossfade cycling
- [ ] Album list page shows all albums with covers and photo counts
- [ ] Album detail page shows photo grid
- [ ] Lightbox opens from photo grid with prev/next/close
- [ ] Fullscreen slideshow plays through album with configurable speed
- [ ] Playlist mode plays through multiple albums sequentially
- [ ] Slideshow controls: play/pause, prev/next, speed, fullscreen, exit
- [ ] Settings page allows configuring hero album and site title

### Non-Functional Requirements
- [ ] Lighthouse performance >= 90 (public pages, development)
- [ ] Lighthouse performance >= 85 (production)
- [ ] Lighthouse accessibility >= 95 (public pages)
- [ ] WCAG 2.1 AA compliance on all public pages
- [ ] All images lazy-load below the fold
- [ ] Slideshow transitions render at 60fps
- [ ] Page load under 2 seconds on 4G connection
- [ ] TypeScript strict mode, zero type errors
- [ ] ESLint clean, zero warnings
- [ ] No unhandled errors in console during normal use

### Testing Requirements
- [ ] Unit test coverage >= 80% for lib/
- [ ] All API routes have integration tests
- [ ] 4 critical E2E flows pass (admin, upload, gallery, slideshow)
- [ ] Test suite is not flaky (3 consecutive clean runs)

### Deployment Requirements
- [ ] Production site live on Vercel
- [ ] Custom domain configured (if DNS is ready)
- [ ] Environment variables set correctly
- [ ] Database migrations applied to production
- [ ] R2 bucket accessible from production
- [ ] SSL working on custom domain

### Documentation Requirements
- [ ] README.md covers: what, why, setup, deploy, maintain, env vars, architecture overview
- [ ] .env.example lists all required environment variables with descriptions
- [ ] No secrets committed to repository

### Handoff Requirements
- [ ] Photographer can upload photos through the admin UI
- [ ] Photographer can create and manage albums
- [ ] Photographer can view their gallery as visitors see it
- [ ] Photographer can run a slideshow for presentations
- [ ] Scott knows how to run a Claude Code session for maintenance

---

## 8. Post-Launch

### Monitoring

- **Vercel Analytics:** Enable on the Vercel dashboard — tracks page views, web vitals, and errors at no cost on free tier.
- **Error tracking:** Vercel's built-in function logs for serverless errors. Add `console.error` with structured context in API routes.
- **Storage monitoring:** Periodic check of R2 usage via Cloudflare dashboard. Add a `/api/admin/stats` route that reports photo count and estimated storage.
- **Uptime:** Vercel provides basic uptime monitoring. For more, a free Uptime Robot check on the landing page.

### Future Roadmap

| Priority | Feature | Notes |
|----------|---------|-------|
| 1 | Authentication (Auth.js) | Enable the middleware stub; add Google/email sign-in; protect admin routes |
| 2 | Mobile upload from camera roll | Optimize upload UI for mobile; handle HEIC natively; batch upload |
| 3 | Social sharing | OG images per album; share buttons; copy-link for individual photos |
| 4 | Photo metadata display | Extract and show EXIF data (camera, lens, settings) on photo detail |
| 5 | Multiple photographers | Multi-tenant support — each photographer gets their own albums |
| 6 | Custom themes | Let photographer choose color scheme, fonts, layout style |
| 7 | Download originals | Visitors can download full-resolution originals (toggle per album) |
| 8 | Album privacy | Public, unlisted (link-only), and private album visibility |
| 9 | Comments / guestbook | Simple visitor feedback on albums |
| 10 | CDN + edge caching | Cloudflare Workers in front of R2 for global edge caching |

### Maintenance Plan

All maintenance is handled through Claude Code sessions:

- **Bug fixes:** Scott describes the issue; Claude Code agent diagnoses, fixes, tests, and deploys.
- **Feature additions:** Scott describes the feature; Claude Code agent implements following the same phase pattern (design -> implement -> test -> deploy).
- **Dependency updates:** Periodic session to run `npm outdated`, update deps, run tests, deploy.
- **Database changes:** Drizzle migrations created and applied via Claude Code. Always test against a Turso branch database before production.
- **Content management:** The photographer handles all content through the admin UI. No Claude Code needed for day-to-day use.

---

*This plan is the canonical reference for project execution. Pepper reads this document at the start of each phase and follows it exactly. Any changes require Scott's approval and an update to this document.*

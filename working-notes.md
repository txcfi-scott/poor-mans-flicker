# Working Notes — Poor Man's Flickr

## Checkpoint — Mar 5 2026

### Project Status: Phase 5 Starting
Phases 1-4 complete and pushed to GitHub. Phase 5 (Public Gallery) about to begin.

### GitHub Repo
https://github.com/txcfi-scott/poor-mans-flicker

### Completed Phases

**Phase 1: Project Scaffold** ✓
- Next.js 16.1.6 + TypeScript strict mode
- Turso + Drizzle ORM with full schema (albums, photos, siteConfig)
- R2 storage abstraction (R2 + local filesystem)
- Tailwind dark theme with custom animations
- Full route structure (public + admin + login)
- Environment variable validation
- Shared types, constants, utils

**Phase 2: Image Pipeline** ✓
- Sharp processing: 3 WebP variants (thumb 400px, display 1600px, full 2400px) + BlurHash
- EXIF extraction with formatted camera/lens/settings
- Upload API endpoint (POST /api/albums/[id]/photos)
- Client-side pre-resize (max 4096px, 4MB target)
- Client-side EXIF reading
- Photo delete + bulk delete endpoints with R2 cleanup
- Lazy DB initialization for static page generation

**Phase 3: Admin Album Management** ✓
- Album CRUD API routes (GET, POST, PATCH, DELETE)
- Album reorder API (PUT /api/albums/reorder)
- Admin album list page with @dnd-kit drag-and-drop
- Album create/edit form with real-time slug preview
- Query functions (getAlbums, getAlbum, getAlbumBySlug, getHeroAlbums)
- Photo and config query functions

**Phase 4: Admin Photo Management** ✓
- Photo upload UI (drag-and-drop zone, pre-resize, progress tracking)
- Photo grid with sortable drag-and-drop reordering
- Photo edit modal (EXIF display, caption editing, focus trap)
- Photo reorder API + set cover API
- Bulk actions bar (select, bulk delete with confirmation)
- Album detail page assembling all components

### Remaining Phases

**Phase 5: Public Gallery** — NEXT
- Landing page with hero image cycling
- Albums index page (grid of album covers)
- Album detail page (justified photo grid)
- Lightbox component (fullscreen viewer with nav)
- Hero carousel component
- BlurHash image placeholder component
- Header/footer layout components

**Phase 6: Slideshow Engine**
- Fullscreen slideshow player
- Transitions (crossfade, Ken Burns)
- Controls (play/pause, prev/next, speed)
- Keyboard + touch support
- Playlist mode (multi-album)
- Playlist building UI

**Phase 7: Polish & Auth**
- Admin auth middleware (env var token)
- Login page
- Site settings page
- Responsive polish
- Loading/skeleton states
- Error handling/boundaries
- Empty states
- Admin navigation

**Phase 8: Deployment**
- Vercel setup + environment variables
- Turso production database + schema push
- R2 production bucket
- Domain + DNS configuration
- Smoke test

### Stack Decisions (Final)
- Next.js 16 (App Router) + TypeScript
- Turso (SQLite over HTTP) + Drizzle ORM
- Cloudflare R2 for image storage (zero egress)
- Vercel hosting (free tier, git push deploy)
- Sharp for image processing
- Tailwind CSS v4 dark theme
- @dnd-kit for drag-and-drop
- Auth.js deferred — v1 uses env var token

### Domain
chrishardingphotography.com — to be registered on Cloudflare (~$10.46/yr)

### Chris Setup
- Chris is non-technical photographer, hands-off
- GitHub username: Sgtpilot
- Will use Claude Code ($20/mo) for all site updates — just talks to it in English
- Two setup guides created:
  1. chris-accounts-guide.html — JUST account creation + send Scott credentials (IN PROGRESS)
  2. chris-setup-guide.html — full dev environment setup (for later)
- setup/install.sh — one-shot bootstrap script
- setup/services.md — detailed service docs
- CLAUDE.md — project guide for Claude Code sessions
- Scott can also remote in to help

### Key Files
- docs/architecture.md — system design, data model, API specs, directory structure
- docs/ui-design.md — design system, wireframes, component specs
- docs/development-plan.md — 8 phases, 52 tasks, 89 files, dependency graph
- docs/test-plan.md — 197+ test cases
- docs/project-plan.md — execution plan, quality gates, definition of done
- pepper.md — Pepper orchestration config
- CLAUDE.md — Chris's Claude Code project guide

### Git Commits
1. Initial scaffold (create-next-app + planning docs)
2. Phase 1: Project scaffold complete
3. Phase 2: Image pipeline + Chris developer kit
4. Phase 3+4: Admin album and photo management (pending push)

### Cost
- Hosting: $0/mo (Vercel free)
- Database: $0/mo (Turso free, 9GB)
- Image storage: $0/mo (R2 free tier)
- Domain: ~$10.46/yr (Cloudflare)
- Total: ~$1/mo

## Checkpoint — 2026-03-05 Evening

### Session Summary
Major QA and fix cycle. Pepper ran full project autonomously.

### Completed This Session
- **Phase 5 Public Gallery** — 15 files: hero carousel, album grid, album detail, photo grid, lightbox, header/footer, BlurHash placeholders
- **Soft-delete safety system** — Schema changes, query filters, trash API routes, restore endpoints
- **Auth system** — Middleware protecting /admin, login page, session cookies, auth on all admin API routes, logout
- **Admin UI** — Dashboard with stats, sidebar navigation, settings page with config form, trash management page
- **Error pages** — Custom 404 and error boundary
- **Missing API routes** — /api/auth/login, /api/auth/logout, /api/config, /api/hero, /api/slideshow
- **Bug fixes** — Admin photo URLs (was hardcoded local paths), photo reorder payload mismatch, soft-delete filtering in API routes, Suspense boundary on login
- **Infrastructure** — R2 bucket created, Turso DB + schema, Vercel project + all env vars, DNS records, R2 public access enabled
- **Chris's machine** — Bootstrap script, Claude Code installed, global Claude config
- **Docs** — Test plan (97 cases), backup strategy, machine setup playbook

### Test Results (Live Site)
- 16/18 API tests passing (config route 404 being redeployed)
- Public pages all working with real photos
- Auth middleware working (admin redirect + API enforcement)
- Custom domain live: chrishardingphotography.com

### Known Issues
- /api/config returning 404 (deployment caching, redeploying)
- Vercel git link disconnected — deploys are manual via `vercel deploy --prod`
- Need to install Vercel GitHub App on txcfi-scott account for auto-deploy
- Slideshow page is still a stub (Phase 6 work)
- P2 items from Gwynne's review: slug collision on update, date serialization, no loading states, no pagination, globals.css img rule may conflict with gallery

### Remaining Phases
- **Phase 6:** Slideshow Engine (fullscreen player, transitions, controls, playlist mode)
- **Phase 7:** Polish (responsive, loading states, empty states, remaining P2 fixes)
- **Phase 8:** Deployment finalization (auto-deploy, domain SSL verification, smoke test)

### Credentials (locations only)
- .env.local — all secrets for local dev
- Vercel project env vars — all secrets for production
- Machine setup playbook — ~/.claude/projects/.../memory/machine-setup-playbook.md

--- Checkpoint saved ---

## Checkpoint — 2026-03-06

### Session Summary
Full build session: Phase 6 + Polish + UI Design Pass. Pepper orchestrated 7 waves with parallel agents.

### Completed This Session
- **Phase 6: Slideshow Engine** — 5 files: useSlideshow hook, SlideshowPlayer (crossfade, dual-layer), KenBurnsLayer (randomized zoom+pan), SlideshowControls (auto-hide, speed selector), slideshow page (server component with URL resolution)
- **P2 Bug Fixes** — slug collision on album update, date serialization in AlbumCard, globals.css img rule scoping, dead code removal (client-exif), error boundaries for public + admin route groups
- **Loading Skeletons** — 7 loading.tsx files for all route segments, Skeleton component, improved AlbumList empty state
- **Responsive Polish** — header mobile fade transition, admin sidebar slide-out, lightbox touch swipe, 44px touch targets, photo grid overflow fix
- **UI Design Pass (Jony's spec)** — 24 files modified:
  - Design token system: 20 semantic tokens in globals.css replacing ~80 hardcoded hex values
  - Typography: font-light headings, tracking-tight, typographic scale
  - Header: scroll-aware transparency on home page, auto-detects via usePathname
  - Footer: simplified to single copyright line
  - Hero: Ken Burns animation, cinematic gradient, centered text, float scroll indicator
  - Album cards: borderless, 3/2 aspect, subtle scale+brightness hover
  - Photo grid: 4px gap, 260/300/360px row heights
  - Photo cards: no border, persistent gradient, caption fade-in
  - Lightbox: always-visible nav, simplified close, larger caption
  - Login: pure Tailwind (no inline styles)
  - 404: subtle text-8xl font-extralight
  - Admin: tinted stat cards, font-light values, checkbox rings, modal polish
  - Page transitions: fadeIn animation on route change

### Deployment
- Git push: 6 commits pushed to origin/main
- Vercel auto-deploy: WORKING (git integration reconnected)
- Smoke test: 8/8 endpoints passing
- Live at: https://chrishardingphotography.com

### What's Left
- **Phase 8 misc:** Vercel GitHub App confirmed working
- **Playlists:** Cut from v1 (Elon's recommendation) — ship later if Chris wants it
- **Remaining P2 from Gwynne:** pagination (deferred, not needed for <500 photos)
- **middleware deprecation:** Next.js 16 warns about middleware → proxy convention, not blocking

### Git Commits This Session
1. 02ebd7b — P2 bug fixes: slug collision, date serialization, CSS scoping
2. 5da850f — Phase 6: Slideshow engine — crossfade, Ken Burns, controls
3. c29bf71 — Add loading skeletons and improve admin empty states
4. e1373df — Responsive polish: transitions, touch targets, swipe navigation
5. e4d27a7 — W5a: Design tokens, typography, layout — Jony's design pass
6. 3673700 — W5b: Gallery + admin design polish — Jony's design pass

--- Checkpoint saved ---

## Checkpoint — 2026-03-06 (Session 2)

**Branch:** main
**Uncommitted changes:** M pepper.md, M working-notes.md, ?? .env.vercel, ?? build-monitor/elon-playlist-plan.md, ?? build-monitor/elon-session-plan.md, ?? build-monitor/jony-design-review.md, ?? build-monitor/status/elon-plan.json, ?? build-monitor/status/elon-playlist.json, ?? build-monitor/status/jony-design.json, ?? build-monitor/status/w6-deploy.json

**Session work:**
- Phase 6: Slideshow Engine (5 files) — crossfade, Ken Burns, controls, keyboard/touch
- P2 Bug Fixes (6 items) — slug collision, date serialization, CSS scoping, dead code, error boundaries
- Loading Skeletons (7 loading.tsx files) + empty state improvements
- Responsive Polish (5 files) — touch swipe, mobile transitions, 44px touch targets
- UI Design Pass (24 files) — Jony's full spec: design tokens, typography, transparent header, simplified footer, editorial photo grid, admin polish
- Playlists feature (full stack):
  - Backend: playlists + playlist_photos tables, 11 query functions, 7 API endpoints
  - Admin UI: list page, new page, editor with photo picker (dnd-kit), sidebar nav
  - Public: listing page, detail page with photo grid, slideshow playback, header nav link
  - SlideshowPlayer refactored: albumSlug → backUrl prop
- Vercel redeployment (env vars re-added after stale project link)
- Visual QA via headless browser — confirmed design changes on vercel.app

**Deploy status:**
- All changes deployed to poor-mans-flicker.vercel.app ✅
- Custom domain (chrishardingphotography.com) — see correction note below

**Blockers:**
- None confirmed — see correction note at bottom of file

**Git commits this session:**
1. 97e5a6f — Playlists: admin UI — list, editor, photo picker [TESTED]
2. ba58713 — Playlists: public pages + slideshow playback [TESTED]
3. af21ee6 — Playlists: schema, queries, API routes [TESTED]
4. 3673700 — W5b: Gallery + admin design polish — Jony's design pass [TESTED]
5. e4d27a7 — W5a: Design tokens, typography, layout — Jony's design pass [TESTED]

**Notes:**
- Playlists were originally cut from v1 by Elon, then Scott asked for them — now shipped
- Elon's plan: build-monitor/elon-session-plan.md and elon-playlist-plan.md
- Jony's design review: build-monitor/jony-design-review.md
- Vercel project was re-linked during this session; env vars were re-added via CLI

--- Checkpoint saved before context clear ---

## Correction — 2026-03-06

**Vercel account ownership:** The Vercel project is on Chris's (Sgtpilot's) account, not Scott's. Scott develops locally and pushes to GitHub; Vercel auto-deploys from Chris's account. The custom domain (chrishardingphotography.com) should already be configured on Chris's Vercel project since it's his account. The "domain blocker" from the previous session (needing to remove the domain from an "old" account) may not be a real blocker — it was based on a misunderstanding of whose account the project lives on.

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

## Checkpoint — 2026-03-05 13:25:52

**Branch:** main
**Uncommitted changes:** M pepper.md, M working-notes.md, ?? setup/chris-accounts-guide.html
**Session work:**
- Phases 1-4 fully implemented and pushed to GitHub (txcfi-scott/poor-mans-flicker)
- Phase 1: Next.js scaffold, Turso+Drizzle, R2 storage, Tailwind dark theme, route structure, env validation
- Phase 2: Sharp image pipeline, EXIF extraction, upload/delete APIs, client-side resize
- Phase 3: Album CRUD APIs, reorder API, admin album list with drag-and-drop, create/edit form, query functions
- Phase 4: Photo upload UI, photo grid with drag-and-drop, edit modal, bulk actions, album detail page
- Chris developer kit: CLAUDE.md, setup guides (accounts-only + full), install script, services docs
- Domain research: chrishardingphotography.com selected, register on Cloudflare (~$10.46/yr)
- GitHub repo created and all phases pushed

**Next step:** Dispatch Phase 5 — Public Gallery (landing page with hero cycling, albums index, album detail with photo grid, lightbox, header/footer)
**Blockers:** None
**Notes:**
- Chris accounts guide (chris-accounts-guide.html) ready to send — just 3 browser signups, no installs
- Chris will use Claude Code for all updates — not technical, talks to Claude in plain English
- Admin pages marked force-dynamic (they hit DB at render time)
- Total project cost: ~$1/mo (Vercel free + Turso free + R2 free + domain $10.46/yr)
- Build passes clean, TypeScript strict, all routes compiling

--- Checkpoint saved before context clear ---

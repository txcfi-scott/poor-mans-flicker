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

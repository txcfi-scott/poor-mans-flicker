# Poor Man's Flickr — Project Guide

## What This Is
Photo portfolio/gallery site for Chris Harding Photography. Built with Next.js, hosted on Vercel, images on Cloudflare R2, database on Turso.

## Tech Stack
- **Framework:** Next.js 16 (App Router) + TypeScript (strict mode)
- **Database:** Turso (SQLite over HTTP) via Drizzle ORM
- **Image Storage:** Cloudflare R2 (S3-compatible, zero egress fees)
- **Image Processing:** Sharp (server-side, generates thumb/display/full WebP variants)
- **Styling:** Tailwind CSS v4 (dark theme)
- **Hosting:** Vercel (free tier)
- **Auth:** Environment variable token (v1) — cookie-based session after login

## Project Structure
```
src/
  app/
    (public)/                          # Public pages (no layout prefix in URL)
      layout.tsx                       # Public layout: nav, footer, theme
      page.tsx                         # Home page: hero carousel + featured albums
      albums/
        page.tsx                       # Album listing grid
        [slug]/
          page.tsx                     # Album detail: photo grid
          slideshow/
            page.tsx                   # Fullscreen slideshow for album
    admin/
      layout.tsx                       # Admin layout: sidebar nav, auth check
      page.tsx                         # Admin dashboard
      albums/
        page.tsx                       # Album management list
        new/
          page.tsx                     # Create album form
        [id]/
          page.tsx                     # Edit album: photos grid, upload, reorder
      settings/
        page.tsx                       # Site configuration form
    login/
      page.tsx                         # Login form (token entry)
    api/
      auth/login/route.ts             # POST: validate token, set cookie
      albums/
        route.ts                       # GET: list albums, POST: create album
        reorder/route.ts               # PUT: reorder albums
        [id]/
          route.ts                     # PATCH: update album, DELETE: delete album
          cover/route.ts               # PUT: set cover photo
          photos/
            route.ts                   # POST: upload photos
            reorder/route.ts           # PUT: reorder photos
      photos/
        [id]/route.ts                  # PATCH: update caption, DELETE: delete photo
        bulk/route.ts                  # DELETE: bulk delete photos
      hero/route.ts                    # GET: hero carousel photos
      slideshow/route.ts               # GET: slideshow photos
      config/route.ts                  # GET: site config, PATCH: update config
    layout.tsx                         # Root layout: html, body, fonts, metadata
    globals.css                        # Tailwind imports + global styles
    error.tsx                          # Root error boundary
    not-found.tsx                      # 404 page
  components/
    ui/                                # Reusable UI primitives
      button.tsx, input.tsx, dialog.tsx, dropdown-menu.tsx, skeleton.tsx, toast.tsx
    gallery/
      photo-grid.tsx                   # Responsive masonry/grid layout
      photo-card.tsx                   # Single photo tile with blurhash placeholder
      album-card.tsx                   # Album cover tile for album list
      lightbox.tsx                     # Full-screen photo viewer overlay
      slideshow.tsx                    # Slideshow player (fullscreen, auto-advance)
      hero-carousel.tsx                # Home page hero image carousel
      blurhash-image.tsx               # <img> wrapper with BlurHash placeholder
    admin/
      album-form.tsx                   # Create/edit album form
      photo-uploader.tsx               # Drag-and-drop multi-file upload
      photo-manager.tsx                # Photo grid with select, reorder, delete
      sortable-list.tsx                # Drag-and-drop reorderable list
      settings-form.tsx                # Site configuration form
    layout/
      header.tsx                       # Site header/nav
      footer.tsx                       # Site footer
      admin-sidebar.tsx                # Admin navigation sidebar
  lib/
    db/
      schema.ts                        # Drizzle schema definitions (all tables)
      index.ts                         # Database client initialization
      queries/
        albums.ts                      # Album query functions
        photos.ts                      # Photo query functions
        config.ts                      # SiteConfig query functions
    storage/
      types.ts                         # StorageProvider interface
      r2.ts                            # R2 implementation
      local.ts                         # Local filesystem implementation
      index.ts                         # Provider factory
    images/
      process.ts                       # Sharp processing pipeline
      variants.ts                      # Variant definitions (dimensions, quality)
      blurhash.ts                      # Server-side BlurHash generation
      exif.ts                          # EXIF normalization utility
    api/
      response.ts                      # apiError(), apiSuccess() helpers
      validate.ts                      # Request validation utilities
    utils/
      slug.ts                          # Slug generation from title
      id.ts                            # ID generation (nanoid)
      url.ts                           # Photo URL builder
    constants.ts                       # Image variant sizes, upload limits
  hooks/
    use-upload.ts                      # Upload state management hook
    use-slideshow.ts                   # Slideshow playback hook
    use-lightbox.ts                    # Lightbox open/close/navigate hook
  workers/
    image-processor.ts                 # Web Worker for client-side image resize + blurhash
drizzle/                               # Generated migrations
scripts/
  seed.ts                              # Database seed script
middleware.ts                          # Auth middleware
drizzle.config.ts                      # Drizzle Kit configuration
next.config.ts                         # Next.js configuration
```

## Key Conventions
- All components are Server Components by default. Add `'use client'` only for interactivity.
- API routes are thin — validate, call query functions from `src/lib/`, return responses.
- Business logic lives in `src/lib/`, not in route handlers.
- Images stored in R2 at: `albums/{albumId}/{photoId}/{variant}.webp`
- Variants: thumb (400px, q80), display (1600px, q85), full (2400px, q90) — all WebP
- Database schema defined in `src/lib/db/schema.ts` — use Drizzle migrations for changes.
- Use `generateId()` from `src/lib/utils/id.ts` for new IDs (nanoid).
- Use `generateSlug()` from `src/lib/utils/slug.ts` for URL slugs.
- Upload limits: max 20MB per file, max 10 files per upload, max 50 photos per bulk delete.
- Accepted upload types: JPEG, PNG, WebP, HEIC.
- Client-side resize to max 4096px / 4MB before upload.

## Design System (Dark Theme)
```
Background:   #0A0A0B (primary), #141416 (secondary/cards), #1E1E22 (tertiary/inputs), #28282E (elevated)
Text:         #F0F0F2 (primary), #9E9EA8 (secondary/captions), #636370 (disabled)
Borders:      #2A2A30 (default), #3E3E48 (hover), #6B8AFF (focus)
Accent:       #6B8AFF (primary), #8BA3FF (hover), #6B8AFF1A (muted 10%)
Success:      #4ADE80 (text), #4ADE801A (bg)
Warning:      #FACC15 (text), #FACC151A (bg)
Error:        #F87171 (text), #F871711A (bg)
Font:         Inter (headings + body)
```

## Common Tasks

### Adding a new feature
1. Check if it touches the database — if so, update `src/lib/db/schema.ts` and run `npx drizzle-kit push`
2. Add query functions in `src/lib/db/queries/` if needed
3. Add API route if needed in `src/app/api/`
4. Add UI component in `src/components/`
5. Add page in `src/app/(public)/` or `src/app/admin/`

### Fixing a bug
1. Read the relevant files first
2. Make the fix
3. Run `npm run build` to verify no errors
4. Commit and push — Vercel auto-deploys

### Updating site content/settings
- Site settings are in the database, managed via /admin/settings
- To change the site title, description, colors — use the admin UI or update via API
- To add/remove albums — use the admin UI at /admin/albums

## Safety Rules for Site Management

These rules apply when managing photos and albums through Claude Code sessions.

### Before Any Delete Operation
1. **Always confirm** with the user what specifically should be deleted
2. **List all affected items** before proceeding (album name, photo count, photo names)
3. **Remind the user** that deleted items go to trash and can be recovered for 30 days
4. **Never** delete more than what was explicitly requested

### Before Any Schema/Database Change
1. Back up the database first: `turso db shell poor-mans-flicker .dump > backup-$(date +%Y%m%d).sql`
2. Verify the backup file is non-empty before proceeding
3. Explain what the migration will change in plain English

### Prohibited Actions
- **Never** run raw SQL DELETE without a WHERE clause
- **Never** bypass the soft-delete system by deleting R2 objects directly
- **Never** empty the trash without explicit user confirmation and a count of what will be permanently removed
- **Never** run `drizzle-kit push` without backing up the database first
- **Never** modify environment variables without explaining what each change does

### Recovery Quick Reference
- **"I deleted an album by accident"** → Go to /admin/trash, find the album, click Restore
- **"The site looks broken"** → Vercel dashboard → Deployments → click "..." on the previous deployment → Redeploy
- **"I need to undo my last change"** → `git revert HEAD` then `git push`

## Environment Variables
Required in Vercel dashboard and `.env.local` for local dev:
- `TURSO_DATABASE_URL` — Turso database HTTP URL
- `TURSO_AUTH_TOKEN` — Turso auth token
- `R2_ENDPOINT` — Cloudflare R2 S3-compatible endpoint
- `R2_ACCESS_KEY` — R2 access key ID
- `R2_SECRET_KEY` — R2 secret access key
- `R2_BUCKET` — R2 bucket name
- `R2_PUBLIC_URL` — Public URL for R2 bucket (CDN)
- `ADMIN_TOKEN` — Secret token for admin login
- `NEXT_PUBLIC_SITE_URL` — Public site URL

## Development Commands
- `npm run dev` — start dev server on localhost:3000
- `npm run build` — production build (run before committing)
- `npm run lint` — run ESLint
- `npx drizzle-kit push` — push schema changes to database
- `npx drizzle-kit studio` — visual database browser

## Deployment
Push to main branch → Vercel auto-deploys. That's it.

## Database Schema

### albums
| Column        | Type      | Notes                                    |
|---------------|-----------|------------------------------------------|
| id            | text PK   | nanoid                                   |
| title         | text      | not null                                 |
| slug          | text      | not null, unique                         |
| description   | text      | nullable                                 |
| coverPhotoId  | text      | nullable, references a photo ID          |
| sortOrder     | integer   | default 0                                |
| isHero        | boolean   | default false — include in hero carousel |
| isPublic      | boolean   | default true                             |
| createdAt     | timestamp | auto-set                                 |
| updatedAt     | timestamp | auto-set                                 |

### photos
| Column           | Type      | Notes                                  |
|------------------|-----------|----------------------------------------|
| id               | text PK   | nanoid                                 |
| albumId          | text FK   | references albums.id, cascade delete   |
| filename         | text      | not null                               |
| originalFilename | text      | not null                               |
| width            | integer   | not null                               |
| height           | integer   | not null                               |
| sizeBytes        | integer   | not null                               |
| mimeType         | text      | not null                               |
| exifJson         | text      | nullable, JSON string                  |
| caption          | text      | nullable                               |
| sortOrder        | integer   | default 0                              |
| storageKey       | text      | not null, unique — R2 path prefix      |
| blurhash         | text      | not null                               |
| createdAt        | timestamp | auto-set                               |

### site_config
| Column                     | Type    | Default            |
|----------------------------|---------|--------------------|
| id                         | integer | 1 (singleton row)  |
| siteTitle                  | text    | 'My Photography'   |
| siteDescription            | text    | 'A photography portfolio' |
| heroIntervalMs             | integer | 5000               |
| slideshowDefaultIntervalMs | integer | 4000               |
| themeColorPrimary          | text    | '#ffffff'          |
| themeColorBackground       | text    | '#0a0a0a'          |
| themeColorAccent           | text    | '#3b82f6'          |
| themeFontHeading           | text    | 'Inter'            |
| themeFontBody              | text    | 'Inter'            |

## API Endpoints

### Albums
| Method | Path                            | Auth | Description                        |
|--------|---------------------------------|------|------------------------------------|
| GET    | /api/albums                     | No*  | List albums (*includePrivate needs auth) |
| POST   | /api/albums                     | Yes  | Create album                       |
| GET    | /api/albums/[slug]              | No   | Get album with photos by slug      |
| PATCH  | /api/albums/[id]                | Yes  | Update album                       |
| DELETE | /api/albums/[id]                | Yes  | Delete album + all photos          |
| PUT    | /api/albums/reorder             | Yes  | Reorder albums                     |
| PUT    | /api/albums/[id]/cover          | Yes  | Set cover photo                    |

### Photos
| Method | Path                                  | Auth | Description                  |
|--------|---------------------------------------|------|------------------------------|
| POST   | /api/albums/[albumId]/photos          | Yes  | Upload photos (multipart)    |
| PUT    | /api/albums/[albumId]/photos/reorder  | Yes  | Reorder photos in album      |
| PATCH  | /api/photos/[id]                      | Yes  | Update photo caption         |
| DELETE | /api/photos/[id]                      | Yes  | Delete single photo          |
| DELETE | /api/photos/bulk                      | Yes  | Bulk delete (max 50)         |

### Other
| Method | Path             | Auth | Description                     |
|--------|------------------|------|---------------------------------|
| POST   | /api/auth/login  | No   | Validate token, set session     |
| GET    | /api/hero        | No   | Hero carousel photos            |
| GET    | /api/slideshow   | No   | Slideshow photos                |
| GET    | /api/config      | No   | Get site config                 |
| PATCH  | /api/config      | Yes  | Update site config              |

## Dependencies
- **next** 16.1.6, **react** 19.2.3
- **drizzle-orm** 0.45.1 + **@libsql/client** 0.17.0 (Turso)
- **@aws-sdk/client-s3** 3.x (R2 storage)
- **sharp** 0.34.5 (image processing)
- **blurhash** 2.0.5 (placeholder generation)
- **exifr** 7.1.3 (EXIF extraction)
- **nanoid** 3.3.11 (ID generation)
- **tailwindcss** v4 + **@tailwindcss/postcss**

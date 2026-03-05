# Working Notes — Poor Man's Flickr

## Current Status
Planning phase — formal project docs in progress. First session Mar 5 2026.

## Brief from Scott
- Photo portfolio/gallery site for a photographer friend
- Easy album browsing, upload, delete, management
- Hero album with shots that cycle throughout the site
- Fullscreen slideshow playback with playlist-like options
- All management from the site itself
- Future: auth via various authorization systems
- Future: upload from phone camera roll
- Keep it lean — "poor man's" ethos

## Decisions
- **Framework:** Next.js 15 App Router + TypeScript
- **Styling:** Tailwind CSS
- **Hosting:** Vercel (free tier) — zero ops, git push deploy
- **Database:** Turso (free tier) — SQLite over HTTP via Drizzle ORM
- **Image storage:** Cloudflare R2
- **Image processing:** Sharp (server-side) + client pre-resize before upload
- **Auth:** Deferred to later phase (Auth.js)
- **Maintenance model:** Friend is hands-off — Scott or friend via Claude Code for updates
- **Total cost:** ~$1/mo + domain

## Next Steps
Create formal planning docs:
- Architecture doc
- UI design doc
- Development plan
- Test plan
- Project plan

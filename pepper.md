# Pepper — Project Context

## Project
Poor Man's Flickr — A photo portfolio/gallery site for a photographer friend. Browse albums, upload/manage photos, hero shot cycling, fullscreen slideshow playback, playlist mode. All management via the site itself. Future auth integration.

## Current Phase
Complete — All phases shipped (1-8). Playlists deferred to future.

Phases 1-4 are complete and pushed to GitHub (https://github.com/txcfi-scott/poor-mans-flicker).

## Agent Team
Pepper + soul agents as needed

## Key Files
- working-notes.md — session state and handoff notes
- pepper-state.json — orchestration state
- build-monitor/status/ — agent status files

## Services
None yet

## Notes
- Target user: photographer friend who shoots a lot, wants to quickly organize and show off albums
- Mobile upload from camera roll is a key requirement
- Hero album feeds site-wide imagery (cycling/rotating)
- Slideshow/fullscreen playback with playlist-like options
- All admin/management done through the site (no CLI tools)
- Auth to be added later (Auth.js)
- Friend is hands-off — Scott or friend via Claude Code for updates
- "Poor man's" implies lean, fast, minimal infrastructure — not overbuilt
- **Stack:** Next.js 15 App Router + TypeScript, Tailwind CSS
- **Hosting:** Vercel (free tier, on Chris/Sgtpilot's account) — zero ops, git push deploy
- **Database:** Turso (free tier) — SQLite over HTTP via Drizzle ORM
- **Image storage:** Cloudflare R2
- **Image processing:** Sharp (server-side) + client pre-resize before upload
- **Total cost:** ~$1/mo + domain

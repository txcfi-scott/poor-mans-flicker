# Image Backup & Safety Strategy

**Author:** Gwynne (QA Manager)
**Date:** 2026-03-05
**Audience:** Scott (implementer), with sections Chris can reference

---

## The Problem

Chris is a non-technical photographer who manages his site by talking to Claude Code in plain English. His photos are irreplaceable originals. The current system has several "oops" vectors:

1. **Album deletion cascades to all photos** -- `DELETE /api/albums/{id}` removes all photos from the database (via cascade) AND deletes all image files from R2. One wrong album delete = entire collection gone.
2. **Bulk photo delete is permanent** -- `POST /api/photos/bulk-delete` removes up to 50 photos per call with no recovery path.
3. **Single photo delete is permanent** -- `DELETE /api/photos/{id}` removes the DB record and all R2 variants immediately.
4. **No database backup on free tier** -- Turso free tier does not include point-in-time recovery.
5. **Claude Code can run any operation** -- Chris might say "delete all my landscape photos" and Claude will do it.

Current state: **every delete is permanent and immediate.** There is no undo, no trash, no backup.

---

## 1. Soft-Delete & Trash System

### Strategy

Replace hard deletes with soft deletes. Photos and albums move to a "trash" state instead of being destroyed. R2 objects are untouched until trash is emptied (manually or by scheduled cleanup).

### Schema Changes

Add these columns to the `photos` table:

```sql
ALTER TABLE photos ADD COLUMN deleted_at INTEGER DEFAULT NULL;
ALTER TABLE photos ADD COLUMN deleted_by TEXT DEFAULT NULL;  -- 'user' or 'cascade'
```

Add these columns to the `albums` table:

```sql
ALTER TABLE albums ADD COLUMN deleted_at INTEGER DEFAULT NULL;
```

Add a new trash configuration to `site_config`:

```sql
ALTER TABLE site_config ADD COLUMN trash_retention_days INTEGER NOT NULL DEFAULT 30;
```

### Behavioral Changes

#### Photo Delete (single and bulk)

**Current:** Deletes DB record + R2 objects immediately.

**New:**
1. Set `deleted_at = NOW()` and `deleted_by = 'user'` on the photo record(s).
2. Do NOT delete R2 objects.
3. Do NOT actually delete the DB record.
4. Exclude soft-deleted photos from all public queries (`WHERE deleted_at IS NULL`).
5. Return HTTP 204 as before (caller sees same behavior).

#### Album Delete

**Current:** Deletes album record, cascades to photos, deletes all R2 objects.

**New:**
1. Set `deleted_at = NOW()` on the album.
2. Set `deleted_at = NOW()` and `deleted_by = 'cascade'` on all photos in that album.
3. Do NOT delete R2 objects.
4. Exclude soft-deleted albums from all public queries.
5. Return HTTP 204 as before.

#### Trash Management (New Admin Feature)

Add a `/admin/trash` page and supporting API:

- `GET /api/trash` -- List all soft-deleted albums and photos, grouped.
- `POST /api/trash/restore` -- Restore a photo or album (clear `deleted_at`). When restoring a cascade-deleted photo, check if its album is also deleted; if so, restore the album too.
- `POST /api/trash/empty` -- Permanently delete all items past retention period. This is when R2 objects are actually removed.
- `DELETE /api/trash/{id}` -- Permanently delete a specific trashed item immediately.

#### Query Changes

Every query that lists photos or albums for public consumption needs a `WHERE deleted_at IS NULL` filter. This applies to:

- `getAlbums()` / `listAlbums()`
- `getAlbumBySlug()`
- `getPhotosByAlbum()`
- `getHeroAlbums()`
- Hero API
- Slideshow API
- Config-related album/photo fetches

Admin queries should also filter by default, except for the trash page.

### Automatic Trash Cleanup

**Option A: Vercel Cron Job (recommended)**

Add a cron endpoint that runs daily:

```typescript
// src/app/api/cron/cleanup-trash/route.ts
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent public access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const retentionDays = (await getSiteConfig()).trashRetentionDays;
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  // Find photos deleted before cutoff
  const expiredPhotos = await db.select().from(photos)
    .where(and(
      isNotNull(photos.deletedAt),
      lte(photos.deletedAt, cutoff)
    ));

  // Delete R2 objects
  for (const photo of expiredPhotos) {
    const keys = await storage.list(`${photo.storageKey}/`);
    if (keys.length > 0) await storage.deleteMany(keys);
  }

  // Hard delete expired records
  await db.delete(photos).where(and(
    isNotNull(photos.deletedAt),
    lte(photos.deletedAt, cutoff)
  ));

  // Same for albums with no remaining photos
  await db.delete(albums).where(and(
    isNotNull(albums.deletedAt),
    lte(albums.deletedAt, cutoff)
  ));

  return Response.json({ deleted: expiredPhotos.length });
}
```

Configure in `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/cleanup-trash",
    "schedule": "0 3 * * *"
  }]
}
```

**Note:** Vercel free tier supports one cron job. This is a good use of it.

**Option B: R2 Object Lifecycle Rules**

Cloudflare R2 does not currently support lifecycle rules (unlike S3). So cleanup must be application-driven. If Cloudflare adds lifecycle rules in the future, they could be used as a secondary safety net.

### Retention Period

Default: **30 days.** Configurable in site settings.

This means Chris has 30 days to realize he made a mistake and restore deleted photos. After 30 days, the cron job permanently deletes them.

---

## 2. Database Backup

### Turso Free Tier Limitations

Turso free tier does NOT provide:
- Point-in-time recovery
- Automated backups
- Snapshot API access

### Strategy: Application-Level DB Dumps

#### Pre-Migration Backup

Before any schema change or `drizzle-kit push`, dump the database:

```bash
# Add to CLAUDE.md as a mandatory step
# Before running: npx drizzle-kit push
turso db shell poor-mans-flicker .dump > backups/db-$(date +%Y%m%d-%H%M%S).sql
```

Store backups in the project's `backups/` directory (gitignored).

#### Scheduled Database Export

Add a script that Claude Code (or a cron) can run periodically:

```bash
#!/bin/bash
# scripts/backup-db.sh
BACKUP_DIR="$HOME/Claude/poor-mans-flicker/backups"
mkdir -p "$BACKUP_DIR"
FILENAME="db-$(date +%Y%m%d-%H%M%S).sql"
turso db shell poor-mans-flicker .dump > "$BACKUP_DIR/$FILENAME"
echo "Database backed up to $BACKUP_DIR/$FILENAME"

# Keep only last 10 backups
ls -t "$BACKUP_DIR"/db-*.sql | tail -n +11 | xargs rm -f 2>/dev/null
```

#### Backup to R2

For off-machine safety, upload DB dumps to a dedicated R2 prefix:

```
backups/db/db-20260305-143000.sql
```

This means even if the local machine is lost, DB backups survive in R2.

#### Drizzle Migration Discipline

- Never run `drizzle-kit push` without a backup first.
- Keep all migrations in the `drizzle/` directory (already the case).
- Test migrations against a local SQLite copy before pushing to Turso.

### Upgrade Path: Turso Paid Tier

If Chris's site grows or the data becomes critical enough:

- **Turso Scaler plan ($29/mo):** Includes point-in-time recovery (up to 24 hours), automated backups, and recovery API.
- This would replace the manual backup strategy entirely.
- Until then, the application-level approach works.

---

## 3. "Oh Shit" Recovery Playbook

### Scenario 1: "I accidentally deleted an album"

**With soft-delete implemented:**

1. Go to `/admin/trash` in the browser (or ask Claude Code to check the trash).
2. Find the deleted album in the trash list.
3. Click "Restore" (or ask Claude: "restore the Landscapes album from trash").
4. Album and all its photos reappear on the public site.
5. If more than 30 days have passed, the photos are permanently gone (see Scenario 4).

**Without soft-delete (current state):**

1. Check if the photos are still in R2 (they might be if the delete failed partway).
   ```bash
   # List objects in R2 for the album
   aws s3 ls s3://$R2_BUCKET/albums/{albumId}/ --endpoint-url $R2_ENDPOINT
   ```
2. If R2 objects exist, you can re-import them, but you have lost all metadata (captions, sort order, EXIF data, blurhash).
3. If R2 objects are gone, the photos are gone. Check local backups. Check if the photographer has originals on their camera/computer.

**Verdict:** Implement soft-delete before going to production.

### Scenario 2: "The site is broken after a change"

1. **Immediate fix:** Roll back on Vercel.
   - Go to https://vercel.com/dashboard
   - Click the project
   - Go to Deployments
   - Find the last working deployment
   - Click the three-dot menu and select "Promote to Production"
   - Site is restored in seconds.

2. **If the code change was pushed to git:**
   ```bash
   git log --oneline -5           # Find the last good commit
   git revert HEAD                # Revert the bad commit
   git push                       # Vercel auto-deploys the revert
   ```

3. **If the database schema was changed:**
   - Roll back the schema change using the pre-migration backup:
     ```bash
     # Restore from backup
     turso db shell poor-mans-flicker < backups/db-YYYYMMDD-HHMMSS.sql
     ```
   - Or manually revert the schema change with a new migration.

### Scenario 3: "Photos are missing from R2"

This should not happen with soft-delete (R2 objects are preserved until trash cleanup). But if it does:

1. **Check if objects actually exist:**
   ```bash
   aws s3 ls s3://$R2_BUCKET/albums/ --endpoint-url $R2_ENDPOINT --recursive | head -20
   ```

2. **If objects exist but site is not showing them:**
   - Check if the `R2_PUBLIC_URL` is correct and accessible.
   - Check if the database records are intact (photo rows might be deleted but R2 objects remain).
   - Re-import from R2 if needed (would require a recovery script).

3. **If objects are truly gone from R2:**
   - Cloudflare R2 does not have versioning or recycle bin (unlike S3).
   - Objects deleted from R2 are gone permanently.
   - Recovery depends on: Chris having originals on his computer/camera, or a local backup.

4. **Prevention:** The soft-delete system is the primary defense. R2 objects are only deleted by the cron cleanup after the retention period.

### Scenario 4: "The database is corrupted"

1. **Restore from most recent backup:**
   ```bash
   # List available backups
   ls -la backups/db-*.sql

   # Restore (this overwrites the current database)
   turso db shell poor-mans-flicker < backups/db-YYYYMMDD-HHMMSS.sql
   ```

2. **If no local backup exists, check R2:**
   ```bash
   aws s3 ls s3://$R2_BUCKET/backups/db/ --endpoint-url $R2_ENDPOINT
   aws s3 cp s3://$R2_BUCKET/backups/db/db-latest.sql ./restore.sql --endpoint-url $R2_ENDPOINT
   turso db shell poor-mans-flicker < restore.sql
   ```

3. **If no backup exists at all:**
   - The R2 objects (images) still exist. The database metadata (albums, captions, sort orders) is lost.
   - Write a recovery script that:
     a. Lists all objects in R2 under `albums/`
     b. Groups by album ID
     c. Re-creates album and photo records with default metadata
     d. Regenerates blurhash from the stored images
   - This recovers the images but loses all captions, sort orders, and album titles.

4. **Nuclear option -- recreate from scratch:**
   ```bash
   npx drizzle-kit push          # Recreate schema
   # Then re-upload all photos manually
   ```

---

## 4. Automated Safety Rails

### 4.1 Confirmation Prompts for Destructive Operations

Already partially implemented (bulk delete has a confirmation dialog). Extend to:

| Operation | Current Safety | Required Safety |
|-----------|---------------|-----------------|
| Delete single photo | None | Confirmation dialog |
| Bulk delete photos | Confirmation dialog | Keep, add count display |
| Delete album | None | **Two-step confirmation**: "This will move {N} photos to trash. Type the album name to confirm." |
| Empty trash | N/A (not built) | Confirmation dialog with count of items being permanently deleted |
| Change album from public to private | None | Warning: "This album will no longer be visible on your site" |

### 4.2 Deletion Limits

Already implemented:
- Max 50 photos per bulk delete (`MAX_BULK_DELETE`)

Add:
- **Rate limiting on deletes:** No more than 100 photo deletes per hour (prevents runaway scripts or confused Claude sessions).
- **Album delete cooldown:** After deleting an album, require a 5-second wait before another album can be deleted (prevents rapid-fire cascade).

### 4.3 Pre-Operation Backups

For high-risk operations, automatically snapshot the database:

```typescript
// src/lib/safety/backup.ts
export async function preOperationBackup(operation: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const key = `backups/db/pre-${operation}-${timestamp}.sql`;
  // Execute turso db dump and upload to R2
  // Return the backup key for reference
  return key;
}
```

Trigger automatically before:
- Album deletion
- Bulk photo deletion (>10 photos)
- Schema migrations

### 4.4 CLAUDE.md Safety Instructions

Add this section to the project's `CLAUDE.md` so every Claude Code session follows safety protocols:

```markdown
## Safety Protocols -- MANDATORY

### Before Any Delete Operation
1. ALWAYS confirm with Chris what specifically should be deleted.
2. List what will be affected: "This will delete the album 'Landscapes' and its 47 photos."
3. Wait for explicit confirmation before proceeding.
4. If Chris says "delete everything" or something vague, ask for clarification. Never bulk-delete without specifics.

### Before Any Schema Change
1. Run `scripts/backup-db.sh` first.
2. Verify the backup file was created.
3. Then run `npx drizzle-kit push`.

### After Any Delete Operation
1. Inform Chris: "I moved the album to trash. You can restore it within 30 days from /admin/trash."
2. Do NOT empty the trash unless Chris explicitly asks to permanently delete items.

### Things You Must Never Do
- Never run `db.delete(albums)` without a WHERE clause (this deletes ALL albums).
- Never run `storage.deleteMany()` on a broad prefix like `albums/` (this deletes ALL images).
- Never bypass the soft-delete system by directly deleting DB records.
- Never empty the trash without explicit confirmation.
- Never run `drizzle-kit push` without backing up first.
```

### 4.5 Audit Log (Future Enhancement)

For full traceability, add an `audit_log` table:

```sql
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,          -- 'delete_photo', 'delete_album', 'restore', 'empty_trash', etc.
  target_type TEXT NOT NULL,     -- 'photo', 'album', 'config'
  target_id TEXT NOT NULL,
  details TEXT,                  -- JSON with context (album title, photo count, etc.)
  performed_by TEXT DEFAULT 'admin',
  created_at INTEGER NOT NULL
);
```

This lets Scott or Chris review what happened and when, which is critical for diagnosing "what went wrong" scenarios.

---

## 5. Implementation Priority

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| **P0** | Soft-delete for photos and albums | 1-2 days | Prevents permanent data loss from accidental deletes |
| **P0** | CLAUDE.md safety instructions | 30 minutes | Immediate protection via Claude Code behavior |
| **P0** | Album delete confirmation (two-step) | 2 hours | Prevents accidental album cascade deletes |
| **P1** | Trash management page (`/admin/trash`) | 1 day | Self-service recovery for Chris |
| **P1** | Database backup script + R2 upload | 2 hours | Recovery from DB corruption |
| **P1** | Cron job for trash cleanup | 2 hours | Automatic permanent deletion after retention |
| **P1** | Pre-migration backup automation | 1 hour | Safety net for schema changes |
| **P2** | Delete rate limiting | 2 hours | Prevents runaway mass deletion |
| **P2** | Audit log | 4 hours | Full traceability of destructive operations |
| **P2** | R2 DB backup automation | 2 hours | Off-machine backup survival |

### Recommended Implementation Order

1. Add soft-delete columns to schema (migration).
2. Update all delete endpoints to soft-delete.
3. Update all query functions to filter `deleted_at IS NULL`.
4. Add CLAUDE.md safety instructions.
5. Build `/admin/trash` page with restore and permanent delete.
6. Add cron job for automatic trash cleanup.
7. Create and test `scripts/backup-db.sh`.
8. Add two-step album delete confirmation in UI.
9. Everything else as time permits.

---

## 6. What This Does NOT Cover

- **R2 bucket-level backup/replication** -- Cloudflare does not currently offer cross-region R2 replication on free tier. If the R2 bucket itself is lost (Cloudflare outage, account compromise), images are gone. For truly irreplaceable photos, Chris should keep originals on a local drive or cloud storage (Google Photos, iCloud, etc.) as a separate backup. The site is a portfolio, not the archive of record.
- **Multi-user access control** -- Currently single admin token. If multiple people manage the site, audit logging becomes more important.
- **Encrypted backups** -- DB dumps contain photo metadata but no sensitive data beyond the site config. If the admin token is in the DB (it is not -- it is an env var), this would matter more.

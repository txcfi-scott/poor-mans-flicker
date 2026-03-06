import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { playlists } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateSlug } from '@/lib/utils/slug';
import { apiSuccess, apiError } from '@/lib/api/response';
import { requireAuth } from '@/lib/api/auth';
import { getPlaylists, createPlaylist } from '@/lib/db/queries/playlists';

export async function GET(request: NextRequest) {
  const includePrivate = request.nextUrl.searchParams.get('includePrivate') === 'true';

  if (includePrivate) {
    const authError = await requireAuth();
    if (authError) return authError;
  }

  const result = await getPlaylists(includePrivate);
  return apiSuccess({ playlists: result });
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const body = await request.json();
  const { title, description, isPublic = true } = body;

  if (!title || typeof title !== 'string' || title.trim().length === 0 || title.length > 200) {
    return apiError('Title is required and must be under 200 characters', 'INVALID_TITLE', 400);
  }

  // Generate unique slug
  let slug = generateSlug(title);
  let attempt = 0;
  while (attempt < 10) {
    const existing = await db.select({ id: playlists.id }).from(playlists).where(eq(playlists.slug, slug));
    if (existing.length === 0) break;
    attempt++;
    slug = `${generateSlug(title)}-${attempt}`;
  }
  if (attempt >= 10) {
    return apiError('Could not generate unique slug', 'SLUG_GENERATION_FAILED', 409);
  }

  const created = await createPlaylist({
    title: title.trim(),
    slug,
    description: description?.trim() || null,
    isPublic,
  });

  return apiSuccess({ playlist: created }, 201);
}

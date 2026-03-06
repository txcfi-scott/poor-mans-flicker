import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { albums } from '@/lib/db/schema';
import { eq, max } from 'drizzle-orm';
import { generateId } from '@/lib/utils/id';
import { generateSlug } from '@/lib/utils/slug';
import { apiSuccess, apiError } from '@/lib/api/response';
import { requireAuth } from '@/lib/api/auth';
import { getAlbums } from '@/lib/db/queries/albums';

export async function GET(request: NextRequest) {
  const includePrivate = request.nextUrl.searchParams.get('includePrivate') === 'true';
  const result = await getAlbums(includePrivate);
  return apiSuccess({ albums: result });
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const body = await request.json();
  const { title, description, isPublic = true, isHero = false } = body;

  if (!title || typeof title !== 'string' || title.trim().length === 0 || title.length > 200) {
    return apiError('Title is required and must be under 200 characters', 'INVALID_TITLE', 400);
  }

  // Generate unique slug
  let slug = generateSlug(title);
  let attempt = 0;
  while (attempt < 10) {
    const existing = await db.select({ id: albums.id }).from(albums).where(eq(albums.slug, slug));
    if (existing.length === 0) break;
    attempt++;
    slug = `${generateSlug(title)}-${attempt}`;
  }
  if (attempt >= 10) {
    return apiError('Could not generate unique slug', 'SLUG_GENERATION_FAILED', 409);
  }

  // Get next sort order
  const maxResult = await db.select({ maxSort: max(albums.sortOrder) }).from(albums);
  const sortOrder = (maxResult[0]?.maxSort ?? -1) + 1;

  // If setting as hero, unset existing hero
  if (isHero) {
    await db.update(albums).set({ isHero: false }).where(eq(albums.isHero, true));
  }

  const id = generateId();
  const now = new Date();

  await db.insert(albums).values({
    id,
    title: title.trim(),
    slug,
    description: description?.trim() || null,
    isPublic,
    isHero,
    sortOrder,
    createdAt: now,
    updatedAt: now,
  });

  const created = await db.select().from(albums).where(eq(albums.id, id));
  return apiSuccess({ album: created[0] }, 201);
}

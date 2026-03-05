import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { photos } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/lib/api/response';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: albumId } = await params;
  const body = await request.json();
  const { order } = body;

  if (!Array.isArray(order)) {
    return apiError('order must be an array of { id, sortOrder }', 'INVALID_INPUT', 400);
  }

  for (const item of order) {
    await db.update(photos).set({ sortOrder: item.sortOrder }).where(eq(photos.id, item.id));
  }

  return apiSuccess({ success: true });
}

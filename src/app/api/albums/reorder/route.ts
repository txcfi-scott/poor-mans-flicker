import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { albums } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/lib/api/response';

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { order } = body;

  if (!Array.isArray(order)) {
    return apiError('order must be an array of { id, sortOrder }', 'INVALID_INPUT', 400);
  }

  for (const item of order) {
    await db.update(albums).set({ sortOrder: item.sortOrder, updatedAt: new Date() }).where(eq(albums.id, item.id));
  }

  return apiSuccess({ success: true });
}

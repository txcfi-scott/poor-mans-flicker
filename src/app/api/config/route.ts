import { NextRequest } from 'next/server';
import { getSiteConfig, updateSiteConfig } from '@/lib/db/queries/config';
import { requireAuth } from '@/lib/api/auth';
import { apiSuccess, apiError } from '@/lib/api/response';

export async function GET() {
  const config = await getSiteConfig();
  if (!config) {
    return apiError('Site config not found', 'NOT_FOUND', 404);
  }
  return apiSuccess(config);
}

export async function PATCH(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const body = await request.json();

  // Validate fields
  const updates: Record<string, unknown> = {};

  if (body.siteTitle !== undefined) {
    if (typeof body.siteTitle !== 'string' || body.siteTitle.trim().length === 0) {
      return apiError('Site title must be a non-empty string', 'INVALID_SITE_TITLE', 400);
    }
    updates.siteTitle = body.siteTitle.trim();
  }

  if (body.siteDescription !== undefined) {
    if (typeof body.siteDescription !== 'string') {
      return apiError('Site description must be a string', 'INVALID_SITE_DESCRIPTION', 400);
    }
    updates.siteDescription = body.siteDescription.trim();
  }

  if (body.heroIntervalMs !== undefined) {
    const val = Number(body.heroIntervalMs);
    if (!Number.isInteger(val) || val < 1000 || val > 30000) {
      return apiError('Hero interval must be an integer between 1000 and 30000', 'INVALID_HERO_INTERVAL', 400);
    }
    updates.heroIntervalMs = val;
  }

  if (body.slideshowDefaultIntervalMs !== undefined) {
    const val = Number(body.slideshowDefaultIntervalMs);
    if (!Number.isInteger(val) || val < 1000 || val > 30000) {
      return apiError('Slideshow interval must be an integer between 1000 and 30000', 'INVALID_SLIDESHOW_INTERVAL', 400);
    }
    updates.slideshowDefaultIntervalMs = val;
  }

  if (body.trashRetentionDays !== undefined) {
    const val = Number(body.trashRetentionDays);
    if (!Number.isInteger(val) || val < 1 || val > 365) {
      return apiError('Trash retention must be an integer between 1 and 365', 'INVALID_TRASH_RETENTION', 400);
    }
    updates.trashRetentionDays = val;
  }

  if (body.aboutHeading !== undefined) {
    if (typeof body.aboutHeading !== 'string') {
      return apiError('About heading must be a string', 'INVALID_ABOUT_HEADING', 400);
    }
    updates.aboutHeading = body.aboutHeading.trim();
  }

  if (body.aboutText !== undefined) {
    if (typeof body.aboutText !== 'string') {
      return apiError('About text must be a string', 'INVALID_ABOUT_TEXT', 400);
    }
    updates.aboutText = body.aboutText.trim();
  }

  if (Object.keys(updates).length === 0) {
    return apiError('No valid fields to update', 'NO_FIELDS', 400);
  }

  const updated = await updateSiteConfig(updates);
  return apiSuccess(updated);
}

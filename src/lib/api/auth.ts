import { cookies } from 'next/headers';
import { getEnv } from '@/lib/env';
import { apiError } from './response';

/**
 * Check if the request has a valid admin session.
 * Returns null if authenticated, or an error Response if not.
 */
export async function requireAuth(): Promise<Response | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('admin_session')?.value;

  if (!sessionToken || sessionToken !== getEnv().adminToken) {
    return apiError('Unauthorized', 'UNAUTHORIZED', 401);
  }

  return null;
}

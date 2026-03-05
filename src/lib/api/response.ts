import { NextResponse } from 'next/server';

export function apiSuccess(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(error: string, code: string, status = 400, details?: Record<string, unknown>) {
  return NextResponse.json({ error, code, ...(details && { details }) }, { status });
}

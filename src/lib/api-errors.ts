import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError('INVALID_JSON', 'Request body must contain valid JSON.', 400);
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json({
      error: { code: 'VALIDATION_ERROR', message: 'Request validation failed.', issues: error.flatten() },
    }, { status: 400 });
  }

  if (isSupabaseError(error)) {
    const mapped = mapDatabaseError(error.code, error.message);
    if (mapped.status >= 500) console.error('Backend database operation failed:', error.code, error.message);
    return NextResponse.json({ error: { code: mapped.code, message: mapped.message } }, { status: mapped.status });
  }

  if (error instanceof Error && error.message === 'Supabase is not configured.') {
    return NextResponse.json({
      error: { code: 'SERVICE_UNAVAILABLE', message: 'The backend database is not configured.' },
    }, { status: 503 });
  }

  console.error('Unhandled API error:', error);
  return NextResponse.json({
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'Unexpected internal error.' },
  }, { status: 500 });
}

function isSupabaseError(error: unknown): error is { code: string; message?: string } {
  return typeof error === 'object' && error !== null && 'code' in error && typeof (error as { code: unknown }).code === 'string';
}

function mapDatabaseError(code: string, originalMessage?: string) {
  if (code === 'PGRST116' || code === 'P0002') return { code: 'NOT_FOUND', message: originalMessage || 'The requested record was not found.', status: 404 };
  if (code === '42501' || code === '28000') return { code: 'FORBIDDEN', message: originalMessage || 'You do not have permission to perform this action.', status: 403 };
  if (code === '23505') return { code: 'CONFLICT', message: originalMessage || 'A matching record already exists.', status: 409 };
  if (code === '23514' || code === '22023') return { code: 'INVALID_OPERATION', message: originalMessage || 'The requested operation is not valid for this record.', status: 400 };
  if (code === 'PGRST301' || code === 'PGRST302') return { code: 'UNAUTHENTICATED', message: 'A valid sign-in session is required.', status: 401 };
  return { code: 'DATABASE_ERROR', message: originalMessage || 'The database operation could not be completed.', status: 500 };
}

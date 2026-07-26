import { NextResponse } from 'next/server';

export type ApiErrorCode =
  | 'INVALID_INPUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'RATE_LIMITED'
  | 'CONFLICT'
  | 'INTERNAL';

export class AppError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ApiErrorCode, message: string, status = 400, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export type ApiEnvelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ApiErrorCode; message: string; details?: unknown } };

export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiEnvelope<T>> {
  return NextResponse.json({ ok: true, data }, init);
}

export function created<T>(data: T): NextResponse<ApiEnvelope<T>> {
  return NextResponse.json({ ok: true, data }, { status: 201 });
}

export function fail(
  code: ApiErrorCode,
  message: string,
  status = 400,
  details?: unknown,
): NextResponse<ApiEnvelope<never>> {
  return NextResponse.json({ ok: false, error: { code, message, details } }, { status });
}

export function fromError(err: unknown): NextResponse<ApiEnvelope<never>> {
  if (err instanceof AppError) {
    return fail(err.code, err.message, err.status, err.details);
  }
  const isZodError =
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err as { name: string }).name === 'ZodError';
  if (isZodError) {
    const ze = err as unknown as { issues: Array<{ message: string }> };
    return fail('INVALID_INPUT', ze.issues[0]?.message ?? 'Validation error', 400, err);
  }
  console.error('[api] unhandled error:', err);
  return fail('INTERNAL', 'Internal server error', 500);
}

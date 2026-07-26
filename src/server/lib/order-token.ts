import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { AppError } from '@/server/lib/http';

export function createBillAccessToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('hex');
  return { token, hash: hashBillAccessToken(token) };
}

function hashBillAccessToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function requireBillAccessToken(request: Request, expectedHash: string | null): void {
  const token = request.headers.get('X-Bill-Token')?.trim();
  if (!token || !expectedHash) throw new AppError('UNAUTHORIZED', 'A valid bill token is required', 401);
  const actual = Buffer.from(hashBillAccessToken(token), 'utf8');
  const expected = Buffer.from(expectedHash, 'utf8');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new AppError('UNAUTHORIZED', 'A valid bill token is required', 401);
  }
}

import { ok } from '@/server/lib/http';

export async function GET() {
  return ok({ status: 'ok', app: 'BayadinBills', timestamp: new Date().toISOString() });
}

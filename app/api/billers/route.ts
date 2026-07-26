import { NextRequest } from 'next/server';
import { fromError, ok } from '@/server/lib/http';
import { getBillersByType, listBillers } from '@/server/service/bills.service';

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get('type') as
      | 'electricity'
      | 'water'
      | 'internet'
      | 'gas'
      | null;
    if (type) {
      const data = await getBillersByType(type);
      return ok(data);
    }
    const data = await listBillers();
    return ok(data);
  } catch (err) {
    return fromError(err);
  }
}

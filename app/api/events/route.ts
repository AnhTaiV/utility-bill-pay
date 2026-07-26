import { fromError, ok } from '@/server/lib/http';
import { listHorizonEvents } from '@/server/service/bills.service';

export async function GET() {
  try {
    const events = await listHorizonEvents(20);
    return ok(events);
  } catch (err) {
    return fromError(err);
  }
}

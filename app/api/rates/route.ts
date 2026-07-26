import { fromError, ok } from '@/server/lib/http';
import { getLatestRate } from '@/server/service/bills.service';

export async function GET() {
  try {
    const rate = await getLatestRate('USDC:PHP');
    if (!rate) {
      return ok({
        pair: 'USDC:PHP',
        rate: '162.50',
        validUntil: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        source: 'default',
      });
    }
    return ok({
      pair: rate.pair,
      rate: rate.rate,
      validUntil: rate.validUntil.toISOString(),
      source: 'sep38',
    });
  } catch (err) {
    return fromError(err);
  }
}

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { fromError, ok } from '@/server/lib/http';
import { getBill, confirmBillPayment, toPublicBill } from '@/server/service/bills.service';
import { requireBillAccessToken } from '@/server/lib/order-token';

const confirmSchema = z.object({ signedXdr: z.string().min(1) });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const bill = await getBill(Number(id));
    requireBillAccessToken(req, bill.accessTokenHash);
    const body = confirmSchema.parse(await req.json());
    const result = await confirmBillPayment(Number(id), body.signedXdr);
    return ok({ bill: toPublicBill(result.bill), ledger: result.ledger, idempotent: result.idempotent ?? false });
  } catch (err) {
    return fromError(err);
  }
}

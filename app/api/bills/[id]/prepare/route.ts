import { NextRequest } from 'next/server';
import { z } from 'zod';
import { AppError, fromError, ok } from '@/server/lib/http';
import { getBill, prepareBillPayment, toPublicBill } from '@/server/service/bills.service';
import { requireBillAccessToken } from '@/server/lib/order-token';

const prepareSchema = z.object({ senderAddress: z.string().length(56) });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const bill = await getBill(Number(id));
    requireBillAccessToken(req, bill.accessTokenHash);
    const body = prepareSchema.parse(await req.json());
    const idempotencyKey = req.headers.get('Idempotency-Key')?.trim();
    if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 128) {
      throw new AppError('INVALID_INPUT', 'Idempotency-Key must be between 8 and 128 characters', 400);
    }
    const result = await prepareBillPayment(Number(id), body.senderAddress, idempotencyKey);
    return ok({
      bill: toPublicBill(result.bill),
      unsignedXdr: result.unsignedXdr,
      unsignedTxDigest: result.unsignedTxDigest,
      idempotent: result.idempotent ?? false,
    });
  } catch (err) {
    return fromError(err);
  }
}

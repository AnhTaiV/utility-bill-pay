import { NextRequest } from 'next/server';
import { z } from 'zod';
import { AppError, fromError, ok } from '@/server/lib/http';
import { getBill, toPublicBill, updateBillStatus } from '@/server/service/bills.service';

const updateSchema = z.object({
  status: z.enum(['pending', 'paid', 'settled', 'failed']),
  txHash: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const bill = await getBill(Number(id));
    return ok(toPublicBill(bill));
  } catch (err) {
    return fromError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = updateSchema.parse(await req.json());
    if (body.status === 'paid' || body.status === 'settled') {
      throw new AppError('CONFLICT', 'Paid/settled status requires verified Stellar confirmation or provider proof', 409);
    }
    const bill = await updateBillStatus(Number(id), body.status, body.txHash);
    return ok(toPublicBill(bill));
  } catch (err) {
    return fromError(err);
  }
}

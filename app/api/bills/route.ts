import { NextRequest } from 'next/server';
import { z } from 'zod';
import { created, fromError, ok } from '@/server/lib/http';
import { createBill, listBills, toPublicBill } from '@/server/service/bills.service';
import { createBillAccessToken } from '@/server/lib/order-token';

const createBillSchema = z.object({
  billerName: z.string().min(1),
  billerType: z.enum(['electricity', 'water', 'internet', 'gas']),
  accountNumber: z.string().min(1),
  amountPhp: z.number().int().positive(),
  userName: z.string().optional(),
  rate: z.number().positive().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const userName = req.nextUrl.searchParams.get('user') ?? undefined;
    const data = await listBills(userName);
    return ok(data.map(toPublicBill));
  } catch (err) {
    return fromError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = createBillSchema.parse(await req.json());
    const accessToken = createBillAccessToken();
    const bill = await createBill({ ...body, accessTokenHash: accessToken.hash });
    return created({ ...toPublicBill(bill), orderAccessToken: accessToken.token });
  } catch (err) {
    return fromError(err);
  }
}

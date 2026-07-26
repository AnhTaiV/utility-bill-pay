import { desc, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { bills, billers, sep38Rates, horizonEvents } from '@/server/db/schema';
import { AppError } from '@/server/lib/http';
import { generateMemoRef, phpToUsdc, phpToUsdcStroops, canTransition } from '@/server/lib/billing';
import type { BillStatus } from '@/server/lib/billing';
import { env } from '@/server/config/env';
import { buildUnsignedBillPayment, submitSignedBillPayment, validateStellarAddress } from '@/server/lib/stellar-payment';
import { createDemoBill, getDemoBill, getDemoEvents, getDemoRate, getDemoStore, updateDemoBillStatus } from '@/server/demo/store';

export type BillRow = typeof bills.$inferSelect;
export type BillerRow = typeof billers.$inferSelect;
export type Sep38RateRow = typeof sep38Rates.$inferSelect;
export type HorizonEventRow = typeof horizonEvents.$inferSelect;

/** Public projection: never expose bearer tokens or unsigned transaction payloads in list/detail APIs. */
export function toPublicBill(bill: BillRow) {
  const { accessTokenHash: _accessTokenHash, unsignedXdr: _unsignedXdr, ...publicBill } = bill;
  return publicBill;
}

// --- Bills ---

export async function listBills(userName?: string): Promise<BillRow[]> {
  if (env.DEMO_MODE) {
    const rows = getDemoStore().bills;
    return userName ? rows.filter((bill) => bill.userName === userName) : [...rows];
  }
  if (userName) {
    return db.select().from(bills).where(eq(bills.userName, userName)).orderBy(desc(bills.createdAt));
  }
  return db.select().from(bills).orderBy(desc(bills.createdAt));
}

export async function getBill(id: number): Promise<BillRow> {
  if (env.DEMO_MODE) {
    const bill = getDemoBill(id);
    if (!bill) throw new AppError('NOT_FOUND', `Bill ${id} not found`, 404);
    return bill;
  }
  const rows = await db.select().from(bills).where(eq(bills.id, id));
  if (!rows[0]) throw new AppError('NOT_FOUND', `Bill ${id} not found`, 404);
  return rows[0];
}

export interface CreateBillInput {
  userName?: string;
  billerName: string;
  billerType: 'electricity' | 'water' | 'internet' | 'gas';
  accountNumber: string;
  amountPhp: number;
  rate?: number;
  accessTokenHash?: string;
}

export async function createBill(input: CreateBillInput): Promise<BillRow> {
  if (env.DEMO_MODE) return createDemoBill(input);
  const rate = input.rate ?? 162.5;
  const amountUsdc = phpToUsdc(input.amountPhp, rate);
  const memoRef = generateMemoRef(input.billerName, input.accountNumber, input.amountPhp);

  const [row] = await db
    .insert(bills)
    .values({
      userName: input.userName ?? 'Nida Reyes',
      billerName: input.billerName,
      billerType: input.billerType,
      accountNumber: input.accountNumber,
      amountPhp: input.amountPhp,
      amountUsdc,
      memoRef,
      status: 'pending',
      sep38Rate: rate.toString(),
      recipientAddress: env.STELLAR_PLATFORM_ADDRESS,
      accessTokenHash: input.accessTokenHash,
    })
    .returning();
  if (!row) throw new AppError('INTERNAL', 'Failed to create bill', 500);
  return row;
}

export async function prepareBillPayment(
  id: number,
  senderAddress: string,
  idempotencyKey: string,
): Promise<{ bill: BillRow; unsignedXdr: string; unsignedTxDigest: string; idempotent?: boolean }> {
  validateStellarAddress(senderAddress);
  return db.transaction(async (transaction) => {
    const [bill] = await transaction.select().from(bills).where(eq(bills.id, id)).for('update');
    if (!bill) throw new AppError('NOT_FOUND', `Bill ${id} not found`, 404);
    if (bill.status !== 'pending') throw new AppError('CONFLICT', 'Bill is no longer pending', 409);
    if (bill.idempotencyKey && bill.idempotencyKey !== idempotencyKey) {
      throw new AppError('CONFLICT', 'Bill already has a different payment intent', 409);
    }
    if (bill.senderAddress && bill.senderAddress !== senderAddress) {
      throw new AppError('CONFLICT', 'Bill is bound to a different payer address', 409);
    }
    if (bill.unsignedXdr && bill.unsignedTxDigest) {
      return { bill, unsignedXdr: bill.unsignedXdr, unsignedTxDigest: bill.unsignedTxDigest, idempotent: true };
    }
    if (!bill.recipientAddress) throw new AppError('CONFLICT', 'Bill has no settlement recipient', 409);
    const prepared = await buildUnsignedBillPayment({
      senderAddress,
      recipientAddress: bill.recipientAddress,
      amountMinor: phpToUsdcStroops(bill.amountPhp, Number(bill.sep38Rate ?? 162.5)).toString(),
      memo: bill.memoRef,
    });
    const [updated] = await transaction.update(bills).set({
      senderAddress,
      idempotencyKey,
      unsignedXdr: prepared.unsignedXdr,
      unsignedTxDigest: prepared.unsignedTxDigest,
    }).where(eq(bills.id, id)).returning();
    if (!updated) throw new AppError('INTERNAL', 'Failed to store bill payment intent', 500);
    return { bill: updated, unsignedXdr: prepared.unsignedXdr, unsignedTxDigest: prepared.unsignedTxDigest };
  });
}

export async function confirmBillPayment(id: number, signedXdr: string): Promise<{ bill: BillRow; ledger: number; idempotent?: boolean }> {
  return db.transaction(async (transaction) => {
    const [bill] = await transaction.select().from(bills).where(eq(bills.id, id)).for('update');
    if (!bill) throw new AppError('NOT_FOUND', `Bill ${id} not found`, 404);
    if (bill.status === 'paid' && bill.txHash) return { bill, ledger: 0, idempotent: true };
    if (bill.status !== 'pending') throw new AppError('CONFLICT', 'Bill cannot be confirmed in its current status', 409);
    if (!bill.senderAddress || !bill.recipientAddress || !bill.unsignedTxDigest) {
      throw new AppError('CONFLICT', 'Prepare the bill before confirmation', 409);
    }
    const expectedMinor = phpToUsdcStroops(bill.amountPhp, Number(bill.sep38Rate ?? 162.5)).toString();
    const result = await submitSignedBillPayment({
      signedXdr,
      senderAddress: bill.senderAddress,
      recipientAddress: bill.recipientAddress,
      amountMinor: expectedMinor,
      memo: bill.memoRef,
    });
    const [updated] = await transaction.update(bills).set({
      status: 'paid',
      txHash: result.txHash,
      paidAt: new Date(),
    }).where(eq(bills.id, id)).returning();
    if (!updated) throw new AppError('INTERNAL', 'Failed to record bill settlement', 500);
    return { bill: updated, ledger: result.ledger };
  });
}

export async function updateBillStatus(
  id: number,
  newStatus: BillStatus,
  txHash?: string,
): Promise<BillRow> {
  const bill = await getBill(id);
  if (!canTransition(bill.status as BillStatus, newStatus)) {
    throw new AppError(
      'CONFLICT',
      `Cannot transition from ${bill.status} to ${newStatus}`,
      409,
    );
  }

  const now = new Date();
  if (env.DEMO_MODE) {
    const updated = updateDemoBillStatus(id, newStatus, txHash);
    if (!updated) throw new AppError('NOT_FOUND', `Bill ${id} not found`, 404);
    return updated;
  }
  const updates: Partial<BillRow> = { status: newStatus };
  if (txHash) updates.txHash = txHash;
  if (newStatus === 'paid') updates.paidAt = now;
  if (newStatus === 'settled') updates.settledAt = now;

  const [updated] = await db
    .update(bills)
    .set(updates)
    .where(eq(bills.id, id))
    .returning();
  if (!updated) throw new AppError('INTERNAL', 'Failed to update bill', 500);
  return updated;
}

// --- Billers ---

export async function listBillers(): Promise<BillerRow[]> {
  if (env.DEMO_MODE) return [...getDemoStore().billers].sort((a, b) => a.name.localeCompare(b.name));
  return db.select().from(billers).orderBy(billers.name);
}

export async function getBillersByType(
  type: 'electricity' | 'water' | 'internet' | 'gas',
): Promise<BillerRow[]> {
  if (env.DEMO_MODE) return getDemoStore().billers.filter((biller) => biller.billerType === type);
  return db.select().from(billers).where(eq(billers.billerType, type));
}

// --- SEP-38 Rates ---

export async function getLatestRate(pair: string = 'USDC:PHP'): Promise<Sep38RateRow | null> {
  if (env.DEMO_MODE) return getDemoRate(pair);
  const rows = await db
    .select()
    .from(sep38Rates)
    .where(eq(sep38Rates.pair, pair))
    .orderBy(desc(sep38Rates.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertRate(pair: string, rate: number): Promise<Sep38RateRow> {
  const validUntil = new Date(Date.now() + 5 * 60 * 1000); // valid for 5 min
  const [row] = await db
    .insert(sep38Rates)
    .values({ pair, rate: rate.toString(), validUntil })
    .returning();
  if (!row) throw new AppError('INTERNAL', 'Failed to upsert rate', 500);
  return row;
}

// --- Horizon Events ---

export async function recordHorizonEvent(params: {
  eventType: string;
  txHash: string;
  amount: string;
  memo?: string;
  fromAddress?: string;
  toAddress?: string;
}): Promise<HorizonEventRow> {
  const [row] = await db.insert(horizonEvents).values(params).returning();
  if (!row) throw new AppError('INTERNAL', 'Failed to record event', 500);
  return row;
}

export async function listHorizonEvents(limit = 20): Promise<HorizonEventRow[]> {
  if (env.DEMO_MODE) return getDemoEvents(limit);
  return db.select().from(horizonEvents).orderBy(desc(horizonEvents.createdAt)).limit(limit);
}

import { env } from '@/server/config/env';
import { bills, billers, horizonEvents, sep38Rates } from '@/server/db/schema';
import { generateMemoRef, phpToUsdc } from '@/server/lib/billing';

export type DemoBill = typeof bills.$inferSelect;
export type DemoBiller = typeof billers.$inferSelect;
export type DemoRate = typeof sep38Rates.$inferSelect;
export type DemoEvent = typeof horizonEvents.$inferSelect;
type DemoStore = { bills: DemoBill[]; billers: DemoBiller[]; rates: DemoRate[]; events: DemoEvent[] };
const globalForDemo = globalThis as unknown as { bayadinBillsDemo?: DemoStore };
const seededHash = (seed: string) => seed.repeat(Math.ceil(64 / seed.length)).slice(0, 64);

function seedBill(input: {
  id: number; billerName: string; billerType: DemoBill['billerType']; accountNumber: string;
  amountPhp: number; status: DemoBill['status']; daysAgo: number; txHash?: string;
  paidAt?: Date | null; settledAt?: Date | null;
}): DemoBill {
  const createdAt = new Date(Date.now() - input.daysAgo * 86_400_000);
  return {
    id: input.id, userName: 'Nida Reyes', billerName: input.billerName, billerType: input.billerType,
    accountNumber: input.accountNumber, amountPhp: input.amountPhp, amountUsdc: phpToUsdc(input.amountPhp),
    memoRef: generateMemoRef(input.billerName, input.accountNumber, input.amountPhp), status: input.status,
    txHash: input.txHash ?? null, senderAddress: null, recipientAddress: env.STELLAR_PLATFORM_ADDRESS,
    idempotencyKey: null, unsignedXdr: null, unsignedTxDigest: null, accessTokenHash: null,
    sep38Rate: '162.50', createdAt, paidAt: input.paidAt ?? null, settledAt: input.settledAt ?? null,
  };
}

function createInitialStore(): DemoStore {
  const paid = new Date(Date.now() - 13 * 86_400_000);
  const settled = new Date(Date.now() - 12 * 86_400_000);
  const seedBills = [
    seedBill({ id: 1, billerName: 'MERALCO', billerType: 'electricity', accountNumber: '123456789', amountPhp: 2600, status: 'settled', daysAgo: 14, txHash: seededHash('a1b2c3d4'), paidAt: paid, settledAt: settled }),
    seedBill({ id: 2, billerName: 'Manila Water', billerType: 'water', accountNumber: '987654321', amountPhp: 480, status: 'settled', daysAgo: 13, txHash: seededHash('f1e2d3c4'), paidAt: paid, settledAt: settled }),
    seedBill({ id: 3, billerName: 'PLDT Fiber', billerType: 'internet', accountNumber: '111222333', amountPhp: 1299, status: 'paid', daysAgo: 4, txHash: seededHash('c3d4e5f6'), paidAt: new Date(Date.now() - 3 * 86_400_000) }),
    seedBill({ id: 4, billerName: 'Davao Light', billerType: 'electricity', accountNumber: '444555666', amountPhp: 1800, status: 'pending', daysAgo: 1 }),
  ];
  const names: Array<[string, DemoBiller['billerType'], string]> = [
    ['MERALCO', 'electricity', '#ca8a04'], ['Davao Light', 'electricity', '#d97706'], ['Cebu Electric', 'electricity', '#b45309'],
    ['Manila Water', 'water', '#0284c7'], ['Maynilad', 'water', '#0369a1'], ['Davao City Water', 'water', '#0ea5e9'],
    ['PLDT Fiber', 'internet', '#7c3aed'], ['Globe Broadband', 'internet', '#6d28d9'], ['Converge ICT', 'internet', '#5b21b6'],
    ['Petron LPG', 'gas', '#dc2626'], ['Shell Gas', 'gas', '#b91c1c'],
  ];
  const seedBillers = names.map(([name, billerType, logoColor], index) => ({
    id: index + 1, name, billerType, logoColor, minAmountPhp: billerType === 'gas' ? 200 : 50,
    maxAmountPhp: billerType === 'electricity' ? 50_000 : 5_000, createdAt: new Date(Date.now() - 30 * 86_400_000),
  }));
  const rate: DemoRate = { id: 1, pair: 'USDC:PHP', rate: '162.50', validUntil: new Date(Date.now() + 60 * 60 * 1000), createdAt: new Date() };
  const events = seedBills.filter((bill) => bill.txHash).map((bill, index) => ({
    id: index + 1, eventType: 'payment', txHash: bill.txHash as string, amount: bill.amountUsdc, memo: bill.memoRef,
    fromAddress: null, toAddress: env.STELLAR_PLATFORM_ADDRESS, createdAt: bill.paidAt ?? bill.createdAt,
  }));
  return { bills: seedBills, billers: seedBillers, rates: [rate], events };
}

export function getDemoStore() {
  if (!globalForDemo.bayadinBillsDemo) globalForDemo.bayadinBillsDemo = createInitialStore();
  return globalForDemo.bayadinBillsDemo;
}

export function createDemoBill(input: {
  userName?: string; billerName: string; billerType: DemoBill['billerType']; accountNumber: string;
  amountPhp: number; rate?: number; accessTokenHash?: string;
}) {
  const store = getDemoStore();
  const bill: DemoBill = {
    id: Math.max(0, ...store.bills.map((item) => item.id)) + 1, userName: input.userName ?? 'Nida Reyes',
    billerName: input.billerName, billerType: input.billerType, accountNumber: input.accountNumber,
    amountPhp: input.amountPhp, amountUsdc: phpToUsdc(input.amountPhp, input.rate ?? 162.5),
    memoRef: generateMemoRef(input.billerName, input.accountNumber, input.amountPhp), status: 'pending',
    txHash: null, senderAddress: null, recipientAddress: env.STELLAR_PLATFORM_ADDRESS, idempotencyKey: null,
    unsignedXdr: null, unsignedTxDigest: null, accessTokenHash: input.accessTokenHash ?? null,
    sep38Rate: String(input.rate ?? 162.5), createdAt: new Date(), paidAt: null, settledAt: null,
  };
  store.bills.unshift(bill);
  return bill;
}

export function getDemoBill(id: number) { return getDemoStore().bills.find((bill) => bill.id === id); }

export function updateDemoBillStatus(id: number, status: DemoBill['status'], txHash?: string) {
  const bill = getDemoBill(id);
  if (!bill) return undefined;
  bill.status = status;
  if (txHash) bill.txHash = txHash;
  if (status === 'paid') bill.paidAt = new Date();
  if (status === 'settled') bill.settledAt = new Date();
  return bill;
}

export function getDemoRate(pair: string) { return getDemoStore().rates.find((rate) => rate.pair === pair) ?? null; }
export function getDemoEvents(limit: number) {
  return [...getDemoStore().events].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
}

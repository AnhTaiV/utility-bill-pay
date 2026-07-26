import { index, integer, pgEnum, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const billerTypeEnum = pgEnum('biller_type', [
  'electricity',
  'water',
  'internet',
  'gas',
]);

export const billStatusEnum = pgEnum('bill_status', [
  'pending',
  'paid',
  'settled',
  'failed',
]);

export const bills = pgTable('bills', {
  id: serial('id').primaryKey(),
  userName: text('user_name').notNull().default('Nida Reyes'),
  billerName: text('biller_name').notNull(),
  billerType: billerTypeEnum('biller_type').notNull(),
  accountNumber: text('account_number').notNull(),
  amountPhp: integer('amount_php').notNull(),
  amountUsdc: text('amount_usdc').notNull(), // text to preserve precision
  memoRef: text('memo_ref').notNull(),
  status: billStatusEnum('status').notNull().default('pending'),
  txHash: text('tx_hash'),
  senderAddress: text('sender_address'),
  recipientAddress: text('recipient_address'),
  idempotencyKey: text('idempotency_key'),
  unsignedXdr: text('unsigned_xdr'),
  unsignedTxDigest: text('unsigned_tx_digest'),
  accessTokenHash: text('access_token_hash'),
  sep38Rate: text('sep38_rate'), // rate used at time of payment
  createdAt: timestamp('created_at').notNull().defaultNow(),
  paidAt: timestamp('paid_at'),
  settledAt: timestamp('settled_at'),
}, (t) => ({
  statusIdx: index('bills_status_idx').on(t.status),
  idempotencyIdx: uniqueIndex('bills_idempotency_key_idx').on(t.idempotencyKey),
}));

export const billers = pgTable('billers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  billerType: billerTypeEnum('biller_type').notNull(),
  logoColor: text('logo_color').notNull().default('#ca8a04'),
  minAmountPhp: integer('min_amount_php').notNull().default(50),
  maxAmountPhp: integer('max_amount_php').notNull().default(50000),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const sep38Rates = pgTable('sep38_rates', {
  id: serial('id').primaryKey(),
  pair: text('pair').notNull(), // e.g. "USDC:PHP"
  rate: text('rate').notNull(), // e.g. "162.50"
  validUntil: timestamp('valid_until').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const horizonEvents = pgTable('horizon_events', {
  id: serial('id').primaryKey(),
  eventType: text('event_type').notNull(), // "payment"
  txHash: text('tx_hash').notNull(),
  amount: text('amount').notNull(), // text bigint
  memo: text('memo'),
  fromAddress: text('from_address'),
  toAddress: text('to_address'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

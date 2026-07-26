import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../src/server/db/schema';
import { bills, billers, sep38Rates, horizonEvents } from '../src/server/db/schema';

if (process.env.DEMO_MODE !== 'true' || process.env.STELLAR_NETWORK === 'public') {
  throw new Error(
    'seed-demo requires DEMO_MODE=true and a non-mainnet STELLAR_NETWORK; refusing to seed demo data on mainnet',
  );
}

const DATABASE_URL = process.env.DRIZZLE_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/stellar_agent_b';

async function seed() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log('🌱 Seeding BayadinBills demo data...');

  // Clear existing data
  await db.delete(horizonEvents);
  await db.delete(sep38Rates);
  await db.delete(bills);
  await db.delete(billers);

  // Seed billers
  const seededBillers = await db.insert(billers).values([
    { name: 'MERALCO', billerType: 'electricity', logoColor: '#ca8a04', minAmountPhp: 100, maxAmountPhp: 50000 },
    { name: 'Davao Light', billerType: 'electricity', logoColor: '#d97706', minAmountPhp: 100, maxAmountPhp: 20000 },
    { name: 'Cebu Electric', billerType: 'electricity', logoColor: '#b45309', minAmountPhp: 100, maxAmountPhp: 30000 },
    { name: 'Manila Water', billerType: 'water', logoColor: '#0284c7', minAmountPhp: 50, maxAmountPhp: 5000 },
    { name: 'Maynilad', billerType: 'water', logoColor: '#0369a1', minAmountPhp: 50, maxAmountPhp: 5000 },
    { name: 'Davao City Water', billerType: 'water', logoColor: '#0ea5e9', minAmountPhp: 50, maxAmountPhp: 3000 },
    { name: 'PLDT Fiber', billerType: 'internet', logoColor: '#7c3aed', minAmountPhp: 100, maxAmountPhp: 5000 },
    { name: 'Globe Broadband', billerType: 'internet', logoColor: '#6d28d9', minAmountPhp: 100, maxAmountPhp: 3000 },
    { name: 'Converge ICT', billerType: 'internet', logoColor: '#5b21b6', minAmountPhp: 100, maxAmountPhp: 3000 },
    { name: 'Petron LPG', billerType: 'gas', logoColor: '#dc2626', minAmountPhp: 200, maxAmountPhp: 5000 },
    { name: 'Shell Gas', billerType: 'gas', logoColor: '#b91c1c', minAmountPhp: 200, maxAmountPhp: 5000 },
  ]).returning();

  console.log(`✅ Seeded ${seededBillers.length} billers`);

  // Seed SEP-38 rate
  const validUntil = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  await db.insert(sep38Rates).values({
    pair: 'USDC:PHP',
    rate: '162.50',
    validUntil,
  });

  console.log('✅ Seeded SEP-38 rate: 1 USDC = ₱162.50');

  // Seed Nida Reyes's household bills
  const now = new Date();
  const jan = new Date('2025-01-05T08:00:00Z');
  const jan10 = new Date('2025-01-10T10:30:00Z');
  const jan15 = new Date('2025-01-15T14:00:00Z');
  const jan20 = new Date('2025-01-20T09:00:00Z');

  const seededBills = await db.insert(bills).values([
    {
      // Bill 1: MERALCO — SETTLED
      userName: 'Nida Reyes',
      billerName: 'MERALCO',
      billerType: 'electricity',
      accountNumber: '123456789',
      amountPhp: 2600,
      amountUsdc: '16.0000000',
      memoRef: 'MERALCO-123456789-2600',
      status: 'settled',
      txHash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      sep38Rate: '162.50',
      createdAt: jan,
      paidAt: jan10,
      settledAt: jan15,
    },
    {
      // Bill 2: Manila Water — SETTLED
      userName: 'Nida Reyes',
      billerName: 'Manila Water',
      billerType: 'water',
      accountNumber: '987654321',
      amountPhp: 480,
      amountUsdc: '2.9538462',
      memoRef: 'MANILAWATER-987654321-480',
      status: 'settled',
      txHash: 'f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2',
      sep38Rate: '162.50',
      createdAt: jan,
      paidAt: jan10,
      settledAt: jan15,
    },
    {
      // Bill 3: PLDT Fiber — PAID (awaiting settlement)
      userName: 'Nida Reyes',
      billerName: 'PLDT Fiber',
      billerType: 'internet',
      accountNumber: '111222333',
      amountPhp: 1299,
      amountUsdc: '7.9938462',
      memoRef: 'PLDTFIBER-111222333-1299',
      status: 'paid',
      txHash: 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
      sep38Rate: '162.50',
      createdAt: jan15,
      paidAt: jan20,
      settledAt: null,
    },
    {
      // Bill 4: Davao Light — PENDING
      userName: 'Nida Reyes',
      billerName: 'Davao Light',
      billerType: 'electricity',
      accountNumber: '444555666',
      amountPhp: 1800,
      amountUsdc: '11.0769231',
      memoRef: 'DAVAOLIGHT-444555666-1800',
      status: 'pending',
      txHash: null,
      sep38Rate: '162.50',
      createdAt: now,
      paidAt: null,
      settledAt: null,
    },
  ]).returning();

  console.log(`✅ Seeded ${seededBills.length} bills for Nida Reyes`);

  // Seed horizon events
  const seededEvents = await db.insert(horizonEvents).values([
    {
      eventType: 'payment',
      txHash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      amount: '16.0000000',
      memo: 'MERALCO-123456789-2600',
      fromAddress: 'GNIDA123REYESSTELLARADDRESSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      toAddress: 'GANCHOR456DESTINATIONXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      createdAt: jan10,
    },
    {
      eventType: 'payment',
      txHash: 'f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2',
      amount: '2.9538462',
      memo: 'MANILAWATER-987654321-480',
      fromAddress: 'GNIDA123REYESSTELLARADDRESSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      toAddress: 'GANCHOR456DESTINATIONXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      createdAt: jan10,
    },
    {
      eventType: 'payment',
      txHash: 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
      amount: '7.9938462',
      memo: 'PLDTFIBER-111222333-1299',
      fromAddress: 'GNIDA123REYESSTELLARADDRESSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      toAddress: 'GANCHOR456DESTINATIONXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      createdAt: jan20,
    },
  ]).returning();

  console.log(`✅ Seeded ${seededEvents.length} Horizon SSE events`);

  console.log('\n📊 Summary:');
  console.log('  User: Nida Reyes (Davao City, PH)');
  console.log('  Bills: 4 (2 settled, 1 paid, 1 pending)');
  console.log('  Total paid this month: ₱4,379');
  console.log('  USDC used: 26.95 USDC @ 1 USDC = ₱162.50');
  console.log('  SEP-38 rate: 162.50 PHP per USDC');
  console.log('');
  console.log('🌟 Demo keypair (testnet only):');
  console.log('  Pubkey: GNIDA123REYESSTELLARADDRESSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
  console.log('  Muxed: encode with householdId = 1001');
  console.log('');
  console.log('✅ Seed complete! Run: pnpm run dev');

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

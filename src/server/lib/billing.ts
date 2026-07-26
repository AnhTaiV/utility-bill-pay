/**
 * Core billing utility functions for BayadinBills
 */

export const PHP_TO_USDC_RATE = 162.5; // 1 USDC = ₱162.50
export const USDC_DECIMALS = 7; // Stellar classic assets use 7 decimal places
export const STROOPS_PER_USDC = 10_000_000n; // 1 USDC = 10,000,000 stroops

/**
 * Convert PHP amount to USDC amount (as a decimal string).
 * Example: ₱2,600 at rate 162.50 = 16.0000000 USDC
 */
export function phpToUsdc(amountPhp: number, rate: number = PHP_TO_USDC_RATE): string {
  if (rate <= 0) throw new Error('Rate must be positive');
  const usdcAmount = amountPhp / rate;
  return usdcAmount.toFixed(7);
}

/**
 * Convert PHP amount to USDC in stroops (bigint, 7 decimal places).
 */
export function phpToUsdcStroops(amountPhp: number, rate: number = PHP_TO_USDC_RATE): bigint {
  if (rate <= 0) throw new Error('Rate must be positive');
  const usdcAmount = amountPhp / rate;
  return BigInt(Math.round(usdcAmount * 10_000_000));
}

/**
 * Convert USDC stroops back to a human-readable amount string.
 */
export function stroopsToUsdc(stroops: bigint): string {
  const whole = stroops / STROOPS_PER_USDC;
  const remainder = stroops % STROOPS_PER_USDC;
  const decimal = remainder.toString().padStart(7, '0');
  return `${whole}.${decimal}`;
}

/**
 * Generate a memo reference for a bill payment.
 * Format: BILLER-ACCOUNTNO-AMOUNT
 * Example: MERALCO-123456789-2600
 */
export function generateMemoRef(
  billerName: string,
  accountNumber: string,
  amountPhp: number,
): string {
  const sanitized = billerName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  const acc = accountNumber.replace(/[^0-9]/g, '').slice(0, 12);
  return `${sanitized}-${acc}-${Math.round(amountPhp)}`.slice(0, 28);
}

/**
 * Generate a SEP-7 payment URI with text memo.
 */
export function generateSep7Uri(params: {
  destination: string;
  amount: string;
  assetCode: string;
  assetIssuer: string;
  memo: string;
  memoType?: string;
}): string {
  const { destination, amount, assetCode, assetIssuer, memo, memoType = 'MEMO_TEXT' } = params;
  const base = `web+stellar:pay?destination=${destination}`;
  const query = new URLSearchParams({
    amount,
    asset_code: assetCode,
    asset_issuer: assetIssuer,
    memo,
    memo_type: memoType,
  });
  return `${base}&${query.toString()}`;
}

/**
 * Parse a SEP-7 payment URI and extract components.
 */
export function parseSep7Uri(uri: string): {
  destination: string;
  amount: string;
  assetCode: string;
  assetIssuer: string;
  memo: string;
  memoType: string;
} | null {
  try {
    if (!uri.startsWith('web+stellar:pay?')) return null;
    const queryStr = uri.replace('web+stellar:pay?', '');
    const params = new URLSearchParams(queryStr);
    return {
      destination: params.get('destination') ?? '',
      amount: params.get('amount') ?? '',
      assetCode: params.get('asset_code') ?? '',
      assetIssuer: params.get('asset_issuer') ?? '',
      memo: params.get('memo') ?? '',
      memoType: params.get('memo_type') ?? 'MEMO_TEXT',
    };
  } catch {
    return null;
  }
}

/**
 * Bill status state machine transitions.
 */
export type BillStatus = 'pending' | 'paid' | 'settled' | 'failed';

export const VALID_STATUS_TRANSITIONS: Record<BillStatus, BillStatus[]> = {
  pending: ['paid', 'failed'],
  paid: ['settled', 'failed'],
  settled: [],
  failed: ['pending'],
};

export function canTransition(from: BillStatus, to: BillStatus): boolean {
  return VALID_STATUS_TRANSITIONS[from].includes(to);
}

/**
 * Parse Horizon SSE event data.
 */
export interface HorizonPaymentEvent {
  id: string;
  type: string;
  amount: string;
  asset_code?: string;
  asset_issuer?: string;
  from: string;
  to: string;
  transaction_hash: string;
  memo?: string;
}

export function parseSseChunk(chunk: string): HorizonPaymentEvent[] {
  const events: HorizonPaymentEvent[] = [];
  const lines = chunk.split('\n\n');
  for (const block of lines) {
    const dataLine = block
      .split('\n')
      .find((l) => l.startsWith('data:'));
    if (!dataLine) continue;
    try {
      const json = JSON.parse(dataLine.slice(5).trim());
      if (json.type === 'payment') {
        events.push(json as HorizonPaymentEvent);
      }
    } catch {
      // skip malformed chunks
    }
  }
  return events;
}

/**
 * SEP-38 rate calculation utilities.
 */
export function calculateSep38Rate(phpAmount: number, usdcAmount: number): number {
  if (usdcAmount <= 0) return 0;
  return phpAmount / usdcAmount;
}

export function applySlippage(rate: number, slippagePct: number): number {
  return rate * (1 - slippagePct / 100);
}

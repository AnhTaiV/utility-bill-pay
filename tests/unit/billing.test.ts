import { describe, expect, it } from 'vitest';
import {
  phpToUsdc,
  phpToUsdcStroops,
  stroopsToUsdc,
  generateMemoRef,
  generateSep7Uri,
  parseSep7Uri,
  canTransition,
  parseSseChunk,
  calculateSep38Rate,
  applySlippage,
  VALID_STATUS_TRANSITIONS,
  type BillStatus,
} from '../../src/server/lib/billing';

describe('phpToUsdc', () => {
  it('converts PHP to USDC at default rate', () => {
    const result = phpToUsdc(2600, 162.5);
    expect(parseFloat(result)).toBeCloseTo(16.0, 1);
  });

  it('returns 7 decimal places', () => {
    const result = phpToUsdc(480, 162.5);
    expect(result).toMatch(/^\d+\.\d{7}$/);
  });

  it('throws on zero rate', () => {
    expect(() => phpToUsdc(100, 0)).toThrow('Rate must be positive');
  });

  it('handles small amounts correctly', () => {
    const result = phpToUsdc(50, 162.5);
    expect(parseFloat(result)).toBeCloseTo(0.3077, 2);
  });

  it('converts 1299 PHP correctly', () => {
    const result = phpToUsdc(1299, 162.5);
    expect(parseFloat(result)).toBeCloseTo(7.9938, 2);
  });
});

describe('phpToUsdcStroops', () => {
  it('converts PHP to USDC in stroops', () => {
    const result = phpToUsdcStroops(2600, 162.5);
    expect(result).toBe(160000000n); // 16.0 USDC * 10_000_000
  });

  it('returns bigint', () => {
    expect(typeof phpToUsdcStroops(100, 162.5)).toBe('bigint');
  });

  it('throws on negative rate', () => {
    expect(() => phpToUsdcStroops(100, -1)).toThrow('Rate must be positive');
  });
});

describe('stroopsToUsdc', () => {
  it('converts stroops to USDC string', () => {
    const result = stroopsToUsdc(160000000n);
    expect(result).toBe('16.0000000');
  });

  it('handles fractional USDC', () => {
    const result = stroopsToUsdc(1234567n);
    expect(result).toBe('0.1234567');
  });
});

describe('generateMemoRef', () => {
  it('generates correct format', () => {
    const memo = generateMemoRef('MERALCO', '123456789', 2600);
    expect(memo).toBe('MERALCO-123456789-2600');
  });

  it('sanitizes biller name', () => {
    const memo = generateMemoRef('Manila Water', '987654321', 480);
    expect(memo).toBe('MANILAWATER-987654321-480');
  });

  it('truncates long biller names', () => {
    const memo = generateMemoRef('VeryLongBillerNameCompany', '111', 100);
    expect(memo.split('-')[0].length).toBeLessThanOrEqual(12);
  });

  it('handles PLDT biller name', () => {
    const memo = generateMemoRef('PLDT Fiber', '111222333', 1299);
    expect(memo).toBe('PLDTFIBER-111222333-1299');
  });

  it('rounds amount to integer', () => {
    const memo = generateMemoRef('TEST', '123', 1800.5);
    expect(memo).toContain('-1801');
  });
});

describe('generateSep7Uri', () => {
  const params = {
    destination: 'GDEMOHOUSEHOLDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    amount: '16.0000000',
    assetCode: 'USDC',
    assetIssuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    memo: 'MERALCO-123456789-2600',
  };

  it('starts with web+stellar:pay?', () => {
    const uri = generateSep7Uri(params);
    expect(uri).toMatch(/^web\+stellar:pay\?/);
  });

  it('includes destination', () => {
    const uri = generateSep7Uri(params);
    expect(uri).toContain(`destination=${params.destination}`);
  });

  it('includes memo', () => {
    const uri = generateSep7Uri(params);
    expect(uri).toContain('memo=MERALCO-123456789-2600');
  });

  it('includes MEMO_TEXT type by default', () => {
    const uri = generateSep7Uri(params);
    expect(uri).toContain('memo_type=MEMO_TEXT');
  });
});

describe('parseSep7Uri', () => {
  it('parses a valid SEP-7 URI', () => {
    const uri = 'web+stellar:pay?destination=GDEST&amount=16.0&asset_code=USDC&asset_issuer=GISS&memo=REF&memo_type=MEMO_TEXT';
    const result = parseSep7Uri(uri);
    expect(result).not.toBeNull();
    expect(result?.destination).toBe('GDEST');
    expect(result?.memo).toBe('REF');
    expect(result?.assetCode).toBe('USDC');
  });

  it('returns null for invalid URI', () => {
    expect(parseSep7Uri('https://example.com')).toBeNull();
  });
});

describe('bill status state machine', () => {
  it('allows pending -> paid', () => {
    expect(canTransition('pending', 'paid')).toBe(true);
  });

  it('allows pending -> failed', () => {
    expect(canTransition('pending', 'failed')).toBe(true);
  });

  it('allows paid -> settled', () => {
    expect(canTransition('paid', 'settled')).toBe(true);
  });

  it('allows paid -> failed', () => {
    expect(canTransition('paid', 'failed')).toBe(true);
  });

  it('rejects settled -> paid', () => {
    expect(canTransition('settled', 'paid')).toBe(false);
  });

  it('rejects pending -> settled directly', () => {
    expect(canTransition('pending', 'settled')).toBe(false);
  });

  it('allows failed -> pending retry', () => {
    expect(canTransition('failed', 'pending')).toBe(true);
  });

  it('has no transitions from settled', () => {
    expect(VALID_STATUS_TRANSITIONS.settled).toHaveLength(0);
  });
});

describe('parseSseChunk', () => {
  it('parses a valid SSE payment event', () => {
    const chunk = `data: ${JSON.stringify({
      type: 'payment',
      id: 'evt1',
      amount: '16.0000000',
      asset_code: 'USDC',
      from: 'GSEND',
      to: 'GRECV',
      transaction_hash: 'abc123',
      memo: 'MERALCO-123456789-2600',
    })}\n\n`;

    const events = parseSseChunk(chunk);
    expect(events).toHaveLength(1);
    expect(events[0]?.transaction_hash).toBe('abc123');
    expect(events[0]?.memo).toBe('MERALCO-123456789-2600');
  });

  it('skips non-payment events', () => {
    const chunk = `data: ${JSON.stringify({ type: 'account_credited', id: 'x' })}\n\n`;
    const events = parseSseChunk(chunk);
    expect(events).toHaveLength(0);
  });

  it('handles malformed JSON gracefully', () => {
    const chunk = 'data: not-json\n\n';
    expect(() => parseSseChunk(chunk)).not.toThrow();
  });

  it('parses multiple events in one chunk', () => {
    const e1 = { type: 'payment', id: '1', amount: '5', from: 'A', to: 'B', transaction_hash: 'h1' };
    const e2 = { type: 'payment', id: '2', amount: '10', from: 'C', to: 'D', transaction_hash: 'h2' };
    const chunk = `data: ${JSON.stringify(e1)}\n\ndata: ${JSON.stringify(e2)}\n\n`;
    const events = parseSseChunk(chunk);
    expect(events).toHaveLength(2);
  });
});

describe('SEP-38 rate utilities', () => {
  it('calculates rate from PHP and USDC amounts', () => {
    const rate = calculateSep38Rate(4379, 26.95);
    expect(rate).toBeCloseTo(162.5, 0);
  });

  it('returns 0 for zero USDC amount', () => {
    expect(calculateSep38Rate(100, 0)).toBe(0);
  });

  it('applies slippage correctly', () => {
    const rateWithSlippage = applySlippage(162.5, 1); // 1% slippage
    expect(rateWithSlippage).toBeCloseTo(160.875, 2);
  });

  it('handles zero slippage', () => {
    expect(applySlippage(162.5, 0)).toBe(162.5);
  });
});

describe('http lib', () => {
  it('imports AppError from http lib', async () => {
    const { AppError } = await import('../../src/server/lib/http');
    const err = new AppError('NOT_FOUND', 'Bill not found', 404);
    expect(err.status).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Bill not found');
    expect(err.name).toBe('AppError');
  });
});

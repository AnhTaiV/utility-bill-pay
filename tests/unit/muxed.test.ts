import { describe, expect, it } from 'vitest';
import { encodeMuxedAddress, decodeMuxedAddress, isValidPublicKey } from '../../src/server/lib/muxed';

const TEST_PUBLIC_KEY = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

describe('muxed account encoding (SEP-23)', () => {
  it('encodes a household_id into a muxed address', () => {
    const muxed = encodeMuxedAddress(TEST_PUBLIC_KEY, 1001n);
    expect(muxed).toMatch(/^M/);
    expect(muxed.length).toBeGreaterThan(50);
  });

  it('different household_ids produce different muxed addresses', () => {
    const muxed1 = encodeMuxedAddress(TEST_PUBLIC_KEY, 1001n);
    const muxed2 = encodeMuxedAddress(TEST_PUBLIC_KEY, 1002n);
    expect(muxed1).not.toBe(muxed2);
  });

  it('decodes a muxed address back to base + household_id', () => {
    const householdId = 42n;
    const muxed = encodeMuxedAddress(TEST_PUBLIC_KEY, householdId);
    const decoded = decodeMuxedAddress(muxed);
    expect(decoded).not.toBeNull();
    expect(decoded?.baseAddress).toBe(TEST_PUBLIC_KEY);
    expect(decoded?.householdId).toBe(householdId);
  });

  it('returns null for non-muxed G address', () => {
    const result = decodeMuxedAddress(TEST_PUBLIC_KEY);
    expect(result).toBeNull();
  });

  it('returns null for invalid address', () => {
    const result = decodeMuxedAddress('not-a-stellar-address');
    expect(result).toBeNull();
  });

  it('roundtrip encodes household_id 0', () => {
    const muxed = encodeMuxedAddress(TEST_PUBLIC_KEY, 0n);
    const decoded = decodeMuxedAddress(muxed);
    expect(decoded?.householdId).toBe(0n);
  });
});

describe('isValidPublicKey', () => {
  it('returns true for valid G address', () => {
    expect(isValidPublicKey(TEST_PUBLIC_KEY)).toBe(true);
  });

  it('returns false for invalid address', () => {
    expect(isValidPublicKey('INVALID')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidPublicKey('')).toBe(false);
  });
});

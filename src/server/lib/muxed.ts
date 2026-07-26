import { Account, MuxedAccount, StrKey } from '@stellar/stellar-sdk';

/**
 * Encode a household_id (numeric) into a Stellar muxed address (SEP-23 / MEP-2).
 * The base account must be a valid G... Stellar address.
 */
export function encodeMuxedAddress(baseAddress: string, householdId: bigint): string {
  const account = new Account(baseAddress, '0');
  const muxed = new MuxedAccount(account, householdId.toString());
  return muxed.accountId();
}

/**
 * Decode a muxed address (M...) back to { baseAddress, householdId }.
 * Returns null if the address is not muxed.
 */
export function decodeMuxedAddress(
  muxedAddress: string,
): { baseAddress: string; householdId: bigint } | null {
  try {
    if (!muxedAddress.startsWith('M')) return null;
    const muxed = MuxedAccount.fromAddress(muxedAddress, '0');
    return {
      baseAddress: muxed.baseAccount().accountId(),
      householdId: BigInt(muxed.id()),
    };
  } catch {
    return null;
  }
}

/**
 * Validate a G... Stellar public key.
 */
export function isValidPublicKey(address: string): boolean {
  return StrKey.isValidEd25519PublicKey(address);
}

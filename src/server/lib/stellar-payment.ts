import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Memo,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import { env, USDC_ASSET_ISSUER } from '@/server/config/env';
import { AppError } from '@/server/lib/http';

export function getServer(): Horizon.Server {
  return new Horizon.Server(env.STELLAR_HORIZON_URL, { allowHttp: false });
}

export function getUsdcAsset(): Asset {
  return new Asset(env.USDC_ASSET_CODE, USDC_ASSET_ISSUER);
}

export function getNetworkPassphrase(): string {
  return env.STELLAR_NETWORK_PASSPHRASE;
}

export function validateStellarAddress(address: string): void {
  try {
    Keypair.fromPublicKey(address);
  } catch {
    throw new AppError('INVALID_INPUT', `Invalid Stellar address: ${address}`, 400);
  }
}

function amountFromMinor(amountMinor: string): string {
  if (!/^\d+$/.test(amountMinor) || BigInt(amountMinor) <= 0n) {
    throw new AppError('INVALID_INPUT', 'Payment amount must be a positive Stellar stroop string', 400);
  }
  const amount = BigInt(amountMinor);
  return `${amount / 10_000_000n}.${(amount % 10_000_000n).toString().padStart(7, '0')}`;
}

function memoText(memo: string): string {
  if (!memo || Buffer.byteLength(memo, 'utf8') > 28) {
    throw new AppError('INVALID_INPUT', 'Bill memo must be between 1 and 28 bytes', 400);
  }
  return memo;
}

export async function buildUnsignedBillPayment(input: {
  senderAddress: string;
  recipientAddress: string;
  amountMinor: string;
  memo: string;
}): Promise<{ unsignedXdr: string; unsignedTxDigest: string }> {
  const server = getServer();
  const sender = await server.loadAccount(input.senderAddress);
  const recipient = await server.loadAccount(input.recipientAddress);
  const asset = getUsdcAsset();
  const hasTrustline = recipient.balances.some(
    (balance) => 'asset_code' in balance && 'asset_issuer' in balance
      && balance.asset_code === asset.getCode() && balance.asset_issuer === asset.getIssuer(),
  );
  if (!hasTrustline) throw new AppError('CONFLICT', 'Billing platform has no configured USDC trustline', 409);
  const tx = new TransactionBuilder(sender, {
    fee: BASE_FEE,
    networkPassphrase: getNetworkPassphrase(),
  })
    .addMemo(Memo.text(memoText(input.memo)))
    .addOperation(Operation.payment({
      destination: input.recipientAddress,
      asset,
      amount: amountFromMinor(input.amountMinor),
    }))
    .setTimeout(60)
    .build();
  return {
    unsignedXdr: tx.toXDR(),
    unsignedTxDigest: Buffer.from(tx.hash()).toString('hex').toUpperCase(),
  };
}

export async function submitSignedBillPayment(input: {
  signedXdr: string;
  senderAddress: string;
  recipientAddress: string;
  amountMinor: string;
  memo: string;
}): Promise<{ txHash: string; ledger: number }> {
  let tx: ReturnType<typeof TransactionBuilder.fromXDR>;
  try {
    tx = TransactionBuilder.fromXDR(input.signedXdr, getNetworkPassphrase());
  } catch {
    throw new AppError('INVALID_INPUT', 'signedXdr is not valid for the configured network', 400);
  }
  const source = (tx as unknown as { source?: string }).source;
  if (source !== input.senderAddress || tx.signatures.length === 0) {
    throw new AppError('UNAUTHORIZED', 'Transaction is not signed by the bill payer', 401);
  }
  const signer = Keypair.fromPublicKey(input.senderAddress);
  if (!tx.signatures.some((signature) => {
    try { return signer.verify(tx.hash(), signature.signature()); } catch { return false; }
  })) throw new AppError('UNAUTHORIZED', 'Bill payer signature did not verify', 401);
  const operations = tx.operations;
  if (operations.length !== 1 || operations[0]?.type !== 'payment') {
    throw new AppError('INVALID_INPUT', 'Transaction must contain exactly one payment operation', 400);
  }
  const operation = operations[0] as typeof operations[number] & { destination?: string; amount?: string; asset?: Asset };
  const configured = getUsdcAsset();
  const memo = (tx as unknown as { memo?: { type?: string; value?: string } }).memo;
  if (
    operation.destination !== input.recipientAddress ||
    operation.amount !== amountFromMinor(input.amountMinor) ||
    operation.asset?.getCode?.() !== configured.getCode() ||
    operation.asset?.getIssuer?.() !== configured.getIssuer() ||
    memo?.type !== 'text' || memo.value !== memoText(input.memo)
  ) throw new AppError('INVALID_INPUT', 'Signed transaction does not match the bill payment intent', 400);

  const txHash = Buffer.from(tx.hash()).toString('hex').toUpperCase();
  try {
    const existing = await getServer().transactions().transaction(txHash).call();
    if (existing.successful !== true) throw new AppError('CONFLICT', 'Previous bill payment was not successful', 409);
    const ledger = (existing as unknown as { ledger?: number }).ledger;
    return { txHash, ledger: ledger ?? 0 };
  } catch (err) {
    const status = typeof err === 'object' && err !== null && 'response' in err
      ? (err as { response?: { status?: number } }).response?.status
      : undefined;
    if (status !== 404) throw err;
  }
  const result = await getServer().submitTransaction(tx);
  if (!result.hash || !Number.isInteger(result.ledger)) throw new AppError('INTERNAL', 'Horizon confirmation was incomplete', 502);
  return { txHash: result.hash, ledger: result.ledger };
}

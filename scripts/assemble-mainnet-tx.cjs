const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {
  Address,
  Networks,
  Operation,
  TransactionBuilder,
  nativeToScVal,
  rpc,
} = require('@stellar/stellar-sdk');

const SOURCE = process.env.STELLAR_SOURCE || 'GDFVJ3HRX2BBZ5BC5OUWV2PRAXY675WC5MHVZPV22XSPUPHRAP66S3MY';
const RECIPIENT = process.env.STELLAR_RECIPIENT || 'GAK3WH5HNKKSSFDUHFXBUG6X57RMTFZJ4R3SB3GEVDNT6D5QMMO5PQEO';
const ASSET = process.env.STELLAR_ASSET || 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
const RPC_URL = process.env.STELLAR_RPC_URL || 'https://mainnet.sorobanrpc.com';
const ROOT = path.resolve(__dirname, '..');
const WASM_PATH = path.resolve(
  ROOT,
  'contracts/payment-proof/target/wasm32v1-none/release/utility_payment_proof_contract.wasm',
);
const SALT = crypto.createHash('sha256').update('034-utility-payment-proof-v1').digest();

function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function outputPath(stage) {
  return path.resolve(ROOT, `contracts/payment-proof/mainnet-${stage}-assembled.xdr`);
}

function address(value) {
  return Address.fromString(value).toScVal();
}

async function main() {
  const stage = option('stage');
  const contractId = option('contract-id');
  const allowed = ['upload', 'deploy', 'initialize', 'create-payment', 'confirm-payment'];
  if (!allowed.includes(stage)) {
    throw new Error(`Usage: node scripts/assemble-mainnet-tx.cjs --stage ${allowed.join('|')} [--contract-id C...]`);
  }
  if (!fs.existsSync(WASM_PATH)) {
    throw new Error(`WASM not found: ${WASM_PATH}. Build it first with the command in contracts/TESTNET_RUNBOOK.md`);
  }
  if (stage !== 'upload' && stage !== 'deploy' && !contractId) {
    throw new Error(`--contract-id C... is required for ${stage}`);
  }

  const server = new rpc.Server(RPC_URL);
  const account = await server.getAccount(SOURCE);
  const builder = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase: Networks.PUBLIC,
  });

  if (stage === 'upload') {
    builder.addOperation(Operation.uploadContractWasm({ wasm: fs.readFileSync(WASM_PATH) }));
  } else if (stage === 'deploy') {
    const wasmHash = crypto.createHash('sha256').update(fs.readFileSync(WASM_PATH)).digest();
    builder.addOperation(Operation.createCustomContract({
      address: Address.fromString(SOURCE),
      wasmHash,
      salt: SALT,
    }));
  } else if (stage === 'initialize') {
    builder.addOperation(Operation.invokeContractFunction({
      contract: contractId,
      function: 'initialize',
      args: [address(SOURCE)],
    }));
  } else if (stage === 'create-payment') {
    const paymentId = BigInt(option('payment-id', '34034'));
    const memo = BigInt(option('memo', '34034'));
    const amount = BigInt(option('amount', '1000000'));
    const expiresLedger = Number(option('expires-ledger', '0'))
      || (await server.getLatestLedger()).sequence + 10_000;
    builder.addOperation(Operation.invokeContractFunction({
      contract: contractId,
      function: 'create_payment',
      args: [
        nativeToScVal(paymentId, { type: 'u64' }),
        address(SOURCE),
        address(option('recipient', RECIPIENT)),
        address(option('asset', ASSET)),
        nativeToScVal(amount, { type: 'i128' }),
        nativeToScVal(memo, { type: 'u64' }),
        nativeToScVal(expiresLedger, { type: 'u32' }),
      ],
    }));
  } else {
    const txRef = option('tx-ref');
    if (!txRef) throw new Error('--tx-ref is required for confirm-payment; use the verified Horizon payment hash');
    builder.addOperation(Operation.invokeContractFunction({
      contract: contractId,
      function: 'confirm_payment',
      args: [nativeToScVal(BigInt(option('payment-id', '34034')), { type: 'u64' }), nativeToScVal(txRef, { type: 'string' })],
    }));
  }

  const raw = builder.setTimeout(86_400).build();
  const simulation = await server.simulateTransaction(raw);
  if (simulation.error) throw new Error(simulation.error);
  const assembled = rpc.assembleTransaction(raw, simulation).build();
  const xdr = assembled.toXDR();
  const destination = outputPath(stage);
  fs.writeFileSync(destination, `${xdr}\n`, { mode: 0o600 });
  const report = {
    stage,
    source: SOURCE,
    contractId: contractId || null,
    recipient: stage === 'create-payment' ? option('recipient', RECIPIENT) : undefined,
    asset: stage === 'create-payment' ? option('asset', ASSET) : undefined,
    paymentId: stage === 'create-payment' || stage === 'confirm-payment' ? option('payment-id', '34034') : undefined,
    hash: assembled.hash().toString('hex'),
    sequence: assembled.sequence.toString(),
    minResourceFee: simulation.minResourceFee,
    latestLedger: simulation.latestLedger,
    wasmSha256: crypto.createHash('sha256').update(fs.readFileSync(WASM_PATH)).digest('hex'),
    outputPath: destination,
    xdr,
  };
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const manifestUrl = new URL(
  "../contracts/payment-proof/deployment.json",
  import.meta.url,
);
const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
const mainnet = manifest.mainnet;

assert.equal(manifest.projectId, "034");
assert.equal(mainnet.status, "functional-mainnet");
assert.match(mainnet.contractId, /^C[A-Z2-7]{55}$/);

for (const field of [
  "uploadTxHash",
  "deploymentTxHash",
  "initializeTxHash",
  "functionalTxHash",
]) {
  assert.match(mainnet[field], /^[0-9a-f]{64}$/, `${field} must be a tx hash`);
}

console.log(`034 Mainnet manifest verified: ${mainnet.contractId}`);

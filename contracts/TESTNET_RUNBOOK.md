# 034 Soroban deployment runbook

Build the contract and assemble one unsigned, simulated XDR at a time. The
script never receives a secret key and never broadcasts a transaction.

```bash
RUSTC="$(rustup which rustc)" cargo build \
  --manifest-path contracts/payment-proof/Cargo.toml \
  --target wasm32v1-none --release
```

Use the public network script:

```bash
node scripts/assemble-mainnet-tx.cjs --stage upload
node scripts/assemble-mainnet-tx.cjs --stage deploy
node scripts/assemble-mainnet-tx.cjs --stage initialize --contract-id C...
node scripts/assemble-mainnet-tx.cjs --stage create-payment --contract-id C...
```

After each command, paste the XDR into Stellar Lab, choose **Public Network**,
simulate with **Enforce**, sign with the repo wallet in Freighter, and submit.
Wait for the transaction hash before generating the next stage so the sequence
number stays current. The deploy result contains the contract ID. `create-payment`
records a minimal utility-bill payment intent; `confirm-payment` must only be
assembled with a real, successfully verified Horizon payment hash:

```bash
node scripts/assemble-mainnet-tx.cjs --stage confirm-payment \
  --contract-id C... --tx-ref <verified-payment-hash>
```

Record the successful hashes and contract ID in `payment-proof/deployment.json`.

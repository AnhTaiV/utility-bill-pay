# Utility Bill Pay

Utility bill payment coordination with Stellar settlement and a bill-provider reconciliation boundary.

## Stellar surface

- Horizon payment intent and exact settlement proof
- Bill reference and provider settlement state
- Mainnet operations are signer-controlled and idempotent

## Readiness status

The Soroban settlement registry is deployed on Stellar Mainnet and has a
verified `create_payment` functional call. Demo fixtures remain gated to the
demo mode; the deployment evidence is recorded in
`contracts/payment-proof/deployment.json`.

See [`docs/MAINNET_READINESS.md`](docs/MAINNET_READINESS.md).

## Local demo

The public hackathon demo runs with `DEMO_MODE=true` by default. It includes four seeded bills, biller categories, a live payment feed, bill detail pages, and new bill creation without requiring PostgreSQL credentials. New demo bills are intentionally ephemeral on serverless restarts.

Screenshots are included in [`screen-shot/`](screen-shot/). Never commit provider credentials or wallet secrets.

## Mainnet gate

Mainnet requires exact payment proof, bill-provider confirmation, idempotent callbacks, retries with reconciliation, and an external signer.

## Payment flow

1. `POST /api/bills` creates a bill and returns a one-time `orderAccessToken`.
2. `POST /api/bills/:id/prepare` requires `X-Bill-Token` and `Idempotency-Key`, checks the configured Horizon account/trustline, and returns unsigned XDR plus its digest.
3. The payer signs the XDR in an external wallet. The server never receives or stores a secret key.
4. `POST /api/bills/:id/confirm` verifies the network, payer signature, recipient, USDC issuer, exact 7-decimal amount, memo, and Horizon result before marking the bill paid.

Apply `drizzle/0001_mainnet_payment_intents.sql` before using the payment routes against an existing database. Configure `STELLAR_NETWORK=public`, Horizon, the public USDC issuer, and an explicit platform address for mainnet.

## Soroban MVP artifact

The minimal settlement registry is in [`contracts/payment-proof/`](contracts/payment-proof/).
The app still owns bill-provider reconciliation and the classic USDC payment;
the contract stores the verified settlement reference. Run
`cargo test --manifest-path contracts/payment-proof/Cargo.toml`.

Mainnet XDR preparation is documented in [`contracts/TESTNET_RUNBOOK.md`](contracts/TESTNET_RUNBOOK.md).
The signer must review and sign each XDR externally; private keys are never
stored by this repository or its scripts.

Mainnet contract: `CDC4YHWXY3FG4JFXTLN4YJINMVFQ6BIJUUTM6SQ3FXO56HJNXXVAV2WZ`

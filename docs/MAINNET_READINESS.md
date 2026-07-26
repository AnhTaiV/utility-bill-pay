# Mainnet readiness

Concept: bill reference creation, Stellar payment, and utility-provider settlement.

Current evidence: the demo has a signer-safe prepare/confirm boundary, exact Stellar payment verification, bearer-token protection for bill intents, and Horizon reconciliation. There is still no live mainnet transaction evidence or provider settlement adapter.

Required gates: server-side Horizon proof for recipient/asset/amount, provider callback authentication, idempotency, replay protection, reconciliation, and real testnet/mainnet transaction links.

Status: **not mainnet-ready**. The Stellar payment boundary is prepared, but a production deployment still requires the migration, external signer/wallet integration, provider callback authentication, and a real mainnet proof. Demo seed execution is blocked on public network unless `DEMO_MODE=true`.

# Mainnet readiness

Concept: bill reference creation, Stellar payment, and utility-provider settlement.

Current evidence: the demo has a signer-safe prepare/confirm boundary, exact
Stellar payment verification, bearer-token protection for bill intents, and
Horizon reconciliation. The Soroban payment-proof registry is deployed on
Stellar Mainnet and `create_payment` has a verified successful transaction.

Required gates: server-side Horizon proof for recipient/asset/amount, provider callback authentication, idempotency, replay protection, reconciliation, and real testnet/mainnet transaction links.

Status: **functional Mainnet contract flow verified**. Provider settlement,
production database migration, and external signer integration remain separate
application hardening items. Demo seed execution is blocked on public network
unless `DEMO_MODE=true`.

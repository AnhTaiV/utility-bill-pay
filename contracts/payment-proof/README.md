# PaymentProof contract

Minimal Soroban registry for a utility-bill payment intent. The classic USDC
payment and provider reconciliation stay in the application; a verified
settlement reference is recorded on-chain by `confirm_payment`.

```bash
cargo test --manifest-path contracts/payment-proof/Cargo.toml
```
